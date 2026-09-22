import { useEffect, useRef } from "react";
import { View, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function MeetingDetailSkeleton() {
  const fadeAnim = useRef(new Animated.Value(0.4)).current;
  const insets = useSafeAreaInsets();

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
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 pb-4 gap-2 border-b border-border/30" style={{ paddingTop: insets.top + 16 }}>
        <View className="flex-row items-center gap-3">
          <View className="bg-muted w-8 h-8 rounded-full" />
          <Animated.View className="w-32 h-6 bg-muted rounded" style={{ opacity: fadeAnim }} />
        </View>
        <View className="bg-muted w-8 h-8 rounded-full" />
      </View>

      <View className="p-4 gap-6 mt-4">
        <Animated.View className="bg-card p-6 rounded-3xl border border-border items-center" style={{ opacity: fadeAnim }}>
          <View className="w-16 h-16 bg-muted rounded-full mb-4" />
          <View className="w-48 h-6 bg-muted rounded mb-2" />
          <View className="w-32 h-4 bg-muted rounded" />
        </Animated.View>

        <View className="gap-4 mt-2">
          <Animated.View className="w-32 h-6 bg-muted rounded mb-2" style={{ opacity: fadeAnim }} />
          {[1, 2, 3].map((key) => (
            <Animated.View key={key} className="bg-card p-4 rounded-2xl border border-border flex-row items-center gap-4" style={{ opacity: fadeAnim }}>
              <View className="w-10 h-10 bg-muted rounded-full" />
              <View className="flex-1 gap-2">
                <View className="w-48 h-4 bg-muted rounded" />
                <View className="w-24 h-3 bg-muted rounded" />
              </View>
            </Animated.View>
          ))}
        </View>
      </View>
    </View>
  );
}
