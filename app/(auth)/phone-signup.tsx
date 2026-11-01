import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../providers/ThemeProvider";
import { useAuth } from "../providers/SupabaseProvider";

export default function PhoneSignupScreen() {
  const t = useTheme();
  const { phoneOtp, verifyOtp, loading } = useAuth();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sentCode, setSentCode] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async () => {
    setError("");
    if (!phone.trim()) {
      setError("Please enter a phone number");
      return;
    }
    const { error } = await phoneOtp(phone);
    if (error) setError(error);
    else setSentCode(true);
  };

  const handleVerify = async () => {
    setError("");
    if (!code.trim()) {
      setError("Please enter the verification code");
      return;
    }
    const { error } = await verifyOtp(phone, code);
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
        <Text style={[styles.title, { color: t.text }]}>Phone verification</Text>
        <Text style={[styles.subtitle, { color: t.textSecondary }]}>
          {sentCode ? "Enter the 6-digit code sent to your phone" : "We'll send you a verification code"}
        </Text>
      </View>

      {error && (
        <View style={[styles.error, { backgroundColor: t.error, borderColor: t.error }]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.form}>
        <TextInput
          style={inputStyle}
          placeholder={sentCode ? "Verification code" : "Phone number"}
          placeholderTextColor={t.textMuted}
          value={sentCode ? code : phone}
          onChangeText={sentCode ? setCode : setPhone}
          keyboardType={sentCode ? "numeric" : "phone-pad"}
          maxLength={sentCode ? 6 : undefined}
          autoComplete={sentCode ? "one-time-code" : "tel"}
          textContentType={sentCode ? "oneTimeCode" : "telephoneNumber"}
          editable={!loading}
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, { backgroundColor: t.primary }]}
        onPress={sentCode ? handleVerify : handleSendOtp}
        disabled={loading || (sentCode ? !code : !phone)}
      >
        <Text style={styles.primaryBtnText}>
          {loading ? "Verifying..." : sentCode ? "Verify code" : "Send code"}
        </Text>
      </TouchableOpacity>

      {!sentCode && (
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.push("/(auth)/email-signup")}>
            <Text style={[styles.footerText, { color: t.textSecondary }]}>Use email instead? </Text>
            <Text style={[styles.footerLink, { color: t.primary }]}>Continue with email</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  topBar: { marginBottom: 8 },
  header: { alignItems: "center", marginBottom: 32 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: "center" },
  form: { gap: 16, marginBottom: 24 },
  input: { height: 56, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, borderWidth: 1, textAlign: "center" },
  primaryBtn: { height: 56, borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 24 },
  primaryBtnText: { color: "#0E0E12", fontSize: 16, fontWeight: "700" },
  footer: { alignItems: "center", gap: 16 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: "600" },
  error: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 16 },
  errorText: { color: "#FFFFFF", fontSize: 14, flex: 1 },
});