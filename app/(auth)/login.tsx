import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../providers/ThemeProvider";
import { useAuth } from "../providers/SupabaseProvider";

export default function LoginScreen() {
  const t = useTheme();
  const { emailLogin, googleLogin, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    const { error } = await emailLogin(email, password);
    if (error) setError(error);
    else router.replace("/(tabs)");
  };

  const handleGoogle = async () => {
    setError("");
    await googleLogin();
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
        <Text style={[styles.title, { color: t.text }]}>Welcome back</Text>
        <Text style={[styles.subtitle, { color: t.textSecondary }]}>Sign in to continue listening</Text>
      </View>

      {error && (
        <View style={[styles.error, { backgroundColor: t.error, borderColor: t.error }]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.form}>
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
          autoComplete="password"
          textContentType="password"
          editable={!loading}
        />
      </View>

      <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: t.primary }]} onPress={handleLogin} disabled={loading || !email || !password}>
        <Text style={styles.primaryBtnText}>{loading ? "Signing in..." : "Sign in"}</Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={[styles.dividerLine, { backgroundColor: t.border }]} />
        <Text style={[styles.dividerText, { color: t.textMuted }]}>Or continue with</Text>
        <View style={[styles.dividerLine, { backgroundColor: t.border }]} />
      </View>

      <View style={styles.socialBtns}>
        <TouchableOpacity style={[styles.socialBtn, { backgroundColor: "#FFFFFF", borderColor: t.border }]} onPress={handleGoogle} disabled={loading}>
          <Ionicons name="logo-google" size={22} color="#1A1A1A" style={styles.socialIcon} />
          <Text style={[styles.socialBtnText, { color: "#1A1A1A" }]}>Continue with Google</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.push("/(auth)/email-signup")}>
          <Text style={[styles.footerText, { color: t.textSecondary }]}>Don't have an account? </Text>
          <Text style={[styles.footerLink, { color: t.primary }]}>Sign up</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password" as any)} style={styles.forgotLink}>
          <Text style={[styles.footerLink, { color: t.primary }]}>Forgot password?</Text>
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
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },
  socialBtns: { gap: 12, marginBottom: 32 },
  socialBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, height: 56, borderRadius: 12, borderWidth: 1 },
  socialIcon: { marginRight: 2 },
  socialBtnText: { fontSize: 16, fontWeight: "600" },
  footer: { alignItems: "center", gap: 16 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: "600" },
  forgotLink: { paddingVertical: 4 },
  error: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 16 },
  errorText: { color: "#FFFFFF", fontSize: 14, flex: 1 },
});