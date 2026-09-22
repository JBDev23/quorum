import { InteractionManager } from "react-native";
import { router, type Href } from "expo-router";

const homeHref = "/" as Href;
const premiumHref = "/premium" as Href;

/** Clear login/callback from the stack so home has no back arrow. */
export function goHomeAfterAuth() {
  router.dismissTo(homeHref);
}

/** Open the Premium paywall after the current UI (alerts/modals) settles. */
export function openPremiumPaywall() {
  InteractionManager.runAfterInteractions(() => {
    router.push(premiumHref);
  });
}
