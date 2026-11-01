import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../providers/ThemeProvider";
import { useAuth } from "../providers/SupabaseProvider";

export default function EmailSignupScreen() {
  const t = useTheme();
  const { emailSignup, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async () => {
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!displayName.trim()) {
      setError("Please enter a display name");
      return;
    }
    const { error } = await emailSignup(email, password, displayName.trim());
    if (error) setError(error);
    else router.replace("/(tabs)");
  };

  const inputStyle = [styles.input, { backgroundColor: t.surface, color: t.text, borderColor: t.border }];

  return (
    <ScrollView style={[styles.container, { backgroundColor: t.background }]} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={t.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Text style={[styles.title, { color: t.text }]}>Create account</Text>
        <Text style={[styles.subtitle, { color: t.textSecondary }]}>Start listening with Sonora</Text>
      </View>

      {error && (
        <View style={[styles.error, { backgroundColor: t.error, borderColor: t.error }]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.form}>
        <TextInput
          style={inputStyle}
          placeholder="Display name"
          placeholderTextColor={t.textMuted}
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          editable={!loading}
        />
        <TextInput
          style={inputStyle}
          placeholder="Email"
          placeholderTextColor={t.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          editable={!loading}
        />
        <TextInput
          style={inputStyle}
          placeholder="Password"
          placeholderTextColor={t.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          editable={!loading}
        />
        <TextInput
          style={inputStyle}
          placeholder="Confirm password"
          placeholderTextColor={t.textMuted}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          editable={!loading}
        />
      </View>

      <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: t.primary }]} onPress={handleSignup} disabled={loading || !email || !password || !displayName}>
        <Text style={styles.primaryBtnText}>{loading ? "Creating account..." : "Create account"}</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
          <Text style={[styles.footerText, { color: t.textSecondary }]}>Already have an account? </Text>
          <Text style={[styles.footerLink, { color: t.primary }]}>Sign in</Text>
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
  title: { fontSize: 28, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 16 },
  form: { gap: 16, marginBottom: 24 },
  input: { height: 56, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, borderWidth: 1 },
  primaryBtn: { height: 56, borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 24 },
  primaryBtnText: { color: "#0E0E12", fontSize: 16, fontWeight: "700" },
  footer: { alignItems: "center", gap: 16 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: "600" },
  error: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 16 },
  errorText: { color: "#FFFFFF", fontSize: 14, flex: 1 },
});