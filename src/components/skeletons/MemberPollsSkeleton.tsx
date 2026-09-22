import { useEffect, useRef } from "react";
import { View, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function MemberPollsSkeleton() {
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
    <View className="flex-1 bg-background">
      <SafeAreaView>
        <View className="px-6 pt-16 pb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Animated.View className="w-32 h-3 bg-muted rounded" style={{ opacity: fadeAnim }} />
            <Animated.View className="w-24 h-6 bg-muted rounded-full" style={{ opacity: fadeAnim }} />
          </View>
          <Animated.View className="w-64 h-8 bg-muted rounded mt-2" style={{ opacity: fadeAnim }} />
          <Animated.View className="w-48 h-8 bg-muted rounded mt-2" style={{ opacity: fadeAnim }} />
        </View>

        <View className="px-5 gap-4">
          {[1, 2, 3].map((key) => (
            <Animated.View 
              key={key} 
              className="p-6 rounded-[24px] flex-row justify-between items-center shadow-sm border bg-card border-border" 
              style={{ opacity: fadeAnim }}
            >
              <View className="flex-1 pr-4">
                <View className="w-32 h-6 bg-muted rounded mb-2" />
                <View className="w-20 h-4 bg-muted rounded" />
              </View>
              <View className="w-8 h-8 rounded-full border border-border bg-muted" />
            </Animated.View>
          ))}
        </View>
      </SafeAreaView>

      <View className="absolute bottom-0 left-0 right-0 px-5 pt-4 pb-8 bg-transparent">
        <Animated.View className="w-full h-16 bg-muted rounded-[20px]" style={{ opacity: fadeAnim }} />
      </View>
    </View>
  );
}
