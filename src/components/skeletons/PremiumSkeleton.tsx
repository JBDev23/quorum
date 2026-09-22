import { useEffect, useRef } from "react";
import { View, Animated } from "react-native";

export function PremiumSkeleton() {
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
    <View className="gap-3 mt-4">
      {[1, 2, 3].map((key, index) => (
        <Animated.View
          key={key}
          className="bg-card border border-border p-4 rounded-2xl flex-row items-center justify-between relative"
          style={{ opacity: fadeAnim }}
        >
          {index === 0 && (
            <View className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-muted w-24 h-5" />
          )}

          <View className="flex-row items-center gap-4">
            <View className="w-5 h-5 rounded-full border-2 border-border" />
            <View className="gap-2">
              <View className="w-24 h-5 rounded bg-muted" />
              <View className="w-32 h-3 rounded bg-muted" />
            </View>
          </View>

          <View className="flex-row items-baseline gap-1">
            <View className="w-16 h-6 rounded bg-muted" />
            <View className="w-8 h-3 rounded bg-muted" />
          </View>
        </Animated.View>
      ))}

      <Animated.View className="w-full bg-muted rounded-2xl py-4 flex-row items-center justify-center mt-6 shadow-md" style={{ opacity: fadeAnim }}>
        <View className="w-40 h-5 rounded bg-background" />
      </Animated.View>
    </View>
  );
}
