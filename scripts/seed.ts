/**
 * Seed de datos de prueba para quorum.
 *
 * Uso:
 *   1. Añade SUPABASE_SERVICE_ROLE_KEY a .env (Dashboard → Project Settings → API)
 *   2. npm run db:seed
 *   3. npm run db:seed -- --reset   # borra el seed anterior y vuelve a crear
 *
 * Credenciales (password para todos): SeedPass123!
 *   organizer@seed.local  → organizador del grupo
 *   member@seed.local     → participante acreditado
 *   member2@seed.local    → participante acreditado
 *   member3@seed.local    → participante sin acreditar
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const SEED_PASSWORD = "SeedPass123!";
const SEED_DOMAIN = "seed.local";

/** IDs fijos para deep-links y pruebas reproducibles */
export const IDS = {
  organizer: "a0000000-0000-4000-8000-000000000001",
  member1: "a0000000-0000-4000-8000-000000000002",
  member2: "a0000000-0000-4000-8000-000000000003",
  member3: "a0000000-0000-4000-8000-000000000004",
  group: "b0000000-0000-4000-8000-000000000001",
  meetingActive: "c0000000-0000-4000-8000-000000000001",
  meetingAccreditation: "c0000000-0000-4000-8000-000000000002",
  meetingDraft: "c0000000-0000-4000-8000-000000000003",
  meetingClosed: "c0000000-0000-4000-8000-000000000004",
  pollYesNo: "d0000000-0000-4000-8000-000000000001",
  pollMulti: "d0000000-0000-4000-8000-000000000002",
  pollClosed: "d0000000-0000-4000-8000-000000000003",
  optYes: "e0000000-0000-4000-8000-000000000001",
  optNo: "e0000000-0000-4000-8000-000000000002",
  optAscensor: "e0000000-0000-4000-8000-000000000003",
  optFachada: "e0000000-0000-4000-8000-000000000004",
  optGaraje: "e0000000-0000-4000-8000-000000000005",
  optClosedA: "e0000000-0000-4000-8000-000000000006",
  optClosedB: "e0000000-0000-4000-8000-000000000007",
} as const;

const USERS = [
  {
    id: IDS.organizer,
    email: `organizer@${SEED_DOMAIN}`,
    first_name: "Ana",
    last_name: "Organizadora",
    is_premium: true,
  },
  {
    id: IDS.member1,
    email: `member@${SEED_DOMAIN}`,
    first_name: "Luis",
    last_name: "Participante",
    is_premium: false,
  },
  {
    id: IDS.member2,
    email: `member2@${SEED_DOMAIN}`,
    first_name: "María",
    last_name: "Vecina",
    is_premium: false,
  },
  {
    id: IDS.member3,
    email: `member3@${SEED_DOMAIN}`,
    first_name: "Pedro",
    last_name: "SinAcreditar",
    is_premium: false,
  },
] as const;

function loadEnvFile() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function receiptHash(pollId: string, label: string): string {
  return createHash("sha256").update(`seed:${pollId}:${label}`).digest("hex");
}

function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

async function ensureUser(
  admin: SupabaseClient,
  user: (typeof USERS)[number]
): Promise<void> {
  const { data: existing } = await admin.auth.admin.getUserById(user.id);

  if (existing.user) {
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      email: user.email,
      password: SEED_PASSWORD,
      email_confirm: true,
      user_metadata: {
        first_name: user.first_name,
        last_name: user.last_name,
      },
    });
    if (error) throw error;
  } else {
    const { error } = await admin.auth.admin.createUser({
      id: user.id,
      email: user.email,
      password: SEED_PASSWORD,
      email_confirm: true,
      user_metadata: {
        first_name: user.first_name,
        last_name: user.last_name,
      },
    });
    if (error) throw error;
  }

  // El trigger crea el perfil; sincronizamos premium / nombres por si ya existía.
  const { error: profileError } = await admin.from("users").upsert({
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    is_premium: user.is_premium,
  });
  if (profileError) throw profileError;
}

async function resetSeed(admin: SupabaseClient): Promise<void> {
  console.log("↻ Limpiando datos de seed…");

  // Orden inverso de FKs. Los IDs fijos permiten borrar sin tocar datos reales.
  const meetingIds = [
    IDS.meetingActive,
    IDS.meetingAccreditation,
    IDS.meetingDraft,
    IDS.meetingClosed,
  ];
  const pollIds = [IDS.pollYesNo, IDS.pollMulti, IDS.pollClosed];

  await admin.from("cast_votes").delete().in("poll_id", pollIds);
  await admin.from("poll_participations").delete().in("poll_id", pollIds);
  await admin.from("poll_options").delete().in("poll_id", pollIds);
  await admin.from("polls").delete().in("id", pollIds);
  await admin.from("meeting_attendances").delete().in("meeting_id", meetingIds);
  await admin.from("meetings").delete().in("id", meetingIds);
  await admin.from("group_members").delete().eq("group_id", IDS.group);
  await admin.from("groups").delete().eq("id", IDS.group);

  for (const user of USERS) {
    await admin.auth.admin.deleteUser(user.id);
  }
}

async function seedDomain(admin: SupabaseClient): Promise<void> {
  console.log("🌱 Creando usuarios…");
  for (const user of USERS) {
    await ensureUser(admin, user);
    console.log(`   ✓ ${user.email}`);
  }

  console.log("🌱 Creando grupo y miembros…");
  const { error: groupError } = await admin.from("groups").upsert({
    id: IDS.group,
    name: "Junta Vecinal",
    invite_pin: "482917",
    creator_id: IDS.organizer,
  });
  if (groupError) throw groupError;

  const members = [
    { group_id: IDS.group, user_id: IDS.organizer, role: "organizer" },
    { group_id: IDS.group, user_id: IDS.member1, role: "participant" },
    { group_id: IDS.group, user_id: IDS.member2, role: "participant" },
    { group_id: IDS.group, user_id: IDS.member3, role: "participant" },
  ];
  const { error: membersError } = await admin.from("group_members").upsert(members);
  if (membersError) throw membersError;

  console.log("🌱 Creando reuniones…");
  const { error: meetingsError } = await admin.from("meetings").upsert([
    {
      id: IDS.meetingActive,
      group_id: IDS.group,
      title: "Aprobación de Presupuestos 2026",
      start_date: hoursFromNow(-0.5),
      end_date: hoursFromNow(2),
      status: "active",
      allow_blank_votes: true,
    },
    {
      id: IDS.meetingAccreditation,
      group_id: IDS.group,
      title: "Junta general de vecinos 2026",
      start_date: hoursFromNow(0.2),
      end_date: hoursFromNow(3),
      status: "accreditation",
      allow_blank_votes: false,
    },
    {
      id: IDS.meetingDraft,
      group_id: IDS.group,
      title: "Asamblea ordinaria (programada)",
      start_date: hoursFromNow(24 * 7),
      end_date: null,
      status: "scheduled",
      allow_blank_votes: true,
    },
    {
      id: IDS.meetingClosed,
      group_id: IDS.group,
      title: "Reunión extraordinaria (cerrada)",
      start_date: daysAgo(14),
      end_date: daysAgo(14),
      status: "closed",
      allow_blank_votes: true,
    },
  ]);
  if (meetingsError) throw meetingsError;

  console.log("🌱 Acreditaciones…");
  const { error: attendanceError } = await admin.from("meeting_attendances").upsert([
    { meeting_id: IDS.meetingActive, user_id: IDS.organizer },
    { meeting_id: IDS.meetingActive, user_id: IDS.member1 },
    { meeting_id: IDS.meetingActive, user_id: IDS.member2 },
    { meeting_id: IDS.meetingAccreditation, user_id: IDS.organizer },
    { meeting_id: IDS.meetingAccreditation, user_id: IDS.member1 },
    { meeting_id: IDS.meetingClosed, user_id: IDS.organizer },
    { meeting_id: IDS.meetingClosed, user_id: IDS.member1 },
    { meeting_id: IDS.meetingClosed, user_id: IDS.member2 },
  ]);
  if (attendanceError) throw attendanceError;

  console.log("🌱 Encuestas y opciones…");
  const { error: pollsError } = await admin.from("polls").upsert([
    {
      id: IDS.pollYesNo,
      meeting_id: IDS.meetingActive,
      title: "¿Se aprueba el presupuesto 2026?",
      type: "yes_no",
      status: "active",
    },
    {
      id: IDS.pollMulti,
      meeting_id: IDS.meetingActive,
      title: "Prioridad de obras",
      type: "multiple_choice",
      status: "draft",
    },
    {
      id: IDS.pollClosed,
      meeting_id: IDS.meetingClosed,
      title: "¿Aprobar acta anterior?",
      type: "yes_no",
      status: "closed",
    },
  ]);
  if (pollsError) throw pollsError;

  const { error: optionsError } = await admin.from("poll_options").upsert([
    { id: IDS.optYes, poll_id: IDS.pollYesNo, text: "Sí" },
    { id: IDS.optNo, poll_id: IDS.pollYesNo, text: "No" },
    { id: IDS.optAscensor, poll_id: IDS.pollMulti, text: "Ascensor" },
    { id: IDS.optFachada, poll_id: IDS.pollMulti, text: "Fachada" },
    { id: IDS.optGaraje, poll_id: IDS.pollMulti, text: "Garaje" },
    { id: IDS.optClosedA, poll_id: IDS.pollClosed, text: "Sí" },
    { id: IDS.optClosedB, poll_id: IDS.pollClosed, text: "No" },
  ]);
  if (optionsError) throw optionsError;

  console.log("🌱 Votos de ejemplo (reunión cerrada)…");
  const { error: participationError } = await admin.from("poll_participations").upsert([
    { poll_id: IDS.pollClosed, user_id: IDS.member1 },
    { poll_id: IDS.pollClosed, user_id: IDS.member2 },
    { poll_id: IDS.pollClosed, user_id: IDS.organizer },
  ]);
  if (participationError) throw participationError;

  const { error: votesError } = await admin.from("cast_votes").upsert(
    [
      {
        receipt_hash: receiptHash(IDS.pollClosed, "v1"),
        poll_id: IDS.pollClosed,
        option_id: IDS.optClosedA,
        is_blank: false,
      },
      {
        receipt_hash: receiptHash(IDS.pollClosed, "v2"),
        poll_id: IDS.pollClosed,
        option_id: IDS.optClosedA,
        is_blank: false,
      },
      {
        receipt_hash: receiptHash(IDS.pollClosed, "v3"),
        poll_id: IDS.pollClosed,
        option_id: null,
        is_blank: true,
      },
    ],
    { onConflict: "receipt_hash" }
  );
  if (votesError) throw votesError;
}

function printSummary() {
  console.log(`
✅ Seed listo

Cuentas (password: ${SEED_PASSWORD})
  ${USERS.map((u) => `${u.email.padEnd(24)} ${u.first_name} ${u.last_name}`).join("\n  ")}

Grupo
  Junta Vecinal · pin 482917 · id ${IDS.group}

Reuniones (deep-links)
  /meeting/${IDS.meetingActive}/member       activa + urnas
  /meeting/${IDS.meetingActive}/organizer    panel organizador
  /meeting/${IDS.meetingAccreditation}/organizer  fase acreditación
  /meeting/${IDS.meetingDraft}/organizer     borrador
  /meeting/${IDS.meetingClosed}/organizer    cerrada + resultados
`);
}

async function main() {
  loadEnvFile();

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("Falta EXPO_PUBLIC_SUPABASE_URL (o SUPABASE_URL) en .env");
  }
  if (!serviceKey) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY en .env.\n" +
      "Cópiala desde Supabase Dashboard → Project Settings → API → service_role."
    );
  }

  const reset = process.argv.includes("--reset");
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (reset) {
    await resetSeed(admin);
  }

  await seedDomain(admin);
  printSummary();
}

main().catch((err) => {
  console.error("\n❌ Seed falló:", err instanceof Error ? err.message : err);
  process.exit(1);
});
