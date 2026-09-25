import { supabase } from "@/lib/supabase";
import i18n from "@/lib/i18n";

export type GroupRole = "organizer" | "participant";

export type GroupListItem = {
  id: string;
  name: string;
  role: GroupRole;
  invitePin: string;
};

type GroupRow = {
  id: string;
  name: string;
  invite_pin: string;
  group_members: { role: GroupRole }[];
};

function mapGroup(row: GroupRow): GroupListItem {
  return {
    id: row.id,
    name: row.name,
    invitePin: row.invite_pin,
    role: row.group_members[0]?.role ?? "participant",
  };
}

export async function fetchGroups(userId: string): Promise<GroupListItem[]> {
  const { data, error } = await supabase
    .from("groups")
    .select(
      `
        id,
        name,
        invite_pin,
        group_members!inner ( role )
      `
    )
    .eq("group_members.user_id", userId)
    .order("name", { ascending: true });

  if (error) throw error;

  const rows = (data ?? []) as unknown as GroupRow[];
  return rows.map(mapGroup);
}


type GroupMutationRpcResult = {
  id: string;
  name: string;
  invite_pin: string;
  role: GroupRole;
};

function mapGroupMutationError(message: string, fallback: string): Error {
  if (message.includes("INVALID_PIN")) {
    return new Error(i18n.t("services.groups.invalid_pin"));
  }
  if (message.includes("ALREADY_MEMBER")) {
    return new Error(i18n.t("services.groups.already_member"));
  }
  if (message.includes("NOT_AUTHENTICATED")) {
    return new Error(i18n.t("services.groups.auth_required"));
  }
  if (message.includes("INVALID_NAME")) {
    return new Error(i18n.t("services.groups.invalid_name"));
  }
  if (message.includes("PIN_GENERATION_FAILED")) {
    return new Error(i18n.t("services.groups.pin_generation_error"));
  }
  return new Error(fallback);
}

export async function joinGroupByPin(pin: string): Promise<GroupListItem> {
  const { data, error } = await supabase.rpc("join_group_by_pin", {
    p_pin: pin.trim(),
  });

  if (error) {
    throw mapGroupMutationError(error.message, i18n.t("services.groups.join_error"));
  }

  const group = data as GroupMutationRpcResult | null;
  if (!group?.id) {
    throw new Error(i18n.t("services.groups.join_error"));
  }

  return {
    id: group.id,
    name: group.name,
    invitePin: group.invite_pin,
    role: group.role ?? "participant",
  };
}

export async function leaveOrDeleteGroup(userId: string, groupId: string, isOrganizer: boolean): Promise<void> {
  if (isOrganizer) {
    const { error } = await supabase
      .from("groups")
      .delete()
      .match({ id: groupId, creator_id: userId });

    if (error) {
      throw new Error(i18n.t("services.groups.delete_error"));
    }
  } else {
    const { error } = await supabase
      .from("group_members")
      .delete()
      .match({ user_id: userId, group_id: groupId });

    if (error) {
      throw new Error(i18n.t("services.groups.leave_error"));
    }
  }
}

export async function createGroup(name: string): Promise<GroupListItem> {
  const { data, error } = await supabase.rpc("create_group", {
    p_name: name.trim(),
  });

  if (error) {
    throw mapGroupMutationError(error.message, i18n.t("services.groups.create_error"));
  }

  const group = data as GroupMutationRpcResult | null;
  if (!group?.id) {
    throw new Error(i18n.t("services.groups.create_error"));
  }

  return {
    id: group.id,
    name: group.name,
    invitePin: group.invite_pin,
    role: group.role ?? "organizer",
  };
}

export async function getGroupDetails(groupId: string, userId: string) {
  const { data, error } = await supabase
    .from("groups")
    .select(`
      id, 
      name, 
      invite_pin,
      group_members!inner(role)
    `)
    .eq("id", groupId)
    .eq("group_members.user_id", userId)
    .single();

  if (error || !data) throw new Error(i18n.t("services.groups.not_found"));

  return {
    id: data.id,
    name: data.name,
    invitePin: data.invite_pin,
    role: data.group_members[0].role as "organizer" | "participant",
  };
}

export type DelegateCandidate = {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
};

export async function fetchGroupMembersForDelegation(
  groupId: string,
  currentUserId: string
): Promise<DelegateCandidate[]> {
  const { data, error } = await supabase
    .from("group_members")
    .select(`
      user_id,
      users:user_id (
        id,
        first_name,
        last_name,
        avatar_url
      )
    `)
    .eq("group_id", groupId)
    .neq("user_id", currentUserId);

  if (error) throw new Error(i18n.t("services.groups.load_members_error"));

  // Typecast since Supabase join returns an array or single object depending on relation
  // users should be an object (or array of 1)
  const candidates: DelegateCandidate[] = (data || []).map((row: any) => {
    const user = Array.isArray(row.users) ? row.users[0] : row.users;
    return {
      id: row.user_id,
      first_name: user?.first_name || i18n.t("services.groups.unknown_user"),
      last_name: user?.last_name || "",
      avatar_url: user?.avatar_url || null,
    };
  });

  // Sort by first name
  return candidates.sort((a, b) => 
    a.first_name.localeCompare(b.first_name)
  );
}