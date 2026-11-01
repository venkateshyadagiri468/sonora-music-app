import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../providers/ThemeProvider";
import { useAuth } from "../providers/SupabaseProvider";

export default function LinkedInSignupScreen() {
  const t = useTheme();
  const { linkedinLogin, loading } = useAuth();
  const [error, setError] = useState("");

  const handleLinkedIn = async () => {
    setError("");
    await linkedinLogin();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.background }]} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={t.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <View style={styles.linkedinLogo}>
          <Ionicons name="logo-linkedin" size={48} color={t.primary} />
        </View>
        <Text style={[styles.title, { color: t.text }]}>Continue with LinkedIn</Text>
        <Text style={[styles.subtitle, { color: t.textSecondary }]}>Sign up using your LinkedIn account</Text>
      </View>

      {error && (
        <View style={[styles.error, { backgroundColor: t.error, borderColor: t.error }]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.linkedinBtn, { backgroundColor: "#0077B5" }]}
        onPress={handleLinkedIn}
        disabled={loading}
      >
        <Ionicons name="logo-linkedin" size={24} color="#FFFFFF" style={styles.linkedinBtnIcon} />
        <Text style={styles.linkedinBtnText}>
          {loading ? "Connecting..." : "Continue with LinkedIn"}
        </Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.push("/(auth)/email-signup")}>
          <Text style={[styles.footerText, { color: t.textSecondary }]}>Use email instead? </Text>
          <Text style={[styles.footerLink, { color: t.primary }]}>Continue with email</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/(auth)/phone-signup")} style={styles.altLink}>
          <Text style={[styles.altLinkText, { color: t.textMuted }]}>Or continue with phone</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  topBar: { marginBottom: 8 },
  header: { alignItems: "center", marginBottom: 32 },
  linkedinLogo: { width: 60, height: 60, marginBottom: 16, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 16, textAlign: "center" },
  linkedinBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, height: 56, borderRadius: 12, marginBottom: 24 },
  linkedinBtnIcon: { marginRight: 2 },
  linkedinBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  footer: { alignItems: "center", gap: 16 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: "600" },
  altLink: { paddingVertical: 4 },
  altLinkText: { fontSize: 14 },
  error: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 16 },
  errorText: { color: "#FFFFFF", fontSize: 14, flex: 1 },
});