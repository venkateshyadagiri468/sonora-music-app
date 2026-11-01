import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Switch, Alert, Linking, ScrollView } from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../providers/ThemeProvider";
import { useAuth } from "../providers/SupabaseProvider";

type SettingsItem = {
  label: string;
  icon: any;
  action: string;
  badge?: string;
  toggle?: boolean;
  external?: boolean;
};

type SettingsSection = {
  title: string;
  items: SettingsItem[];
};

const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    title: "Account",
    items: [
      { label: "Profile", icon: "person-circle-outline", action: "profile" },
      { label: "Subscription", icon: "wallet-outline", action: "subscription", badge: "Pro" },
      { label: "Connected accounts", icon: "link-outline", action: "connected" },
    ],
  },
  {
    title: "Preferences",
    items: [
      { label: "Playback", icon: "musical-notes-outline", action: "playback" },
      { label: "Notifications", icon: "notifications-outline", action: "notifications" },
      { label: "Language", icon: "earth-outline", action: "language" },
      { label: "Theme", icon: "moon-outline", action: "theme" },
    ],
  },
  {
    title: "Social",
    items: [
      { label: "Following", icon: "people-outline", action: "following" },
      { label: "Followers", icon: "people-circle-outline", action: "followers" },
      { label: "Blocked users", icon: "close-circle-outline", action: "blocked" },
    ],
  },
  {
    title: "App",
    items: [
      { label: "Data saver", icon: "wifi-outline", action: "data-saver", toggle: true },
      { label: "Offline mode", icon: "download-outline", action: "offline", toggle: true },
      { label: "Storage", icon: "folder-outline", action: "storage" },
      { label: "About", icon: "information-circle-outline", action: "about" },
    ],
  },
  {
    title: "Support",
    items: [
      { label: "Help center", icon: "help-circle-outline", action: "help", external: true },
      { label: "Privacy policy", icon: "shield-outline", action: "privacy", external: true },
      { label: "Terms of service", icon: "document-text-outline", action: "terms", external: true },
    ],
  },
];

const BADGE_STYLES: Record<string, { backgroundColor: string; color: string }> = {
  Pro: { backgroundColor: "#D4A853", color: "#0E0E12" },
  Beta: { backgroundColor: "#6EC98A", color: "#0E0E12" },
};

export default function SettingsScreen() {
  const t = useTheme();
  const { session, profile, signOut } = useAuth();
  const [dataSaver, setDataSaver] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: signOut },
    ]);
  };

  const handleItemPress = (item: SettingsItem) => {
    if (item.external) {
      const urls: Record<string, string> = {
        help: "https://sonora.app/help",
        privacy: "https://sonora.app/privacy",
        terms: "https://sonora.app/terms",
      };
      Linking.openURL(urls[item.action] || "https://sonora.app");
    } else if (item.action === "profile") {
      router.push("/settings/profile" as any);
    } else if (item.action === "subscription") {
      router.push("/settings/subscription" as any);
    } else if (item.action === "about") {
      Alert.alert("Sonora", "Version 1.0.0\nBuild 1\n\nMusic feels closer together.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: t.text }]}>Settings</Text>
      </View>

      {session && (
        <View style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: t.primaryDim }]}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Text style={[styles.avatarInitials, { color: t.primary }]}>
                {profile?.display_name?.charAt(0).toUpperCase() || session.user.email?.charAt(0).toUpperCase() || "U"}
              </Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: t.text }]}>{profile?.display_name || session.user.email?.split("@")[0] || "User"}</Text>
            <Text style={[styles.profileEmail, { color: t.textSecondary }]}>{session.user.email}</Text>
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.listContent}>
        {SETTINGS_SECTIONS.map((section, sectionIndex) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: t.textMuted }]}>{section.title}</Text>
            <View style={[styles.sectionContainer, { backgroundColor: t.surface, borderColor: t.border }]}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={item.action}
                  style={[
                    styles.item,
                    itemIndex === section.items.length - 1 && styles.itemLast,
                    { borderColor: t.border },
                  ]}
                  onPress={() => handleItemPress(item)}
                >
                  <Ionicons name={item.icon} size={24} color={t.textSecondary} style={styles.itemIcon} />
                  <View style={[styles.itemContent, { flex: 1 }]}>
                    <Text style={[styles.itemLabel, { color: t.text }]}>{item.label}</Text>
                  </View>
                  {item.badge && (
                    <View style={[styles.badge, BADGE_STYLES[item.badge]]}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                  {!item.toggle && !item.badge && (
                    <Ionicons name="chevron-forward" size={20} color={t.textMuted} />
                  )}
                  {item.toggle && item.action === "data-saver" && (
                    <Switch
                      value={dataSaver}
                      onValueChange={setDataSaver}
                      trackColor={{ false: t.border, true: t.primary }}
                      thumbColor={t.background}
                    />
                  )}
                  {item.toggle && item.action === "offline" && (
                    <Switch
                      value={offlineMode}
                      onValueChange={setOfflineMode}
                      trackColor={{ false: t.border, true: t.primary }}
                      thumbColor={t.background}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={[styles.signOutButton, { backgroundColor: t.error, borderColor: t.error }]} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={22} color="#FFFFFF" style={styles.signOutIcon} />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>

        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: t.textMuted }]}>Sonora v1.0.0 (build 1)</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: "700", letterSpacing: -0.5 },
  profileCard: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, gap: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center", overflow: "hidden" },
  avatarImage: { width: "100%", height: "100%", borderRadius: 32 },
  avatarInitials: { fontSize: 24, fontWeight: "700" },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: "600" },
  profileEmail: { fontSize: 14, marginTop: 2 },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
  sectionContainer: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  item: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 16, borderBottomWidth: 1 },
  itemLast: { borderBottomWidth: 0 },
  itemIcon: { width: 28, textAlign: "center" },
  itemContent: { flex: 1 },
  itemLabel: { fontSize: 16, fontWeight: "500" },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  signOutButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 12, marginTop: 24, borderWidth: 1 },
  signOutIcon: {},
  signOutText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  versionContainer: { alignItems: "center", paddingTop: 32, paddingBottom: 20 },
  versionText: { fontSize: 12 },
});