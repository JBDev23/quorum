import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  ScrollView,
  StatusBar
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Rect } from "react-native-svg";
import { Eye, EyeOff, Sparkles, CheckSquare, Square } from "lucide-react-native";

import { TermsModal } from "@/components/TermsModal";
import { PrivacyModal } from "@/components/PrivacyModal";

import { alert } from "@/components/Alert";
import { socialProviders, useAuth, type SocialProvider } from "@/lib/auth";
import { goHomeAfterAuth } from "@/lib/navigation";

function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

function LogoIcon() {
  return (
    <View className="items-center justify-center">
      <Svg width={200} height={219} viewBox="0 0 850 931" fill="none">
        <Rect x="11.5" y="388.5" width="823" height="385" rx="42.5" fill="white" stroke="white" strokeWidth="15" />
        <Path fillRule="evenodd" clipRule="evenodd" d="M755.843 174C773.052 174 789.053 182.851 798.198 197.429L842.355 267.813C847.351 275.776 850 284.986 850 294.386V320C850 347.614 827.614 370 800 370H50C22.3858 370 0 347.614 0 320V294.202C0 284.918 2.58543 275.817 7.46582 267.919L50.8447 197.717C59.9546 182.974 76.0496 174 93.3799 174H755.843ZM240 220C231.716 220 225 226.716 225 235C225 243.284 231.716 250 240 250H610C618.284 250 625 243.284 625 235C625 226.716 618.284 220 610 220H240Z" fill="white" />
        <Rect x="330.5" y="7.5" width="185" height="235" rx="42.5" fill="white" stroke="#0B3D91" strokeWidth="15" />
        <Path d="M163.697 785.476C157.363 785.519 155.128 781.316 158.704 776.088L334.891 518.516C338.467 513.287 345.069 512.607 349.636 516.997L439.098 602.972C443.664 607.362 450.593 606.925 454.573 601.996L527.456 511.736C531.435 506.807 530.436 499.894 525.224 496.295L456.804 449.04C451.592 445.44 452.465 441.914 458.756 441.166L610.555 423.088C616.845 422.34 624.017 426.43 626.576 432.224L687.99 571.321C690.549 577.116 688.077 579.427 682.469 576.481L619.639 543.488C614.031 540.542 606.165 542.073 602.07 546.904L454.782 720.672C450.687 725.505 443.33 726.248 438.349 722.335L369.09 667.902C364.11 663.988 357.115 665.013 353.468 670.191L279.383 775.357C275.735 780.535 267.643 784.768 261.309 784.812L163.697 785.476Z" fill="#0B3D91" />
        <Path d="M214 863.2C214 857.667 215.133 852.7 217.4 848.3C219.667 843.9 222.7 840.467 226.5 838C230.367 835.467 234.5 834.2 238.9 834.2C241.9 834.2 244.533 834.633 246.8 835.5C249.067 836.3 251.1 837.667 252.9 839.6V834.6H275V918H252.9V884.8C250.9 887.133 248.767 888.867 246.5 890C244.3 891.067 241.767 891.6 238.9 891.6C234.433 891.6 230.3 890.4 226.5 888C222.7 885.6 219.667 882.267 217.4 878C215.133 873.667 214 868.733 214 863.2ZM252.9 862.8C252.9 859.533 252.033 857.167 250.3 855.7C248.633 854.167 246.767 853.4 244.7 853.4C242.7 853.4 240.833 854.233 239.1 855.9C237.367 857.5 236.5 859.933 236.5 863.2C236.5 866.4 237.333 868.733 239 870.2C240.733 871.6 242.633 872.3 244.7 872.3C246.767 872.3 248.633 871.533 250.3 870C252.033 868.467 252.9 866.067 252.9 862.8ZM344.669 834.6V891H322.469V882.4C320.735 885.067 318.402 887.233 315.469 888.9C312.602 890.567 309.169 891.4 305.169 891.4C298.702 891.4 293.635 889.233 289.969 884.9C286.369 880.567 284.569 874.7 284.569 867.3V834.6H306.669V864.5C306.669 867.167 307.369 869.3 308.769 870.9C310.235 872.433 312.169 873.2 314.569 873.2C317.035 873.2 318.969 872.433 320.369 870.9C321.769 869.3 322.469 867.167 322.469 864.5V834.6H344.669ZM381.495 891.7C375.829 891.7 370.729 890.533 366.195 888.2C361.662 885.867 358.095 882.533 355.495 878.2C352.962 873.8 351.695 868.667 351.695 862.8C351.695 856.933 352.962 851.833 355.495 847.5C358.095 843.1 361.662 839.733 366.195 837.4C370.729 835.067 375.829 833.9 381.495 833.9C387.162 833.9 392.262 835.067 396.795 837.4C401.329 839.733 404.862 843.1 407.395 847.5C409.995 851.833 411.295 856.933 411.295 862.8C411.295 868.667 409.995 873.8 407.395 878.2C404.862 882.533 401.329 885.867 396.795 888.2C392.262 890.533 387.162 891.7 381.495 891.7ZM381.495 872.5C383.562 872.5 385.295 871.7 386.695 870.1C388.095 868.433 388.795 866 388.795 862.8C388.795 859.6 388.095 857.2 386.695 855.6C385.295 853.933 383.562 853.1 381.495 853.1C379.429 853.1 377.695 853.933 376.295 855.6C374.895 857.2 374.195 859.6 374.195 862.8C374.195 866 374.862 868.433 376.195 870.1C377.595 871.7 379.362 872.5 381.495 872.5ZM440.47 845C442.736 841.733 445.503 839.133 448.77 837.2C452.036 835.2 455.436 834.2 458.97 834.2V857.9H452.67C448.47 857.9 445.37 858.633 443.37 860.1C441.436 861.567 440.47 864.167 440.47 867.9V891H418.27V834.6H440.47V845ZM524.649 834.6V891H502.449V882.4C500.716 885.067 498.383 887.233 495.449 888.9C492.583 890.567 489.149 891.4 485.149 891.4C478.683 891.4 473.616 889.233 469.949 884.9C466.349 880.567 464.549 874.7 464.549 867.3V834.6H486.649V864.5C486.649 867.167 487.349 869.3 488.749 870.9C490.216 872.433 492.149 873.2 494.549 873.2C497.016 873.2 498.949 872.433 500.349 870.9C501.749 869.3 502.449 867.167 502.449 864.5V834.6H524.649ZM609.976 834.2C617.176 834.2 622.742 836.367 626.676 840.7C630.676 845.033 632.676 850.9 632.676 858.3V891H610.576V861.1C610.576 858.7 609.842 856.833 608.376 855.5C606.976 854.1 605.076 853.4 602.676 853.4C600.209 853.4 598.276 854.1 596.876 855.5C595.476 856.833 594.776 858.7 594.776 861.1V891H572.676V861.1C572.676 858.7 571.942 856.833 570.476 855.5C569.076 854.1 567.176 853.4 564.776 853.4C562.309 853.4 560.376 854.1 558.976 855.5C557.576 856.833 556.876 858.7 556.876 861.1V891H534.676V834.6H556.876V842.2C558.476 839.8 560.642 837.867 563.376 836.4C566.176 834.933 569.442 834.2 573.176 834.2C577.242 834.2 580.842 835.1 583.976 836.9C587.109 838.633 589.609 841.1 591.476 844.3C593.542 841.367 596.176 838.967 599.376 837.1C602.576 835.167 606.109 834.2 609.976 834.2Z" fill="white" />
      </Svg>
    </View>
  );
}

export default function LoginScreen() {
  const { t } = useTranslation();
  const {
    session,
    signInWithPassword,
    signUpWithPassword,
    signInWithMagicLink,
    signInWithOAuth,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const insets = useSafeAreaInsets();

  const visibleSocial = useMemo(
    () =>
      socialProviders.filter(
        (p) => !p.platforms || p.platforms.includes(Platform.OS)
      ),
    []
  );

  // If session arrives via deep link while this screen is open, leave login.
  useEffect(() => {
    if (session) {
      goHomeAfterAuth();
    }
  }, [session]);

  const run = async (action: () => Promise<boolean | void>, successMessage?: string) => {
    try {
      setBusy(true);
      const result = await action();
      if (result === false) {
        // User cancelled OAuth — stay on login, no error alert
        return;
      }
      if (successMessage) {
        alert(t("auth.login.alert_success"), successMessage);
      } else {
        goHomeAfterAuth();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t("auth.login.err_default");
      alert(t("auth.login.alert_error"), message);
    } finally {
      setBusy(false);
    }
  };

  const onSocial = (provider: SocialProvider) => {
    if (mode === "signup" && !acceptPrivacy) {
      alert(t("auth.login.alert_attention"), t("auth.login.err_accept_privacy"));
      return;
    }
    run(() => signInWithOAuth(provider));
  };

  const validateEmail = (emailStr: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr.trim());
  };

  const handlePasswordSubmit = () => {
    const trimmedEmail = email.trim();
    if (!validateEmail(trimmedEmail)) {
      alert(t("auth.login.alert_attention"), t("auth.login.err_invalid_email"));
      return;
    }
    if (password.length < 6) {
      alert(t("auth.login.alert_attention"), t("auth.login.err_short_password"));
      return;
    }
    
    if (mode === "signup" && (!firstName.trim() || !lastName.trim())) {
      alert(t("auth.login.alert_attention"), t("auth.login.err_missing_names"));
      return;
    }

    run(() =>
      mode === "signin"
        ? signInWithPassword(trimmedEmail, password)
        : signUpWithPassword(trimmedEmail, password, {
          first_name: firstName.trim() || undefined,
          last_name: lastName.trim() || undefined,
        })
    );
  };

  const handleMagicLink = () => {
    const trimmedEmail = email.trim();
    if (!validateEmail(trimmedEmail)) {
      alert(t("auth.login.alert_attention"), t("auth.login.err_magic_link_email"));
      return;
    }
    run(
      () => signInWithMagicLink(trimmedEmail),
      t("auth.login.msg_magic_link_sent")
    );
  };

  return (
    <View className="flex-1 bg-primary">
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Section */}
          <View className="px-8 pb-10 pt-4 items-center justify-center" style={{ paddingTop: Math.max(insets.top, 48) + 16 }}>
            <LogoIcon />
            <Text className="text-primary-foreground/80 text-base mt-4 text-center">
              {t("auth.login.subtitle")}
            </Text>
          </View>

          {/* Bottom Card */}
          <View
            className="flex-1 bg-card rounded-t-[32px] px-8 pt-8 shadow-sm"
            style={{ paddingBottom: Math.max(insets.bottom, 24) + 16 }}
          >
            {visibleSocial.map((provider) => (
              <TouchableOpacity
                key={provider.id}
                className="w-full flex-row items-center justify-center bg-card border border-border rounded-2xl py-4 px-6 mb-6"
                disabled={busy}
                onPress={() => onSocial(provider.id)}
              >
                {provider.id === 'google' || provider.label.toLowerCase().includes('google') ? (
                  <View className="mr-3"><GoogleIcon /></View>
                ) : null}
                <Text className="text-foreground font-semibold text-base">
                  {provider.label}
                </Text>
              </TouchableOpacity>
            ))}

            {visibleSocial.length > 0 && (
              <View className="flex-row items-center gap-4 mb-6">
                <View className="flex-1 h-[1px] bg-muted" />
                <Text className="text-muted-foreground text-sm font-medium">{t("auth.login.or_email")}</Text>
                <View className="flex-1 h-[1px] bg-muted" />
              </View>
            )}

            {mode === "signup" ? (
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text className="text-muted-foreground text-xs font-bold tracking-wider mb-2 uppercase">{t("auth.login.name_label")}</Text>
                  <TextInput
                    className="bg-card border border-border rounded-2xl px-5 py-4 text-foreground text-base"
                    placeholder={t("auth.login.name_placeholder")}
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="words"
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-muted-foreground text-xs font-bold tracking-wider mb-2 uppercase">{t("auth.login.surname_label")}</Text>
                  <TextInput
                    className="bg-card border border-border rounded-2xl px-5 py-4 text-foreground text-base"
                    placeholder={t("auth.login.surname_placeholder")}
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="words"
                    value={lastName}
                    onChangeText={setLastName}
                  />
                </View>
              </View>
            ) : null}

            <View className="mb-4">
              <Text className="text-muted-foreground text-xs font-bold tracking-wider mb-2 uppercase">{t("auth.login.email_label")}</Text>
              <TextInput
                className="bg-card border border-border rounded-2xl px-5 py-4 text-foreground text-base"
                placeholder={t("auth.login.email_placeholder")}
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View className="mb-8">
              <Text className="text-muted-foreground text-xs font-bold tracking-wider mb-2 uppercase">{t("auth.login.password_label")}</Text>
              <View className="relative justify-center">
                <TextInput
                  className="bg-card border border-border rounded-2xl px-5 py-4 pr-12 text-foreground text-base"
                  placeholder={t("auth.login.password_placeholder")}
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  className="absolute right-4"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#9CA3AF" />
                  ) : (
                    <Eye size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {mode === "signup" && (
              <View className="mb-6">
                <TouchableOpacity 
                  className="flex-row items-start"
                  activeOpacity={0.7}
                  onPress={() => setAcceptPrivacy(!acceptPrivacy)}
                >
                  <View className="mr-3 mt-0.5">
                    {acceptPrivacy ? (
                      <CheckSquare size={20} color="#0B3D91" />
                    ) : (
                      <Square size={20} color="#9CA3AF" />
                    )}
                  </View>
                  <Text className="text-muted-foreground text-sm flex-1 leading-relaxed">
                    {t("auth.login.accept_terms")}{" "}
                    <Text className="text-primary font-bold underline" onPress={() => setShowTerms(true)}>
                      {t("auth.login.terms")}
                    </Text>{" "}
                    {t("auth.login.and_the")}{" "}
                    <Text className="text-primary font-bold underline" onPress={() => setShowPrivacy(true)}>
                      {t("auth.login.privacy")}
                    </Text>.
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              className={`bg-primary w-full rounded-2xl py-4 items-center mb-4 shadow-sm ${busy || (mode === "signup" && !acceptPrivacy) ? 'opacity-60' : ''}`}
              disabled={busy || (mode === "signup" && !acceptPrivacy)}
              onPress={handlePasswordSubmit}
              accessibilityRole="button"
              accessibilityLabel={mode === "signin" ? t("auth.login.button_login") : t("auth.login.button_signup")}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-primary-foreground font-bold text-lg">
                  {mode === "signin" ? t("auth.login.button_login") : t("auth.login.button_signup")}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className={`w-full flex-row items-center justify-center border border-border rounded-2xl py-4 px-6 mb-8 ${busy || (mode === "signup" && !acceptPrivacy) ? 'opacity-60' : ''}`}
              disabled={busy || (mode === "signup" && !acceptPrivacy)}
              onPress={handleMagicLink}
              accessibilityRole="button"
              accessibilityLabel={t("auth.login.magic_link")}
            >
              <Sparkles size={18} color="#4B5563" className="mr-2" />
              <Text className="text-muted-foreground font-semibold text-base">{t("auth.login.magic_link")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={busy}
              onPress={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
              className="items-center mt-auto mb-6"
            >
              <Text className="text-muted-foreground text-base">
                {mode === "signin" ? (
                  <>{t("auth.login.no_account")} <Text className="text-primary font-bold">{t("auth.login.register_action")}</Text></>
                ) : (
                  <>{t("auth.login.have_account")} <Text className="text-primary font-bold">{t("auth.login.login_action")}</Text></>
                )}
              </Text>
            </TouchableOpacity>

            {mode === "signin" && (
              <View className="items-center px-4">
                <Text className="text-muted-foreground text-[11px] text-center leading-relaxed">
                  {t("auth.login.login_terms")}{" "}
                  <Text className="text-primary font-bold underline" onPress={() => setShowTerms(true)}>
                    {t("auth.login.terms")}
                  </Text>{" "}
                  {t("auth.login.and_the")}{" "}
                  <Text className="text-primary font-bold underline" onPress={() => setShowPrivacy(true)}>
                    {t("auth.login.privacy")}
                  </Text>
                </Text>
              </View>
            )}

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <TermsModal visible={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyModal visible={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </View>
  );
}
