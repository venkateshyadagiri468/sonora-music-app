import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { SupabaseProvider } from "./providers/SupabaseProvider";
import { queryClient } from "./providers/queryClient";
import { ThemeProvider } from "./providers/ThemeProvider";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <SupabaseProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="player" />
            <Stack.Screen name="room/[id]" />
          </Stack>
        </SupabaseProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}