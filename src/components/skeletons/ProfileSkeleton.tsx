import { useEffect, useRef } from "react";
import { View, Animated } from "react-native";

export function ProfileSkeleton() {
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
    <View className="gap-6 mt-2">
      {/* Avatar Card */}
      <Animated.View className="bg-card border border-border rounded-[24px] p-6 items-center mb-2 shadow-sm" style={{ opacity: fadeAnim }}>
        <View className="w-24 h-24 rounded-full bg-muted mb-4" />
        <View className="w-48 h-8 rounded bg-muted mb-2" />
        <View className="w-32 h-4 rounded bg-muted" />
      </Animated.View>

      {/* Stats Section */}
      <View>
        <View className="flex-row items-center gap-2 mb-4 px-1">
          <View className="w-2 h-2 rounded-full bg-muted" />
          <View className="w-24 h-3 rounded bg-muted" />
        </View>
        
        <View className="flex-row flex-wrap justify-between gap-y-4 mb-2">
          <Animated.View className="w-[48%] bg-card border border-border p-4 rounded-[24px] items-center shadow-sm" style={{ opacity: fadeAnim }}>
            <View className="w-12 h-12 rounded-full bg-muted mb-2" />
            <View className="w-10 h-8 rounded bg-muted mb-1" />
            <View className="w-16 h-3 rounded bg-muted" />
          </Animated.View>

          <Animated.View className="w-[48%] bg-card border border-border p-4 rounded-[24px] items-center shadow-sm" style={{ opacity: fadeAnim }}>
            <View className="w-12 h-12 rounded-full bg-muted mb-2" />
            <View className="w-10 h-8 rounded bg-muted mb-1" />
            <View className="w-16 h-3 rounded bg-muted" />
          </Animated.View>

          <Animated.View className="w-full bg-card border border-border p-4 rounded-[24px] flex-row items-center justify-between shadow-sm" style={{ opacity: fadeAnim }}>
            <View className="flex-row items-center gap-4">
              <View className="w-12 h-12 rounded-full bg-muted" />
              <View className="gap-2">
                <View className="w-32 h-5 rounded bg-muted" />
                <View className="w-40 h-3 rounded bg-muted" />
              </View>
            </View>
            <View className="w-8 h-8 rounded bg-muted" />
          </Animated.View>
        </View>
      </View>

      {/* Actions Section */}
      <View className="gap-3 mt-2">
        {[1, 2, 3].map((key) => (
          <Animated.View key={key} className="bg-card border border-border p-4 rounded-[24px] flex-row items-center justify-between shadow-sm" style={{ opacity: fadeAnim }}>
            <View className="flex-row items-center gap-4">
              <View className="w-11 h-11 rounded-[16px] bg-muted" />
              <View className="gap-2">
                <View className="w-24 h-5 rounded bg-muted" />
                <View className="w-32 h-3 rounded bg-muted" />
              </View>
            </View>
            <View className="w-5 h-5 rounded bg-muted" />
          </Animated.View>
        ))}
      </View>
    </View>
  );
}
