import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const BATCH_SIZE = 100;

type PushEvent = "meeting_scheduled" | "doors_open" | "poll_active";

type DispatchBody = {
  event?: PushEvent;
  meeting_id?: string;
  poll_id?: string;
  group_id?: string;
  title?: string;
};

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  sound: "default";
  data: {
    type: PushEvent;
    meetingId: string;
    pollId?: string;
  };
};

type ExpoTicket = {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
};

function unauthorized(): Response {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

function isAuthorized(req: Request, secret: string): boolean {
  if (!secret) return false;
  const header = req.headers.get("x-push-secret") ?? "";
  const auth = req.headers.get("Authorization") ?? "";
  return header === secret || auth === `Bearer ${secret}` || auth === secret;
}

function copyForEvent(
  event: PushEvent,
  title: string,
): { title: string; body: string } {
  switch (event) {
    case "meeting_scheduled":
      return {
        title: "Nueva asamblea",
        body: `Se ha programado: ${title}`,
      };
    case "doors_open":
      return {
        title: "Acreditaciones abiertas",
        body: `Ya puedes acreditarte en: ${title}`,
      };
    case "poll_active":
      return {
        title: "Votación abierta",
        body: `Urna abierta: ${title}`,
      };
  }
}

async function sendExpoPush(
  messages: ExpoPushMessage[],
  accessToken: string | undefined,
): Promise<ExpoTicket[]> {
  const tickets: ExpoTicket[] = [];

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const chunk = messages.slice(i, i + BATCH_SIZE);
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(chunk),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Expo push ${res.status}: ${text}`);
    }

    const json = await res.json();
    const data = (json?.data ?? []) as ExpoTicket[];
    tickets.push(...data);
  }

  return tickets;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type, x-push-secret",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const pushSecret = Deno.env.get("PUSH_DISPATCH_SECRET");
  if (!pushSecret || !isAuthorized(req, pushSecret)) {
    return unauthorized();
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: DispatchBody;
  try {
    body = (await req.json()) as DispatchBody;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const event = body.event;
  const meetingId = body.meeting_id;
  if (
    !event ||
    !meetingId ||
    !["meeting_scheduled", "doors_open", "poll_active"].includes(event)
  ) {
    return new Response(JSON.stringify({ error: "Invalid payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const displayTitle = (body.title ?? "Asamblea").trim() || "Asamblea";

  let userIds: string[] = [];

  if (event === "poll_active") {
    const { data, error } = await admin
      .from("meeting_attendances")
      .select("user_id, users!inner(notify_polls)")
      .eq("meeting_id", meetingId);

    if (error) {
      console.error("attendances query failed", error);
      return new Response(JSON.stringify({ error: "Query failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    userIds = (data ?? [])
      .filter((row: { users?: { notify_polls?: boolean } | { notify_polls?: boolean }[] }) => {
        const u = Array.isArray(row.users) ? row.users[0] : row.users;
        return u?.notify_polls === true;
      })
      .map((row: { user_id: string }) => row.user_id);
  } else {
    let groupId = body.group_id;
    if (!groupId) {
      const { data: meeting, error: meetingError } = await admin
        .from("meetings")
        .select("group_id, title")
        .eq("id", meetingId)
        .single();

      if (meetingError || !meeting) {
        return new Response(JSON.stringify({ error: "Meeting not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      groupId = meeting.group_id;
    }

    const prefColumn =
      event === "meeting_scheduled" ? "notify_new_meetings" : "notify_doors_open";

    const { data, error } = await admin
      .from("group_members")
      .select(
        `user_id, users!inner(notify_new_meetings, notify_doors_open)`,
      )
      .eq("group_id", groupId);

    if (error) {
      console.error("group_members query failed", error);
      return new Response(JSON.stringify({ error: "Query failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    userIds = (data ?? [])
      .filter(
        (row: {
          users?:
            | { notify_new_meetings?: boolean; notify_doors_open?: boolean }
            | { notify_new_meetings?: boolean; notify_doors_open?: boolean }[];
        }) => {
          const u = Array.isArray(row.users) ? row.users[0] : row.users;
          if (!u) return false;
          return prefColumn === "notify_new_meetings"
            ? u.notify_new_meetings === true
            : u.notify_doors_open === true;
        },
      )
      .map((row: { user_id: string }) => row.user_id);
  }

  if (userIds.length === 0) {
    return new Response(JSON.stringify({ ok: true, sent: 0 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: tokens, error: tokensError } = await admin
    .from("device_push_tokens")
    .select("id, expo_push_token, user_id")
    .in("user_id", userIds);

  if (tokensError) {
    console.error("tokens query failed", tokensError);
    return new Response(JSON.stringify({ error: "Tokens query failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const uniqueTokens = new Map<string, string>();
  for (const row of tokens ?? []) {
    uniqueTokens.set(row.expo_push_token, row.id);
  }

  if (uniqueTokens.size === 0) {
    return new Response(JSON.stringify({ ok: true, sent: 0 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { title, body: notifBody } = copyForEvent(event, displayTitle);
  const messages: ExpoPushMessage[] = [...uniqueTokens.keys()].map((to) => ({
    to,
    title,
    body: notifBody,
    sound: "default",
    data: {
      type: event,
      meetingId,
      ...(body.poll_id ? { pollId: body.poll_id } : {}),
    },
  }));

  try {
    const tickets = await sendExpoPush(
      messages,
      Deno.env.get("EXPO_ACCESS_TOKEN") ?? undefined,
    );

    const deadTokenIds: string[] = [];
    const tokenList = [...uniqueTokens.entries()];
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      if (
        ticket?.status === "error" &&
        ticket.details?.error === "DeviceNotRegistered"
      ) {
        const tokenId = tokenList[i]?.[1];
        if (tokenId) deadTokenIds.push(tokenId);
      }
    }

    if (deadTokenIds.length > 0) {
      await admin.from("device_push_tokens").delete().in("id", deadTokenIds);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        sent: messages.length,
        pruned: deadTokenIds.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("push send failed", error);
    return new Response(JSON.stringify({ error: "Push send failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
