import { useEffect, useRef } from "react";
import { View, Animated } from "react-native";

export function SettingsSkeleton() {
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
    <View>
      {[1, 2, 3].map((key, index) => (
        <Animated.View 
          key={key} 
          className={`flex-row items-center justify-between py-4 ${index === 2 ? "" : "border-b border-border/30"}`} 
          style={{ opacity: fadeAnim }}
        >
          <View className="flex-row items-center flex-1 pr-4">
            <View className="mr-4">
              <View className="w-6 h-6 rounded-md bg-muted" />
            </View>
            <View className="flex-1 gap-2">
              <View className="w-32 h-4 rounded bg-muted" />
              {index === 2 && <View className="w-48 h-3 rounded bg-muted" />}
            </View>
          </View>
          <View className="w-12 h-6 rounded-full bg-muted" />
        </Animated.View>
      ))}
    </View>
  );
}
