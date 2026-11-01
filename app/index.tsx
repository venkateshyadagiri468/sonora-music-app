import { Redirect } from "expo-router";
import { useAuth } from "./providers/SupabaseProvider";

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) return null;
  if (session) return <Redirect href="/(tabs)" />;
  return <Redirect href="/(auth)/welcome" />;
}