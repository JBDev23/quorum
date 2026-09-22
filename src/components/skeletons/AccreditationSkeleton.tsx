import { useEffect, useRef } from "react";
import { View, Animated } from "react-native";

export function AccreditationSkeleton() {
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
    <View className="flex-1 justify-center items-center p-6 w-full">
      <Animated.View className="w-48 h-8 bg-muted rounded mb-3" style={{ opacity: fadeAnim }} />
      <Animated.View className="w-64 h-4 bg-muted rounded mb-2" style={{ opacity: fadeAnim }} />
      <Animated.View className="w-56 h-4 bg-muted rounded mb-10" style={{ opacity: fadeAnim }} />

      <Animated.View className="p-4 bg-card rounded-3xl border border-border" style={{ opacity: fadeAnim }}>
        <View className="w-[250px] h-[250px] bg-muted rounded-xl" />
      </Animated.View>

      <Animated.View className="w-40 h-3 bg-muted rounded mt-10" style={{ opacity: fadeAnim }} />
    </View>
  );
}
