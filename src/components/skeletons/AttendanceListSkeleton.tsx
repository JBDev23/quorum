import { useEffect, useRef } from "react";
import { View, Animated } from "react-native";

export function AttendanceListSkeleton() {
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
    <View className="flex-1 p-4 pt-4 gap-3">
      {[1, 2, 3, 4, 5].map((key) => (
        <Animated.View 
          key={key} 
          className="flex-row items-center justify-between bg-background p-4 rounded-2xl border border-border/50" 
          style={{ opacity: fadeAnim }}
        >
          <View className="flex-1 flex-row items-center gap-3 pr-4">
            <View className="w-10 h-10 rounded-full bg-muted" />
            <View className="w-32 h-5 bg-muted rounded" />
          </View>
          <View className="w-24 h-6 bg-muted rounded-full" />
        </Animated.View>
      ))}
    </View>
  );
}
