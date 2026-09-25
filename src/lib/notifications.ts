import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { router, type Href } from "expo-router";

import {
  removePushToken,
  upsertPushToken,
} from "@/services/pushTokens";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getEasProjectId(): string | null {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    null
  );
}

export async function registerForPushNotificationsAsync(
  userId: string
): Promise<string | null> {
  if (Platform.OS === "web") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#0a0a0a",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    return null;
  }

  const projectId = getEasProjectId();
  if (!projectId) {
    console.warn("EAS projectId missing; cannot register push token");
    return null;
  }

  let token: string | null = null;
  let retries = 3;

  for (let i = 0; i < retries; i++) {
    try {
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      break; // Success, exit the retry loop
    } catch (error: any) {
      if (
        i < retries - 1 &&
        error?.message?.includes("SERVICE_NOT_AVAILABLE")
      ) {
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 2000 * (i + 1)));
        continue;
      }
      console.warn("Failed to register push token after retries:", error);
      return null;
    }
  }

  if (token) {
    try {
      const platform = Platform.OS === "ios" ? "ios" : "android";
      await upsertPushToken(userId, token, platform);
      return token;
    } catch (dbError) {
      console.warn("Failed to save push token to database:", dbError);
      return null;
    }
  }

  return null;
}

export async function unregisterPushTokenAsync(
  token: string | null | undefined
): Promise<void> {
  if (!token) return;
  try {
    await removePushToken(token);
  } catch (error) {
    console.warn("Failed to remove push token:", error);
  }
}

function meetingHref(meetingId: string): Href {
  return `/meeting/${meetingId}` as Href;
}

export function attachNotificationResponseListener() {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as {
      meetingId?: string;
      type?: string;
    };
    if (data?.meetingId && typeof data.meetingId === "string") {
      router.push(meetingHref(data.meetingId));
    }
  });
}

export async function getLastRegisteredPushToken(): Promise<string | null> {
  try {
    const projectId = getEasProjectId();
    if (!projectId) return null;
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch {
    return null;
  }
}
