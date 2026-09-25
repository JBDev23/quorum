export type MeetingStatus =
  | "draft"
  | "scheduled"
  | "accreditation"
  | "active"
  | "closed";
export type MeetingRole = "organizer" | "participant";

export const MEETING_STATUS_LABELS: Record<MeetingStatus, string> = {
  draft: "Borrador (Cerrada)",
  scheduled: "Programada",
  accreditation: "Acreditación",
  active: "En curso",
  closed: "Finalizada",
};

export function isMeetingRole(value: unknown): value is MeetingRole {
  return value === "organizer" || value === "participant";
}

export function isMeetingStatus(value: unknown): value is MeetingStatus {
  return (
    value === "draft" ||
    value === "scheduled" ||
    value === "accreditation" ||
    value === "active" ||
    value === "closed"
  );
}

/** Which member tabs are relevant for the current meeting phase. */
export function memberTabsForStatus(
  status: MeetingStatus,
  accredited = false,
  allowDelegations = false
) {
  return {
    votes:
      status === "draft" ||
      status === "scheduled" ||
      status === "active",
    // Show QR during accreditation always; during active only if not yet accredited.
    accreditation:
      status === "accreditation" || (status === "active" && !accredited),
    results: status === "active" || status === "closed",
    delegations: allowDelegations && status !== "closed",
  };
}

/** Which organizer tabs are relevant for the current meeting phase. */
export function organizerTabsForStatus(
  status: MeetingStatus,
  allowDelegations = false
) {
  return {
    panel: true as const,
    scanner: status === "accreditation" || status === "active",
    polls: status !== "closed",
    votes: status === "active",
    results: status === "closed",
    delegations: allowDelegations && status !== "closed",
  };
}
