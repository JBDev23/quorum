import { useEffect, useRef } from "react";
import { View, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MeetingsSkeleton } from "./MeetingsSkeleton";

export function GroupDetailSkeleton() {
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
      <View className="flex-row items-center justify-between px-4 pb-4 gap-2" style={{ paddingTop: insets.top + 16 }}>
        <View className="flex-row items-center flex-1">
          <View className="mr-3 bg-muted w-8 h-8 rounded-full" />
          <Animated.View className="w-40 h-6 bg-muted rounded" style={{ opacity: fadeAnim }} />
        </View>
        <View className="bg-muted w-8 h-8 rounded-full" />
      </View>

      <View className="p-4">
        {/* Cabecera del Grupo Skeleton */}
        <Animated.View className="bg-card p-4 rounded-2xl border border-border mb-6" style={{ opacity: fadeAnim }}>
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1 pr-3 gap-2">
              <View className="w-48 h-6 bg-muted rounded mb-2" />
              <View className="w-24 h-6 bg-muted rounded-full" />
            </View>
            <View className="flex-row items-center gap-2">
              <View className="bg-muted p-2.5 rounded-xl w-10 h-10" />
              <View className="bg-muted px-3 py-2 rounded-xl w-24 h-10" />
            </View>
          </View>
          <View className="w-64 h-4 bg-muted rounded" />
        </Animated.View>

        {/* Título de sección "Reuniones" */}
        <View className="flex-row justify-between items-center mb-6">
          <Animated.View className="w-32 h-8 bg-muted rounded" style={{ opacity: fadeAnim }} />
          <Animated.View className="w-20 h-8 bg-muted rounded-xl" style={{ opacity: fadeAnim }} />
        </View>

        {/* Reuniones skeleton */}
        <MeetingsSkeleton />
      </View>
    </View>
  );
}
