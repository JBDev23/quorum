import { useEffect, useRef } from "react";
import { View, Animated } from "react-native";

export function MeetingsSkeleton() {
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
    <View className="gap-8 w-full mt-4">
      <View>
        <View className="flex-row items-center gap-2 mb-4">
          <View className="w-2 h-2 rounded-full bg-muted" />
          <View className="w-32 h-4 rounded bg-muted" />
        </View>

        <View className="gap-4 mb-6">
          {[1, 2, 3, 4].map((key) => (
            <Animated.View key={key} className="bg-card border border-border rounded-2xl p-4 w-full" style={{ opacity: fadeAnim }}>
              <View className="flex-row justify-between items-center mb-4">
                <View className="w-20 h-5 rounded-full bg-muted" />
                <View className="w-24 h-3 rounded bg-muted" />
              </View>
              
              <View className="mb-4 gap-2">
                <View className="w-16 h-3 rounded bg-muted" />
                <View className="w-48 h-6 rounded bg-muted" />
              </View>
              
              <View className="flex-row items-center justify-between mt-2">
                <View className="w-24 h-7 rounded-full bg-muted" />
              </View>
            </Animated.View>
          ))}
        </View>
      </View>
    </View>
  );
}
