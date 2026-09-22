import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { User, Users, CheckCircle2, ChevronRight } from "lucide-react-native";
import type { AvailableVote } from "@/services/votes";
import { useAuth } from "@/lib/auth";

interface AvailableVotesListProps {
  votes: AvailableVote[];
  onSelect: (voteId: string, isMyVote: boolean, name: string) => void;
}

export function AvailableVotesList({ votes, onSelect }: AvailableVotesListProps) {
  const { user } = useAuth();
  
  const allVoted = votes.every((v) => v.hasVoted);

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
        <SafeAreaView>
          <View className="px-6 pt-16 pb-8">
            <View className="flex-row justify-between items-center mb-4">
              <View className="bg-secondary/10 px-2 py-1 rounded-full border border-secondary/30 flex-row items-center gap-1.5">
                <View className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                <Text className="text-secondary font-bold text-[9px] tracking-widest uppercase">
                  Votación Abierta
                </Text>
              </View>
            </View>
            <Text className="text-foreground text-3xl font-extrabold leading-tight mb-2">
              Votos Disponibles
            </Text>
            <Text className="text-muted-foreground text-base mb-6">
              {allVoted
                ? "Has emitido todos los votos disponibles para esta reunión."
                : "Tienes delegaciones activas. Selecciona un voto para emitirlo."}
            </Text>

            <View className="gap-4">
              {votes.map((vote) => {
                const isMyVote = vote.id === user?.id;
                const Icon = isMyVote ? User : Users;

                return (
                  <TouchableOpacity
                    key={vote.id}
                    disabled={vote.hasVoted}
                    activeOpacity={0.7}
                    onPress={() => onSelect(vote.id, isMyVote, vote.name)}
                    className={`p-5 rounded-[20px] flex-row items-center border shadow-sm ${
                      vote.hasVoted
                        ? "bg-muted border-border/50"
                        : "bg-card border-border"
                    }`}
                  >
                    <View
                      className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
                        vote.hasVoted ? "bg-muted-foreground/20" : "bg-primary/10"
                      }`}
                    >
                      <Icon
                        color={vote.hasVoted ? "#94a3b8" : "#0A2348"}
                        size={24}
                      />
                    </View>
                    <View className="flex-1">
                      <Text
                        className={`text-lg font-bold mb-1 ${
                          vote.hasVoted
                            ? "text-muted-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {vote.name}
                      </Text>
                      <Text
                        className={`text-sm ${
                          vote.hasVoted
                            ? "text-muted-foreground/80"
                            : "text-primary/80 font-medium"
                        }`}
                      >
                        {vote.hasVoted ? "Voto emitido" : "Pendiente de emitir"}
                      </Text>
                    </View>
                    <View>
                      {vote.hasVoted ? (
                        <CheckCircle2 color="#10b981" size={24} />
                      ) : (
                        <ChevronRight color="#cbd5e1" size={24} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}
