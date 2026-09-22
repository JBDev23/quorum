import { useEffect, useRef } from "react";
import { View, Animated } from "react-native";

export function GroupsSkeleton() {
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
    <View className="gap-4 mt-2">
      {[1, 2, 3].map((key) => (
        <Animated.View key={key} className="bg-card border border-border rounded-[24px] p-5 w-full shadow-sm" style={{ opacity: fadeAnim }}>
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1 pr-4 gap-2">
              <View className="w-3/4 h-5 rounded bg-muted" />
              <View className="w-1/2 h-5 rounded bg-muted" />
            </View>

            <View className="flex-row gap-2 items-center">
              <View className="w-8 h-8 rounded-full bg-muted" />
              <View className="w-8 h-8 rounded-full bg-muted" />
            </View>
          </View>

          <View className="flex-col gap-2 items-start mt-2">
            <View className="w-28 h-8 rounded-full bg-muted" />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}
