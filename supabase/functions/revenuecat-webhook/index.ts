import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const PREMIUM_ENTITLEMENT = "premium";

type RevenueCatEvent = {
  id?: string;
  type?: string;
  app_user_id?: string;
  transferred_from?: string[];
  transferred_to?: string[];
};

function unauthorized(): Response {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

function isAuthorized(req: Request, secret: string): boolean {
  const header = req.headers.get("Authorization") ?? "";
  if (!header || !secret) return false;
  return header === secret || header === `Bearer ${secret}`;
}

async function fetchIsPremiumFromRevenueCat(
  appUserId: string,
  secretKey: string,
): Promise<boolean> {
  const res = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        Accept: "application/json",
      },
    },
  );

  if (res.status === 404) return false;
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`RevenueCat ${res.status}: ${body}`);
  }

  const json = await res.json();
  const entitlement = json?.subscriber?.entitlements?.[PREMIUM_ENTITLEMENT];
  if (!entitlement) return false;
  if (!entitlement.expires_date) return true;
  return new Date(entitlement.expires_date).getTime() > Date.now();
}

async function syncUserPremium(
  admin: ReturnType<typeof createClient>,
  appUserId: string,
  rcSecret: string,
): Promise<boolean | null> {
  // Only sync real Supabase user UUIDs (ignore anonymous $RCAnonymousID:…)
  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(appUserId)) {
    console.warn("Skipping non-UUID app_user_id:", appUserId);
    return null;
  }

  const isPremium = await fetchIsPremiumFromRevenueCat(appUserId, rcSecret);
  const { error } = await admin
    .from("users")
    .update({ is_premium: isPremium })
    .eq("id", appUserId);

  if (error) throw error;
  return isPremium;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const webhookSecret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
    const rcSecret = Deno.env.get("REVENUECAT_SECRET_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!webhookSecret || !rcSecret || !supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!isAuthorized(req, webhookSecret)) {
      return unauthorized();
    }

    const payload = await req.json();
    const event = (payload?.event ?? payload) as RevenueCatEvent;
    const eventId = event.id;
    const eventType = event.type ?? "UNKNOWN";

    const admin = createClient(supabaseUrl, serviceRoleKey);

    if (eventId) {
      const { error: insertError } = await admin
        .from("billing_webhook_events")
        .insert({
          id: eventId,
          event_type: eventType,
          app_user_id: event.app_user_id ?? null,
        });

      // Unique violation => already processed
      if (insertError) {
        if (insertError.code === "23505") {
          return new Response(JSON.stringify({ ok: true, duplicate: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        throw insertError;
      }
    }

    const userIds = new Set<string>();
    if (event.app_user_id) userIds.add(event.app_user_id);
    for (const id of event.transferred_from ?? []) userIds.add(id);
    for (const id of event.transferred_to ?? []) userIds.add(id);

    const results: Record<string, boolean | null> = {};
    for (const userId of userIds) {
      results[userId] = await syncUserPremium(admin, userId, rcSecret);
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("revenuecat-webhook error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
