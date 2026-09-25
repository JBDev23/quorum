import { useState, useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Users, User } from "lucide-react-native";

import { useMeeting } from "../_layout";
import { MeetingExitButton } from "@/components/MeetingExitButton";
import { organizerTabsForStatus } from "@/types/meeting";
import { useThemeColors } from "@/theme/useThemeColors";
import type { DelegateCandidate } from "@/services/groups";
import { fetchDelegationsToMe } from "@/services/delegations";
import { alert } from "@/components/Alert";
import { toNetworkAwareMessage } from "@/lib/errors";

function DelegationsShell({ children }: { children: ReactNode }) {
  return (
    <View className="flex-1 bg-background">
      <SafeAreaView
        edges={["top"]}
        pointerEvents="box-none"
        className="absolute top-0 left-0 z-20 px-4 pt-2"
      >
        <MeetingExitButton />
      </SafeAreaView>
      {children}
    </View>
  );
}

export default function OrganizerDelegationsScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { meetingId, status, allowDelegations } = useMeeting();

  const [delegatedToMe, setDelegatedToMe] = useState<DelegateCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  const tabs = organizerTabsForStatus(status, allowDelegations);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const incoming = await fetchDelegationsToMe(meetingId);
        if (!cancelled) {
          setDelegatedToMe(incoming);
        }
      } catch (err) {
        if (!cancelled) {
          alert(
            "Error",
            toNetworkAwareMessage(err, t("meeting.organizer.delegations.error_load"))
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [meetingId]);

  if (!tabs.delegations) {
    return <Redirect href={`/meeting/${meetingId}/organizer`} />;
  }

  return (
    <DelegationsShell>
      <ScrollView
        className="flex-1 px-6 pt-20"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text className="text-foreground text-3xl font-extrabold mb-2">
          {t("meeting.organizer.delegations.title")}
        </Text>
        <Text className="text-muted-foreground text-base mb-8">
          {t("meeting.organizer.delegations.desc")}
        </Text>

        {loading ? (
          <View className="py-16 items-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            <View className="mb-8">
              <Text className="text-foreground font-semibold text-lg mb-4">
                {t("meeting.organizer.delegations.my_vote")}
              </Text>
              <View className="bg-card border border-border p-6 rounded-3xl items-center">
                <View className="bg-muted p-4 rounded-full mb-4">
                  <Users size={32} color={colors.mutedForeground} />
                </View>
                <Text className="text-foreground text-xl font-bold mb-2">
                  {t("meeting.organizer.delegations.not_available")}
                </Text>
                <Text className="text-muted-foreground text-center px-4">
                  {t("meeting.organizer.delegations.organizer_no_delegate")}
                </Text>
              </View>
            </View>

            <View>
              <Text className="text-foreground font-semibold text-lg mb-4">
                {t("meeting.organizer.delegations.delegated_to_me")}
              </Text>
              <View className="bg-card border border-border p-6 rounded-3xl">
                {delegatedToMe.length === 0 ? (
                  <View className="justify-center items-center py-10">
                    <Text className="text-muted-foreground text-center">
                      {t("meeting.organizer.delegations.nobody_delegated")}
                    </Text>
                  </View>
                ) : (
                  <View className="gap-1">
                    {delegatedToMe.map((person) => (
                      <View
                        key={person.id}
                        className="flex-row items-center py-3"
                      >
                        {person.avatar_url ? (
                          <Image
                            source={{ uri: person.avatar_url }}
                            className="w-12 h-12 rounded-full mr-4 bg-muted"
                          />
                        ) : (
                          <View className="w-12 h-12 rounded-full bg-muted items-center justify-center mr-4">
                            <User size={20} color={colors.mutedForeground} />
                          </View>
                        )}
                        <Text className="text-foreground font-bold text-base flex-1">
                          {person.first_name} {person.last_name}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </DelegationsShell>
  );
}
