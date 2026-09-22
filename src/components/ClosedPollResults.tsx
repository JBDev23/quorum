import { useCallback, useEffect, useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { getPollResults, type Poll } from "@/services/polls";
import { useThemeColors } from "@/theme/useThemeColors";

interface ClosedPollResultsProps {
  poll: Poll;
}

export function ClosedPollResults({ poll }: ClosedPollResultsProps) {
  const colors = useThemeColors();
  const [results, setResults] = useState<Record<string, number>>({});
  const [blankVotes, setBlankVotes] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadResults = useCallback(() => {
    setLoading(true);
    setError(null);
    getPollResults(poll.id)
      .then((data) => {
        setResults(data.results);
        setBlankVotes(data.blankVotes);
        setTotal(data.totalVotes);
      })
      .catch((err) => {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : "No se pudieron cargar los resultados"
        );
      })
      .finally(() => setLoading(false));
  }, [poll.id]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  if (loading) {
    return (
      <ActivityIndicator size="small" color={colors.secondary} className="my-4" />
    );
  }

  if (error) {
    return (
      <View className="bg-background p-4 rounded-xl border border-destructive/80/40 mb-4 mt-2">
        <Text className="text-destructive text-sm text-center mb-3">{error}</Text>
        <TouchableOpacity
          onPress={loadResults}
          className="bg-muted py-2 rounded-lg"
        >
          <Text className="text-foreground text-center font-semibold text-sm">
            Reintentar
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const sortedOptions = [...(poll.poll_options || [])].sort((a, b) => {
    return (results[b.id] || 0) - (results[a.id] || 0);
  });

  return (
    <View className="bg-background p-4 rounded-xl border border-border mb-4 mt-2">
      <View className="flex-row justify-between items-end mb-4">
        <Text className="text-muted-foreground font-bold text-xs uppercase tracking-widest">
          Escrutinio Final
        </Text>
        <Text className="text-foreground text-sm font-semibold">
          {total} votos emitidos
        </Text>
      </View>

      {total === 0 ? (
        <Text className="text-muted-foreground text-sm text-center py-2">
          Nadie emitió voto en esta urna.
        </Text>
      ) : (
        <View className="gap-4">
          {sortedOptions.map((option) => {
            const count = results[option.id] || 0;
            const percent = total > 0 ? Math.round((count / total) * 100) : 0;

            return (
              <View key={option.id}>
                <View className="flex-row justify-between mb-1.5">
                  <Text className="text-foreground font-medium">{option.text}</Text>
                  <Text className="text-muted-foreground font-bold">
                    {count} ({percent}%)
                  </Text>
                </View>
                <View className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <View
                    className="h-full bg-secondary rounded-full"
                    style={{ width: `${percent}%` }}
                  />
                </View>
              </View>
            );
          })}

          {blankVotes > 0 && (
            <View>
              <View className="flex-row justify-between mb-1.5">
                <Text className="text-muted-foreground font-medium">
                  En blanco
                </Text>
                <Text className="text-muted-foreground font-bold">
                  {blankVotes} ({Math.round((blankVotes / total) * 100)}%)
                </Text>
              </View>
              <View className="h-2.5 bg-muted rounded-full overflow-hidden">
                <View
                  className="h-full bg-muted-foreground rounded-full"
                  style={{
                    width: `${Math.round((blankVotes / total) * 100)}%`,
                  }}
                />
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
