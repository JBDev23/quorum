import { FREE_TIER_PARTICIPANT_LIMIT } from "@/constants/limits";
import type { MeetingCardProps } from "@/components/MeetingCard";
import { supabase } from "@/lib/supabase";
import type { MeetingStatus } from "@/types/meeting";
import i18n from "@/lib/i18n";

export class ParticipantLimitError extends Error {
  constructor() {
    super(
      i18n.t("services.meetings.limit_reached", { limit: FREE_TIER_PARTICIPANT_LIMIT })
    );
    this.name = "ParticipantLimitError";
  }
}

type MeetingRow = {
  id: string;
  title: string;
  group_id: string;
  status: MeetingCardProps["status"];
  start_date: string;
  end_date: string | null;
  groups: {
    name: string;
    group_members: { role: MeetingCardProps["role"] }[];
  } | null;
};

function formatMeetingDate(
  startDate: string,
  endDate: string | null,
  status: MeetingCardProps["status"]
): string {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;
  const now = Date.now();
  const locale = i18n.language === "en" ? "en-US" : "es-ES";

  if (status === "closed") {
    return start.toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
    });
  }

  if (status === "active" || (start.getTime() <= now && (!end || end.getTime() >= now))) {
    if (end) {
      const hoursLeft = Math.max(0, Math.round((end.getTime() - now) / 3_600_000));
      if (hoursLeft <= 0) return i18n.t("components.meetingCard.date_now");
      return i18n.t("components.meetingCard.date_ends_in", { hours: hoursLeft });
    }
    return i18n.t("components.meetingCard.date_now");
  }

  const msUntilStart = start.getTime() - now;
  const hoursUntil = Math.round(msUntilStart / 3_600_000);
  if (hoursUntil < 1) return i18n.t("components.meetingCard.date_starts_soon");
  if (hoursUntil < 24) return i18n.t("components.meetingCard.date_starts_in", { hours: hoursUntil });

  return start.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  });
}

function mapMeeting(row: MeetingRow): MeetingCardProps | null {
  if (!row.groups) return null;

  const role = row.groups.group_members[0]?.role ?? "participant";

  return {
    id: row.id,
    title: row.title,
    status: row.status,
    groupId: row.group_id,
    groupName: row.groups.name,
    role,
    dateText: formatMeetingDate(row.start_date, row.end_date, row.status),
  };
}

const MEETING_LIST_SELECT = `
  id,
  title,
  group_id,
  status,
  start_date,
  end_date,
  groups!inner (
    name,
    group_members!inner ( role )
  )
`;

export async function fetchMeetings(userId: string, retries = 1): Promise<MeetingCardProps[]> {
  const { data, error } = await supabase
    .from("meetings")
    .select(MEETING_LIST_SELECT)
    .eq("groups.group_members.user_id", userId)
    .order("start_date", { ascending: true });

  if (error) {
    if (error.code === "PGRST303" && retries > 0) {
      // Reintentar tras una breve pausa (mitiga la desincronización de relojes en Supabase)
      await new Promise((resolve) => setTimeout(resolve, 500));
      return fetchMeetings(userId, retries - 1);
    }
    throw error;
  }

  const rows = (data ?? []) as unknown as MeetingRow[];
  return rows.map(mapMeeting).filter((m): m is MeetingCardProps => m !== null);
}

export async function fetchMeetingsByGroup(
  groupId: string,
  userId: string,
  retries = 1
): Promise<MeetingCardProps[]> {
  const { data, error } = await supabase
    .from("meetings")
    .select(MEETING_LIST_SELECT)
    .eq("group_id", groupId)
    .eq("groups.group_members.user_id", userId)
    .order("start_date", { ascending: true });

  if (error) {
    if (error.code === "PGRST303" && retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return fetchMeetingsByGroup(groupId, userId, retries - 1);
    }
    throw error;
  }

  const rows = (data ?? []) as unknown as MeetingRow[];
  return rows.map(mapMeeting).filter((m): m is MeetingCardProps => m !== null);
}

export async function accreditParticipant(
  meetingId: string,
  userId: string
): Promise<"created" | "existing"> {
  const { data: existing, error: existingError } = await supabase
    .from("meeting_attendances")
    .select("user_id")
    .eq("meeting_id", meetingId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return "existing";

  const { error } = await supabase.rpc("accredit_attendee", {
    p_meeting_id: meetingId,
    p_user_id: userId,
  });

  if (error) {
    const msg = error.message ?? "";

    if (msg.includes("ERR_LIMIT_REACHED")) {
      throw new ParticipantLimitError();
    }
    if (msg.includes("ERR_UNAUTHORIZED")) {
      throw new Error(i18n.t("services.meetings.only_organizer_accredit"));
    }
    if (msg.includes("ERR_INVALID_STATUS")) {
      throw new Error(i18n.t("services.meetings.not_in_accreditation"));
    }
    if (msg.includes("ERR_NOT_MEMBER")) {
      throw new Error(i18n.t("services.meetings.not_in_group"));
    }
    if (msg.includes("ERR_NOT_FOUND")) {
      throw new Error(i18n.t("services.meetings.not_found"));
    }
    if (msg.includes("ERR_NOT_AUTHENTICATED")) {
      throw new Error(i18n.t("services.meetings.session_expired"));
    }
    throw new Error(i18n.t("services.meetings.accredit_error"));
  }

  return "created";
}

export async function createMeeting(
  groupId: string,
  title: string,
  startDate?: string
): Promise<string> {
  const { data, error } = await supabase
    .from("meetings")
    .insert({
      group_id: groupId,
      title: title.trim(),
      status: "draft",
      start_date: startDate || new Date().toISOString(), 
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating meeting:", error);
    throw new Error(i18n.t("services.meetings.create_error"));
  }

  return data.id;
}

export async function updateMeetingStatus(
  meetingId: string,
  status: MeetingStatus
): Promise<void> {
  const payload: { status: MeetingStatus; end_date?: string | null } = {
    status,
  };

  if (status === "closed") {
    payload.end_date = new Date().toISOString();
  } else if (
    status === "active" ||
    status === "accreditation" ||
    status === "scheduled"
  ) {
    payload.end_date = null;
  }

  const { error } = await supabase
    .from("meetings")
    .update(payload)
    .eq("id", meetingId);

  if (error) {
    console.error("Error updating meeting status:", error);
    throw new Error(i18n.t("services.meetings.update_status_error"));
  }
}

export async function updateMeetingDate(meetingId: string, startDate: Date) {
  const { error } = await supabase
    .from("meetings")
    .update({ start_date: startDate.toISOString() })
    .eq("id", meetingId);

  if (error) throw new Error(i18n.t("services.meetings.update_date_error"));
}

export async function fetchAllowBlankVotes(meetingId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("meetings")
    .select("allow_blank_votes")
    .eq("id", meetingId)
    .single();

  if (error) throw error;
  return !!data?.allow_blank_votes;
}

export async function updateAllowBlankVotes(
  meetingId: string,
  allowBlankVotes: boolean
): Promise<void> {
  const { error } = await supabase
    .from("meetings")
    .update({ allow_blank_votes: allowBlankVotes })
    .eq("id", meetingId);

  if (error) {
    throw new Error(i18n.t("services.meetings.update_blank_error"));
  }
}

export async function fetchAllowDelegations(meetingId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("meetings")
    .select("allow_delegations")
    .eq("id", meetingId)
    .single();

  if (error) throw error;
  return !!data?.allow_delegations;
}

export async function updateAllowDelegations(
  meetingId: string,
  allowDelegations: boolean
): Promise<void> {
  const { error } = await supabase.rpc("set_meeting_allow_delegations", {
    p_meeting_id: meetingId,
    p_allow: allowDelegations,
  });

  if (error) {
    const msg = error.message || "";
    if (msg.includes("ERR_PREMIUM_REQUIRED")) {
      throw new Error("PREMIUM_REQUIRED");
    }
    if (msg.includes("ERR_UNAUTHORIZED")) {
      throw new Error(i18n.t("services.meetings.only_organizer_blank"));
    }
    if (msg.includes("ERR_NOT_AUTHENTICATED")) {
      throw new Error(i18n.t("services.meetings.session_expired"));
    }
    throw new Error(i18n.t("services.meetings.update_delegations_error"));
  }
}

export async function fetchMeetingStartDate(
  meetingId: string
): Promise<Date | null> {
  const { data, error } = await supabase
    .from("meetings")
    .select("start_date")
    .eq("id", meetingId)
    .single();

  if (error) throw error;
  return data?.start_date ? new Date(data.start_date) : null;
}

export type AttendanceStats = {
  accredited: number;
  totalMembers: number;
};

export async function fetchAttendanceStats(
  meetingId: string,
  groupId: string
): Promise<AttendanceStats> {
  const [attendanceRes, membersRes] = await Promise.all([
    supabase
      .from("meeting_attendances")
      .select("*", { count: "exact", head: true })
      .eq("meeting_id", meetingId),
    supabase
      .from("group_members")
      .select("*", { count: "exact", head: true })
      .eq("group_id", groupId),
  ]);

  if (attendanceRes.error) throw attendanceRes.error;
  if (membersRes.error) throw membersRes.error;

  return {
    accredited: attendanceRes.count ?? 0,
    totalMembers: membersRes.count ?? 0,
  };
}

export type MemberAttendance = {
  user_id: string;
  fullName: string;
  avatarUrl: string | null;
  isAccredited: boolean;
};

export async function fetchAttendanceList(
  meetingId: string,
  groupId: string
): Promise<MemberAttendance[]> {
  // 1. Cruzamos los miembros del grupo con tu tabla public.users exacta
  const { data: members, error: membersError } = await supabase
    .from("group_members")
    .select("user_id, users(first_name, last_name, avatar_url)")
    .eq("group_id", groupId);

  if (membersError) throw new Error(i18n.t("services.meetings.load_members_error"));

  // 2. Obtenemos quiénes se han acreditado
  const { data: attendances, error: attendancesError } = await supabase
    .from("meeting_attendances")
    .select("user_id")
    .eq("meeting_id", meetingId);

  if (attendancesError) throw new Error(i18n.t("services.meetings.load_accreditations_error"));

  const accreditedIds = new Set(attendances.map((a) => a.user_id));

  // 3. Mapeamos combinando nombre y apellidos
  return (members || []).map((m: any) => {
    const userData = m.users;
    
    // Concatenamos nombre y apellido de forma segura por si alguno es null
    const firstName = userData?.first_name || "";
    const lastName = userData?.last_name || "";
    const fullName = [firstName, lastName].filter(Boolean).join(" ") || i18n.t("services.meetings.unknown_user");

    return {
      user_id: m.user_id,
      fullName,
      avatarUrl: userData?.avatar_url || null,
      isAccredited: accreditedIds.has(m.user_id),
    };
  });
}