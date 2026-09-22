import { useEffect, useRef } from "react";
import { View, Animated } from "react-native";

export function SurveysSkeleton() {
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
        <Animated.View 
          key={key} 
          className="bg-card border border-border p-5 rounded-2xl" 
          style={{ opacity: fadeAnim }}
        >
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-1 pr-4">
              <View className="flex-row flex-wrap items-center gap-2 mb-3">
                <View className="w-20 h-3 bg-muted rounded" />
                <View className="w-24 h-5 bg-muted rounded-md" />
              </View>

              <View className="w-48 h-6 bg-muted rounded mb-1" />
            </View>
          </View>

          <View className="flex-row flex-wrap gap-2 mb-4">
            <View className="w-16 h-8 bg-muted rounded-xl" />
            <View className="w-16 h-8 bg-muted rounded-xl" />
            <View className="w-24 h-8 bg-muted rounded-xl" />
          </View>

          <View className="w-full h-12 bg-muted rounded-xl" />
        </Animated.View>
      ))}
    </View>
  );
}
