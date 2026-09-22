import { useState, useEffect, type ReactNode } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Users, UserPlus, CheckCircle2, User } from "lucide-react-native";

import { useMeeting } from "../_layout";
import { useAuth } from "@/lib/auth";
import { MeetingExitButton } from "@/components/MeetingExitButton";
import { memberTabsForStatus } from "@/types/meeting";
import { useThemeColors } from "@/theme/useThemeColors";
import { SelectDelegateModal } from "@/components/delegations/SelectDelegateModal";
import type { DelegateCandidate } from "@/services/groups";
import {
  createDelegation,
  fetchDelegationsToMe,
  fetchMyDelegation,
  revokeDelegation,
} from "@/services/delegations";
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

export default function MemberDelegationsScreen() {
  const colors = useThemeColors();
  const { meetingId, groupId, status, allowDelegations } = useMeeting();
  const { user } = useAuth();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [delegatedTo, setDelegatedTo] = useState<DelegateCandidate | null>(null);
  const [delegatedToMe, setDelegatedToMe] = useState<DelegateCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const tabs = memberTabsForStatus(status, false, allowDelegations);
  const canCreate = status !== "closed" && !saving;
  const canRevoke = status !== "closed" && status !== "active" && !saving;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const [mine, incoming] = await Promise.all([
          fetchMyDelegation(meetingId),
          fetchDelegationsToMe(meetingId),
        ]);
        if (!cancelled) {
          setDelegatedTo(mine);
          setDelegatedToMe(incoming);
        }
      } catch (err) {
        if (!cancelled) {
          alert(
            "Error",
            toNetworkAwareMessage(err, "No se pudieron cargar las delegaciones.")
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
    return <Redirect href={`/meeting/${meetingId}/member`} />;
  }

  const handleSelectDelegate = async (delegate: DelegateCandidate) => {
    if (!canCreate) return;
    setSaving(true);
    try {
      await createDelegation(meetingId, delegate.id);
      setDelegatedTo(delegate);
    } catch (err) {
      alert(
        "Error",
        toNetworkAwareMessage(err, "No se pudo crear la delegación.")
      );
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async () => {
    if (!canRevoke) return;
    setSaving(true);
    try {
      await revokeDelegation(meetingId);
      setDelegatedTo(null);
    } catch (err) {
      alert(
        "Error",
        toNetworkAwareMessage(err, "No se pudo revocar la delegación.")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <DelegationsShell>
      <ScrollView
        className="flex-1 px-6 pt-20"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text className="text-foreground text-3xl font-extrabold mb-2">
          Delegaciones
        </Text>
        <Text className="text-muted-foreground text-base mb-8">
          Gestiona quién votará en tu nombre o revisa quién ha delegado su voto
          en ti.
        </Text>

        {loading ? (
          <View className="py-16 items-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {/* Mi Delegación */}
            <View className="mb-8">
              <Text className="text-foreground font-semibold text-lg mb-4">
                Mi Voto
              </Text>
              <View className="bg-card border border-border p-6 rounded-3xl items-center">
                {delegatedTo ? (
                  <>
                    <View className="bg-success/20 p-4 rounded-full mb-4">
                      <CheckCircle2 size={32} color={colors.success} />
                    </View>
                    <Text className="text-foreground text-xl font-bold mb-2">
                      Voto delegado
                    </Text>
                    <Text className="text-muted-foreground text-center mb-6 px-4">
                      Has delegado tu voto en{" "}
                      <Text className="font-bold text-foreground">
                        {delegatedTo.first_name} {delegatedTo.last_name}
                      </Text>
                      . Esta persona podrá votar en tu nombre.
                    </Text>

                    {canRevoke && (
                      <TouchableOpacity
                        className="bg-destructive/10 px-6 py-3 rounded-full flex-row items-center gap-2"
                        onPress={() => void handleRevoke()}
                        disabled={!canRevoke}
                      >
                        {saving ? (
                          <ActivityIndicator
                            size="small"
                            color={colors.destructive}
                          />
                        ) : (
                          <Text className="text-destructive font-bold text-base">
                            Revocar delegación
                          </Text>
                        )}
                      </TouchableOpacity>
                    )}
                    {status === "active" && (
                      <Text className="text-muted-foreground text-center text-sm px-4">
                        No se puede revocar la delegación mientras la reunión
                        está en curso.
                      </Text>
                    )}
                  </>
                ) : (
                  <>
                    <View className="bg-muted p-4 rounded-full mb-4">
                      <Users size={32} color={colors.mutedForeground} />
                    </View>
                    <Text className="text-foreground text-xl font-bold mb-2">
                      No has delegado tu voto
                    </Text>
                    <Text className="text-muted-foreground text-center mb-6 px-4">
                      Si no puedes asistir a la reunión, puedes delegar tu voto
                      en otro miembro para que vote por ti.
                    </Text>

                    {status !== "closed" && (
                      <TouchableOpacity
                        className="bg-primary px-6 py-3 rounded-full flex-row items-center gap-2"
                        onPress={() => setIsModalVisible(true)}
                        disabled={!canCreate}
                      >
                        <UserPlus color={colors.primaryForeground} size={20} />
                        <Text className="text-primary-foreground font-bold text-base">
                          Delegar mi voto
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
            </View>

            {/* Delegados en mí */}
            <View>
              <Text className="text-foreground font-semibold text-lg mb-4">
                Han delegado en ti
              </Text>
              <View className="bg-card border border-border p-6 rounded-3xl">
                {delegatedToMe.length === 0 ? (
                  <View className="justify-center items-center py-10">
                    <Text className="text-muted-foreground text-center">
                      Nadie ha delegado su voto en ti todavía.
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

      {user && (
        <SelectDelegateModal
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          groupId={groupId}
          currentUserId={user.id}
          onSelect={handleSelectDelegate}
        />
      )}
    </DelegationsShell>
  );
}
