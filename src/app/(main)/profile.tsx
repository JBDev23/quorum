import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  User,
  LogOut,
  Edit2,
  Check,
  X,
  Award,
  Vote,
  Users,
  CalendarCheck,
  ShieldCheck,
  ChevronsRight,
  Camera,
  Circle,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { alert } from "@/components/Alert";
import { useAuth } from "@/lib/auth";
import {
  getUserProfile,
  getUserStats,
  updateUserProfile,
  type UserProfile,
  type UserStats,
  uploadAvatar,
} from "@/services/profile";
import { router, useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import { useThemeColors } from "@/theme/useThemeColors";
import { ProfileSkeleton } from "@/components/skeletons/ProfileSkeleton";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const colors = useThemeColors();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats>({
    groups: 0,
    meetings: 0,
    votes: 0,
  });
  const [loading, setLoading] = useState(true);


  // Estados de edición
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      // Lanzamos las peticiones de perfil y estadísticas al mismo tiempo para que cargue más rápido
      const [profileData, statsData] = await Promise.all([
        getUserProfile(user.id),
        getUserStats(user.id),
      ]);

      setProfile(profileData);
      setStats(statsData);

      setEditForm({
        firstName: profileData.first_name || "",
        lastName: profileData.last_name || "",
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setIsSaving(true);

    try {
      await updateUserProfile(user.id, editForm.firstName, editForm.lastName);

      setProfile((prev) =>
        prev
          ? {
            ...prev,
            first_name: editForm.firstName.trim(),
            last_name: editForm.lastName.trim(),
          }
          : null,
      );

      setIsEditing(false);
    } catch (error) {
      alert(
        t("common.error"),
        error instanceof Error ? error.message : t("main.profile.error_update"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePickImage = async () => {
    if (!user?.id) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setIsUploadingAvatar(true);
      try {
        const newUrl = await uploadAvatar(
          user.id,
          result.assets[0].base64,
          result.assets[0].uri.endsWith(".png") ? "png" : "jpg",
        );

        setProfile((prev) => (prev ? { ...prev, avatar_url: newUrl } : null));
      } catch (error) {
        alert(
          t("common.error"),
          error instanceof Error ? error.message : t("main.profile.error_upload_avatar"),
        );
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const handleSignOut = () => {
    alert(t("main.profile.signout_title"), t("main.profile.signout_desc"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("main.profile.signout_btn"), style: "destructive", onPress: signOut },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} className="bg-background" stickyHeaderIndices={[0]}>
          <View className="w-full bg-background px-6 pt-6 pb-4 z-10">
            <Text className="text-3xl font-extrabold text-foreground">
              {t("main.profile.title")}
            </Text>
          </View>

          <View className="px-6">
            <ProfileSkeleton />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} className="bg-background" stickyHeaderIndices={[0]}>
        <View className="w-full bg-background px-6 pt-6 pb-4 z-10">
          <Text className="text-3xl font-extrabold text-foreground">
            {t("main.profile.title")}
          </Text>
        </View>

        <View className="px-6">
          {/* 1. CABECERA: AVATAR Y DATOS */}
          <View className="bg-card border border-border rounded-[24px] p-6 items-center mb-8 shadow-sm relative">
            {!isEditing && (
              <TouchableOpacity
                onPress={() => setIsEditing(true)}
                className="absolute top-4 right-4 bg-slate-50 p-2.5 rounded-full border border-slate-100"
              >
                <Edit2 size={18} color="#94a3b8" />
              </TouchableOpacity>
            )}

            {/* AVATAR INTERACTIVO */}
            <TouchableOpacity
              onPress={handlePickImage}
              disabled={isUploadingAvatar}
              activeOpacity={0.8}
              className="relative mb-4"
            >
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  className="w-24 h-24 rounded-full bg-slate-100 border-4 border-border"
                />
              ) : (
                <View className="w-24 h-24 rounded-full bg-primary/10 justify-center items-center border-4 border-border">
                  <User size={40} color={colors.primary} />
                </View>
              )}

              {/* Overlay oscuro al cargar */}
              {isUploadingAvatar && (
                <View className="absolute inset-0 bg-black/40 rounded-full justify-center items-center border-4 border-border">
                  <ActivityIndicator color="white" />
                </View>
              )}

              {/* Icono de cámara pequeño flotante para invitar a tocar */}
              {!isUploadingAvatar && (
                <View className="absolute bottom-0 right-0 bg-primary p-1.5 rounded-full border-2 border-border">
                  <Camera size={14} color="white" />
                </View>
              )}
            </TouchableOpacity>

            {/* Formulario / Vista de Datos */}
            {isEditing ? (
              <View className="w-full gap-3 mt-2">
                <TextInput
                  value={editForm.firstName}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, firstName: text })
                  }
                  placeholder={t("main.profile.placeholder_firstname")}
                  placeholderTextColor="#9ca3af"
                  className="bg-slate-50 text-foreground font-medium px-4 py-3 rounded-[16px] border border-border"
                />
                <TextInput
                  value={editForm.lastName}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, lastName: text })
                  }
                  placeholder={t("main.profile.placeholder_lastname")}
                  placeholderTextColor="#9ca3af"
                  className="bg-slate-50 text-foreground font-medium px-4 py-3 rounded-[16px] border border-border"
                />

                <View className="flex-row gap-2 mt-2">
                  <TouchableOpacity
                    onPress={() => setIsEditing(false)}
                    className="flex-1 bg-slate-100 py-3 rounded-[16px] flex-row justify-center items-center gap-2"
                  >
                    <X size={18} color="#64748b" />
                    <Text className="text-slate-500 font-bold">{t("main.profile.btn_cancel")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveProfile}
                    disabled={isSaving}
                    className="flex-1 bg-primary py-3 rounded-[16px] flex-row justify-center items-center gap-2"
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Check size={18} color="white" />
                        <Text className="text-primary-foreground font-bold">{t("main.profile.btn_save")}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <View className="flex-row items-center justify-center gap-2 flex-wrap px-4">
                  <Text className="text-2xl font-extrabold text-foreground text-center">
                    {[profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || t("main.profile.setup_name")}
                  </Text>

                  {profile?.is_premium && (
                    <View className="bg-amber-100 px-2 py-1 rounded-md border border-amber-200 flex-row items-center gap-1 mt-1">
                      <Award size={12} color="#d97706" />
                      <Text className="text-amber-600 text-xs font-extrabold uppercase tracking-widest">
                        {t("main.profile.premium_badge")}
                      </Text>
                    </View>
                  )}
                </View>

                <Text className="text-muted-foreground font-medium text-sm mt-1">
                  {user?.email}
                </Text>
              </>
            )}
          </View>

          {/* 2. DASHBOARD DE ESTADÍSTICAS */}
          <View className="flex-row items-center gap-2 mb-4 px-1 mt-2">
            <Circle size={8} fill="#10b981" color="#10b981" />
            <Text className="text-[11px] font-bold text-slate-500 tracking-widest uppercase">
              {t("main.profile.section_activity")}
            </Text>
          </View>

          <View className="flex-row flex-wrap justify-between gap-y-4 mb-8">
            <View className="w-[48%] bg-card border border-border p-4 rounded-[24px] items-center shadow-sm">
              <View className="bg-primary/10 p-3 rounded-full mb-2">
                <Users size={24} color={colors.primary} />
              </View>
              <Text className="text-3xl font-extrabold text-foreground">
                {stats.groups}
              </Text>
              <Text className="text-muted-foreground text-xs uppercase tracking-wider font-bold">
                {t("main.profile.stat_groups")}
              </Text>
            </View>

            <View className="w-[48%] bg-card border border-border p-4 rounded-[24px] items-center shadow-sm">
              <View className="bg-success/10 p-3 rounded-full mb-2">
                <CalendarCheck size={24} color="#10b981" />
              </View>
              <Text className="text-3xl font-extrabold text-foreground">
                {stats.meetings}
              </Text>
              <Text className="text-muted-foreground text-xs uppercase tracking-wider font-bold">
                {t("main.profile.stat_attendances")}
              </Text>
            </View>

            <View className="w-full bg-card border border-border p-4 rounded-[24px] flex-row items-center justify-between shadow-sm">
              <View className="flex-row items-center gap-4">
                <View className="bg-purple-50 p-3 rounded-full">
                  <Vote size={24} color="#8b5cf6" />
                </View>
                <View>
                  <Text className="text-foreground font-extrabold text-lg">
                    {t("main.profile.stat_votes_title")}
                  </Text>
                  <Text className="text-muted-foreground font-medium text-sm">
                    {t("main.profile.stat_votes_desc")}
                  </Text>
                </View>
              </View>
              <Text className="text-2xl font-extrabold text-foreground">
                {stats.votes}
              </Text>
            </View>
          </View>

          {/* 3. ACCIONES Y AJUSTES */}
          <View className="gap-3">
            {/* NUEVO BOTÓN: CAJA FUERTE */}
            <TouchableOpacity
              onPress={() => router.push("/profile/receipts")}
              className="bg-card border border-border p-4 rounded-[24px] flex-row items-center justify-between shadow-sm"
            >
              <View className="flex-row items-center gap-4">
                <View className="bg-primary/10 p-2.5 rounded-[16px]">
                  <ShieldCheck size={24} color={colors.primary} />
                </View>
                <View>
                  <Text className="text-foreground font-extrabold text-base">
                    {t("main.profile.safe_title")}
                  </Text>
                  <Text className="text-muted-foreground font-medium text-sm">
                    {t("main.profile.safe_desc")}
                  </Text>
                </View>
              </View>
              <ChevronsRight size={20} color="#94a3b8" />
            </TouchableOpacity>

            {!profile?.is_premium && (
              <TouchableOpacity
                onPress={() => router.push("/premium")}
                className="bg-[#fffbeb] border border-amber-200 p-4 rounded-[24px] flex-row items-center gap-4 shadow-sm"
              >
                <View className="bg-amber-100 p-2.5 rounded-[16px]">
                  <Award size={24} color="#d97706" />
                </View>
                <View className="flex-1">
                  <Text className="text-amber-700 font-extrabold text-base">
                    {t("main.profile.premium_title")}
                  </Text>
                  <Text className="text-amber-600/80 font-medium text-sm">
                    {t("main.profile.premium_desc")}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleSignOut}
              className="bg-card border border-destructive/20 p-4 rounded-[24px] flex-row items-center justify-between shadow-sm mt-2"
            >
              <View className="flex-row items-center gap-4">
                <View className="bg-destructive/10 p-2.5 rounded-[16px]">
                  <LogOut size={20} color="#ef4444" />
                </View>
                <Text className="text-destructive font-extrabold text-base">
                  {t("main.profile.btn_signout")}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
