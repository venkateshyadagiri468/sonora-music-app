import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../providers/SupabaseProvider";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { googleLogin, loading } = useAuth();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Background Artwork */}
      <Image
        source={require("../../assets/welcome_bg.jpg")}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* Dark Vignette & Bottom Fade Gradient */}
      <LinearGradient
        colors={[
          "rgba(4, 4, 7, 0.45)",
          "rgba(4, 4, 7, 0.15)",
          "rgba(4, 4, 7, 0.65)",
          "rgba(4, 4, 7, 0.95)",
          "#040407",
        ]}
        locations={[0, 0.25, 0.52, 0.68, 0.85]}
        style={StyleSheet.absoluteFill}
      />

      {/* Content Container */}
      <View
        style={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 24),
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
      >
        {/* Brand Header */}
        <View style={styles.topBar}>
          <Text style={styles.brand}>S O N O R A</Text>
        </View>

        {/* Spacer to push headline & actions to bottom half */}
        <View style={styles.spacer} />

        {/* Hero Copy */}
        <View style={styles.copy}>
          <Text style={styles.headline}>
            Music feels{"\n"}closer <Text style={styles.highlight}>together.</Text>
          </Text>
          <Text style={styles.sub}>Listen solo or share the moment.</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={googleLogin}
            disabled={loading}
            activeOpacity={0.88}
          >
            <Image
              source={require("../../assets/google-g.png")}
              style={styles.googleIcon}
              resizeMode="contain"
            />
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.phoneBtn}
            onPress={() => router.push("/(auth)/phone-signup")}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Ionicons name="call" size={19} color="#FFFFFF" style={styles.phoneIcon} />
            <Text style={styles.phoneBtnText}>Continue with phone</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={() => router.push("/(auth)/login")}
            activeOpacity={0.7}
          >
            <Text style={styles.footerText}>
              Already have an account?{" "}
              <Text style={styles.signInLink}>Sign in</Text>
            </Text>
          </TouchableOpacity>

          <Text style={styles.legal}>
            By continuing, you agree to our{" "}
            <Text style={styles.legalLink}>Terms</Text> and{" "}
            <Text style={styles.legalLink}>Privacy Policy</Text>.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#040407",
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.72,
    width: "100%",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  topBar: {
    alignItems: "center",
    paddingTop: 16,
  },
  brand: {
    fontSize: 17,
    fontWeight: "300",
    color: "#FFFFFF",
    letterSpacing: 10,
    textTransform: "uppercase",
  },
  spacer: {
    flex: 1,
  },
  copy: {
    alignItems: "center",
    marginBottom: 36,
  },
  headline: {
    fontSize: 40,
    fontFamily: "serif",
    fontWeight: "400",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 48,
    letterSpacing: -0.5,
  },
  highlight: {
    color: "#EAA663",
    fontFamily: "serif",
    fontStyle: "normal",
  },
  sub: {
    fontSize: 16,
    color: "#9C98A6",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 22,
    fontWeight: "400",
  },
  buttons: {
    gap: 14,
    marginBottom: 44,
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    height: 56,
    borderRadius: 28,
    paddingHorizontal: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  googleBtnText: {
    color: "#0E0E12",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  phoneBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.09)",
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 20,
  },
  phoneIcon: {
    marginRight: 12,
  },
  phoneBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
  footer: {
    alignItems: "center",
    gap: 14,
    paddingBottom: 8,
  },
  footerText: {
    fontSize: 14,
    color: "#8E8A98",
    textAlign: "center",
  },
  signInLink: {
    color: "#EAA663",
    fontWeight: "600",
  },
  legal: {
    fontSize: 12,
    color: "#6B6776",
    textAlign: "center",
    lineHeight: 18,
  },
  legalLink: {
    color: "#EAA663",
    fontWeight: "500",
  },
});