import { useEffect, useRef } from "react";
import { View, Animated, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MeetingExitButton } from "@/components/MeetingExitButton";

export function ResultsSkeleton() {
  const fadeAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim]);

  return (
    <SafeAreaView className="flex-1 bg-card" edges={["top"]}>
      <ScrollView
        className="flex-1 bg-card"
        contentContainerStyle={{ paddingBottom: 40 }}
        stickyHeaderIndices={[0]}
        scrollEnabled={false}
      >
        <View className="w-full bg-card px-4 pt-4 pb-4 z-10 mb-4 border-b border-black/5">
          <View className="flex-row items-center mb-4">
            <MeetingExitButton />
          </View>
          <View className="items-center">
            <View className="w-12 h-12 bg-muted rounded-full mb-4" />
            <Animated.View className="w-48 h-8 bg-muted rounded mb-2" style={{ opacity: fadeAnim }} />
            <Animated.View className="w-64 h-4 bg-muted rounded" style={{ opacity: fadeAnim }} />
          </View>
        </View>

        <View className="px-4">
          <View className="gap-6">
            {[1, 2].map((key) => (
              <View key={key}>
                <Animated.View className="w-48 h-6 bg-muted rounded mb-3" style={{ opacity: fadeAnim }} />
                <Animated.View className="bg-background p-4 rounded-xl border border-border mt-2" style={{ opacity: fadeAnim }}>
                  <View className="flex-row justify-between items-end mb-4">
                    <View className="w-32 h-4 bg-muted rounded" />
                    <View className="w-24 h-4 bg-muted rounded" />
                  </View>

                  <View className="gap-4">
                    {[1, 2].map((optKey) => (
                      <View key={optKey}>
                        <View className="flex-row justify-between mb-2">
                          <View className="w-32 h-4 bg-muted rounded" />
                          <View className="w-12 h-4 bg-muted rounded" />
                        </View>
                        <View className="h-2.5 bg-muted rounded-full overflow-hidden" />
                      </View>
                    ))}
                  </View>
                </Animated.View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
