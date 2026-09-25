import { useState, useEffect } from "react";
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  TextInput, 
  ActivityIndicator,
  Image
} from "react-native";
import { X, Search, User } from "lucide-react-native";

import { useThemeColors } from "@/theme/useThemeColors";
import { fetchGroupMembersForDelegation, type DelegateCandidate } from "@/services/groups";
import { alert } from "@/components/Alert";
import { useTranslation } from "react-i18next";

interface SelectDelegateModalProps {
  visible: boolean;
  onClose: () => void;
  groupId: string;
  currentUserId: string;
  onSelect: (user: DelegateCandidate) => void | Promise<void>;
}

export function SelectDelegateModal({ 
  visible, 
  onClose, 
  groupId, 
  currentUserId,
  onSelect
}: SelectDelegateModalProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [members, setMembers] = useState<DelegateCandidate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchGroupMembersForDelegation(groupId, currentUserId);
        if (mounted) {
          setMembers(data);
        }
      } catch (err) {
        if (mounted) setError(t("components.delegations.error_load"));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    void load();
    return () => { mounted = false; };
  }, [visible, groupId, currentUserId]);

  const filteredMembers = members.filter(m => {
    const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  const handlePressMember = (member: DelegateCandidate) => {
    if (submitting) return;
    alert(
      t("components.delegations.confirm_title"),
      t("components.delegations.confirm_msg", { name: `${member.first_name} ${member.last_name}` }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("components.delegations.confirm_btn"),
          onPress: () => {
            void (async () => {
              setSubmitting(true);
              try {
                await onSelect(member);
                onClose();
              } catch {
                // Parent surfaces the error; keep modal open.
              } finally {
                setSubmitting(false);
              }
            })();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-overlay/60 justify-end">
        <View className="bg-background h-5/6 rounded-t-[32px] pt-6 pb-10 shadow-2xl overflow-hidden flex-col">
          
          <View className="px-6 flex-row items-center justify-between mb-6">
            <Text className="text-foreground text-2xl font-extrabold">
              {t("components.delegations.select_delegate")}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 bg-muted rounded-full items-center justify-center"
            >
              <X color={colors.mutedForeground} size={18} />
            </TouchableOpacity>
          </View>

          <View className="px-6 mb-4">
            <View className="flex-row items-center bg-card border border-border px-4 py-3 rounded-2xl">
              <Search color={colors.mutedForeground} size={20} className="mr-2" />
              <TextInput 
                className="flex-1 text-foreground text-base"
                placeholder={t("components.delegations.search_placeholder")}
                placeholderTextColor={colors.mutedForeground}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {loading || submitting ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : error ? (
            <View className="flex-1 justify-center items-center px-6">
              <Text className="text-destructive text-center">{error}</Text>
            </View>
          ) : filteredMembers.length === 0 ? (
            <View className="flex-1 justify-center items-center px-6">
              <Text className="text-muted-foreground text-center">
                {searchQuery ? t("components.delegations.no_members_found") : t("components.delegations.no_other_members")}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredMembers}
              keyExtractor={item => item.id}
              className="px-6"
              contentContainerStyle={{ paddingBottom: 40 }}
              ItemSeparatorComponent={() => <View className="h-px bg-border my-2" />}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  className="flex-row items-center py-3"
                  onPress={() => handlePressMember(item)}
                  disabled={submitting}
                >
                  {item.avatar_url ? (
                    <Image 
                      source={{ uri: item.avatar_url }} 
                      className="w-12 h-12 rounded-full mr-4 bg-muted"
                    />
                  ) : (
                    <View className="w-12 h-12 rounded-full bg-muted items-center justify-center mr-4">
                      <User size={20} color={colors.mutedForeground} />
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="text-foreground font-bold text-base">
                      {item.first_name} {item.last_name}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}
