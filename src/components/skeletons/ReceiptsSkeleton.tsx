import { useEffect, useRef } from "react";
import { View, Animated } from "react-native";

export function ReceiptsSkeleton() {
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
    <View className="gap-4">
      {[1, 2, 3].map((key) => (
        <Animated.View key={key} className="bg-card border border-border p-6 rounded-3xl" style={{ opacity: fadeAnim }}>
          <View className="flex-row justify-between items-center mb-6">
            <View className="w-24 h-6 rounded-full bg-muted" />
            <View className="w-32 h-4 rounded bg-muted" />
          </View>

          <View className="w-40 h-3 rounded bg-muted mb-2" />
          <View className="w-64 h-6 rounded bg-muted mb-4" />

          <View className="bg-primary/5 p-4 rounded-2xl gap-2">
            <View className="w-32 h-3 rounded bg-muted mb-2" />
            <View className="w-full h-4 rounded bg-muted" />
            <View className="w-3/4 h-4 rounded bg-muted" />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}
