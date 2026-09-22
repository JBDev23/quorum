import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type PlaceholderScreenProps = {
  title: string;
  description?: string;
};

export function PlaceholderScreen({ title, description }: PlaceholderScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-foreground text-2xl font-bold text-center mb-2">{title}</Text>
        {description ? (
          <Text className="text-muted-foreground text-center">{description}</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
