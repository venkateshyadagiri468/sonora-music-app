import React from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, RefreshControl } from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../providers/ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { TrackWithRelations } from "../../lib/types";
import { formatDuration } from "../../lib/utils";

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  const t = useTheme();
  return (
    <View style={[styles.sectionHeader, { borderBottomColor: t.border }]}>
      <Text style={[styles.sectionTitle, { color: t.text }]}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={[styles.seeAll, { color: t.primary }]}>See all</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function TrackRow({ track, onPress }: { track: TrackWithRelations; onPress: () => void }) {
  const t = useTheme();
  return (
    <TouchableOpacity style={styles.trackRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.artwork, { backgroundColor: t.surfaceElevated }]}>
        {track.artwork_path ? (
          <Image source={{ uri: track.artwork_path }} style={styles.artworkImage} resizeMode="cover" />
        ) : (
          <Ionicons name="musical-notes" size={32} color={t.textMuted} />
        )}
      </View>
      <View style={[styles.trackInfo, { flex: 1 }]}>
        <Text style={[styles.trackTitle, { color: t.text }]} numberOfLines={1}>{track.title}</Text>
        <Text style={[styles.trackSubtitle, { color: t.textSecondary }]} numberOfLines={1}>
          {track.artist?.name || "Unknown Artist"} · {track.album?.title || "Unknown Album"}
        </Text>
      </View>
      <Text style={[styles.trackDuration, { color: t.textMuted }]}>{formatDuration(track.duration_ms)}</Text>
      <Ionicons name="ellipsis-horizontal" size={22} color={t.textMuted} style={{ marginLeft: 8 }} />
    </TouchableOpacity>
  );
}

function RecentlyPlayed({ data }: { data: TrackWithRelations[] | undefined }) {
  const t = useTheme();
  if (!data?.length) return null;
  return (
    <View style={styles.section}>
      <SectionHeader title="Recently played" />
      <FlatList
        data={data.slice(0, 10)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TrackRow
            track={item}
            onPress={() => router.push({ pathname: "/player", params: { trackId: item.id } })}
          />
        )}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: t.border }]} />}
      />
    </View>
  );
}

function RecommendedSection({ data, title }: { data: TrackWithRelations[] | undefined; title: string }) {
  const t = useTheme();
  if (!data?.length) return null;
  return (
    <View style={styles.section}>
      <SectionHeader
        title={title}
        onSeeAll={() => router.push({ pathname: "/(tabs)/search", params: { query: title.toLowerCase() } })}
      />
      <FlatList
        data={data.slice(0, 6)}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push({ pathname: "/player", params: { trackId: item.id } })}
            activeOpacity={0.7}
          >
            <View style={[styles.cardArtwork, { backgroundColor: t.surfaceElevated }]}>
              {item.artwork_path ? (
                <Image source={{ uri: item.artwork_path }} style={styles.cardArtworkImage} resizeMode="cover" />
              ) : (
                <Ionicons name="musical-notes" size={40} color={t.textMuted} />
              )}
            </View>
            <Text style={[styles.cardTitle, { color: t.text }]} numberOfLines={1}>{item.title}</Text>
            <Text style={[styles.cardSubtitle, { color: t.textSecondary }]} numberOfLines={1}>
              {item.artist?.name || "Unknown Artist"}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

export default function HomeScreen() {
  const t = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);

  const { data: recentTracks } = useQuery({
    queryKey: ["recent-tracks"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];
      const { data } = await supabase
        .from("play_history")
        .select("track_id, played_at, tracks(*)")
        .eq("user_id", session.user.id)
        .order("played_at", { ascending: false })
        .limit(20);
      return (data?.map((h) => h.tracks).filter(Boolean) as unknown as TrackWithRelations[]) || [];
    },
  });

  const { data: recommendedTracks } = useQuery({
    queryKey: ["recommended-tracks"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tracks")
        .select("*, artists(*), albums(*)")
        .limit(20);
      return data as TrackWithRelations[];
    },
  });

  const { data: newReleases } = useQuery({
    queryKey: ["new-releases"],
    queryFn: async () => {
      const { data } = await supabase
        .from("tracks")
        .select("*, artists(*), albums(*)")
        .order("created_at", { ascending: false })
        .limit(20);
      return data as TrackWithRelations[];
    },
  });

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: t.text }]}>Home</Text>
        <Ionicons name="notifications-outline" size={26} color={t.text} />
      </View>
      <View style={styles.greeting}>
        <Text style={[styles.greetingText, { color: t.text }]}>Good evening</Text>
        <Text style={[styles.greetingName, { color: t.text }]}>Venkatesh</Text>
      </View>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={22} color={t.textMuted} style={styles.searchIcon} />
        <Text style={[styles.searchPlaceholder, { color: t.textMuted }]}>Search songs, artists, albums</Text>
      </View>
      <View style={styles.madeForYou}>
        <SectionHeader
          title="Made for you"
          onSeeAll={() => router.push("/(tabs)/search")}
        />
        <FlatList
          data={recommendedTracks?.slice(0, 4) || []}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.bigCard}
              onPress={() => router.push({ pathname: "/player", params: { trackId: item.id } })}
              activeOpacity={0.7}
            >
              <View style={[styles.bigCardArtwork, { backgroundColor: t.surfaceElevated }]}>
                {item.artwork_path ? (
                  <Image source={{ uri: item.artwork_path }} style={styles.bigCardArtworkImage} resizeMode="cover" />
                ) : (
                  <Ionicons name="musical-notes" size={48} color={t.textMuted} />
                )}
              </View>
              <View style={styles.bigCardOverlay} />
              <View style={styles.bigCardContent}>
                <Text style={styles.bigCardLabel}>RECOMMENDED</Text>
                <Text style={[styles.bigCardTitle, { color: t.text }]} numberOfLines={2}>{item.title}</Text>
                <Text style={[styles.bigCardSubtitle, { color: t.textSecondary }]} numberOfLines={1}>
                  {item.artist?.name || "Unknown Artist"}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
      <RecommendedSection data={newReleases} title="New releases" />
      <RecommendedSection data={recommendedTracks} title="Based on your listening" />
      <RecentlyPlayed data={recentTracks} />
      <View style={styles.bottomSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: "700", letterSpacing: -0.5 },
  greeting: { paddingHorizontal: 20, marginBottom: 8 },
  greetingText: { fontSize: 14, color: "#A8A0B8" },
  greetingName: { fontSize: 28, fontWeight: "700", marginTop: 4 },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#1A1A22", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginHorizontal: 20, marginBottom: 24 },
  searchIcon: { marginRight: 10 },
  searchPlaceholder: { fontSize: 16, flex: 1 },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1 },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  seeAll: { fontSize: 14, fontWeight: "600" },
  horizontalList: { paddingHorizontal: 20, gap: 16 },
  card: { width: 160, gap: 8 },
  cardArtwork: { width: 160, height: 160, borderRadius: 8, overflow: "hidden" },
  cardArtworkImage: { width: "100%", height: "100%" },
  cardTitle: { fontSize: 14, fontWeight: "600" },
  cardSubtitle: { fontSize: 12 },
  bigCard: { width: "85%", height: 240, borderRadius: 16, overflow: "hidden", position: "relative" },
  bigCardArtwork: { width: "100%", height: "100%" },
  bigCardArtworkImage: { width: "100%", height: "100%" },
  bigCardOverlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(14,14,18,0.6)" },
  bigCardContent: { position: "absolute", bottom: 20, left: 20, right: 20 },
  bigCardLabel: { fontSize: 10, fontWeight: "600", color: "#D4A853", letterSpacing: 1, marginBottom: 4 },
  bigCardTitle: { fontSize: 22, fontWeight: "700", lineHeight: 28 },
  bigCardSubtitle: { fontSize: 14, marginTop: 2 },
  trackRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 10, gap: 12 },
  artwork: { width: 56, height: 56, borderRadius: 6, overflow: "hidden" },
  artworkImage: { width: "100%", height: "100%" },
  trackInfo: { flex: 1, minWidth: 0, justifyContent: "center" },
  trackTitle: { fontSize: 16, fontWeight: "600" },
  trackSubtitle: { fontSize: 13, marginTop: 2 },
  trackDuration: { fontSize: 14, fontWeight: "500", marginRight: 8 },
  separator: { height: 1, marginLeft: 88 },
  madeForYou: { marginBottom: 8 },
  bottomSpacer: { height: 100 },
});