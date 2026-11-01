import React, { createContext, useContext, ReactNode } from "react";
import { useColorScheme } from "react-native";

const palette = {
  dark: {
    background: "#0E0E12",
    surface: "#1A1A22",
    surfaceElevated: "#25252F",
    primary: "#D4A853",
    primaryDim: "rgba(212, 168, 83, 0.15)",
    text: "#F5F0E8",
    textSecondary: "#A8A0B8",
    textMuted: "#6B6580",
    border: "rgba(255,255,255,0.08)",
    error: "#E0646E",
    success: "#6EC98A",
  },
};

type Theme = typeof palette.dark;

const ThemeContext = createContext<Theme>(palette.dark);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  return (
    <ThemeContext.Provider value={scheme === "dark" ? palette.dark : palette.dark}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export { palette };