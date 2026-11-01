import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView } from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../providers/ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { TrackWithRelations, Playlist } from "../../lib/types";
import { formatDuration } from "../../lib/utils";

type LibraryTab = "playlists" | "tracks" | "albums" | "artists";

export default function LibraryScreen() {
  const t = useTheme();
  const [activeTab, setActiveTab] = useState<LibraryTab>("playlists");

  const { data: playlists } = useQuery({
    queryKey: ["user-playlists"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];
      const { data } = await supabase
        .from("playlists")
        .select("*")
        .eq("owner_id", session.user.id)
        .order("created_at", { ascending: false });
      return data as Playlist[];
    },
  });

  const { data: favoriteTracks } = useQuery({
    queryKey: ["favorite-tracks"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];
      const { data } = await supabase
        .from("favorites")
        .select("track_id, created_at, tracks(*)")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      return (data?.map((f) => f.tracks).filter(Boolean) as unknown as TrackWithRelations[]) || [];
    },
  });

  const { data: albums } = useQuery({
    queryKey: ["library-albums"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];
      const { data } = await supabase
        .from("albums")
        .select("*, artists(*)")
        .order("title")
        .limit(50);
      return data;
    },
  });

  const { data: artists } = useQuery({
    queryKey: ["library-artists"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];
      const { data } = await supabase
        .from("artists")
        .select("*")
        .order("name")
        .limit(50);
      return data;
    },
  });

  const tabs: LibraryTab[] = ["playlists", "tracks", "albums", "artists"];
  const tabLabels = ["Playlists", "Tracks", "Albums", "Artists"];

  const renderPlaylistItem = ({ item }: { item: Playlist }) => (
    <TouchableOpacity style={styles.playlistCard} onPress={() => router.push(`/playlist/${item.id}` as any)} activeOpacity={0.7}>
      <View style={[styles.playlistArtwork, { backgroundColor: t.surfaceElevated }]}>
        <Ionicons name="musical-notes" size={32} color={t.primary} />
      </View>
      <View style={styles.playlistInfo}>
        <Text style={[styles.playlistTitle, { color: t.text }]} numberOfLines={1}>{item.title}</Text>
        <Text style={[styles.playlistSubtitle, { color: t.textMuted }]}>Playlist</Text>
      </View>
    </TouchableOpacity>
  );

  const renderTrackItem = ({ item }: { item: TrackWithRelations }) => (
    <TouchableOpacity
      style={styles.trackRow}
      onPress={() => router.push({ pathname: "/player", params: { trackId: item.id } })}
      activeOpacity={0.7}
    >
      <View style={[styles.artwork, { backgroundColor: t.surfaceElevated }]}>
        {item.artwork_path ? (
          <Image source={{ uri: item.artwork_path }} style={styles.artworkImage} resizeMode="cover" />
        ) : (
          <Ionicons name="musical-notes" size={28} color={t.textMuted} />
        )}
      </View>
      <View style={[styles.trackInfo, { flex: 1 }]}>
        <Text style={[styles.trackTitle, { color: t.text }]} numberOfLines={1}>{item.title}</Text>
        <Text style={[styles.trackSubtitle, { color: t.textSecondary }]} numberOfLines={1}>
          {item.artist?.name || "Unknown Artist"}
        </Text>
      </View>
      <Text style={[styles.trackDuration, { color: t.textMuted }]}>{formatDuration(item.duration_ms)}</Text>
      <Ionicons name="ellipsis-horizontal" size={22} color={t.textMuted} style={{ marginLeft: 8 }} />
    </TouchableOpacity>
  );

  const renderAlbumItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.albumCard} onPress={() => router.push(`/album/${item.id}` as any)} activeOpacity={0.7}>
      <View style={[styles.albumArtwork, { backgroundColor: t.surfaceElevated }]}>
        {item.artwork_path ? (
          <Image source={{ uri: item.artwork_path }} style={styles.albumArtworkImage} resizeMode="cover" />
        ) : (
          <Ionicons name="albums" size={32} color={t.textMuted} />
        )}
      </View>
      <View style={styles.albumInfo}>
        <Text style={[styles.albumTitle, { color: t.text }]} numberOfLines={1}>{item.title}</Text>
        <Text style={[styles.albumSubtitle, { color: t.textMuted }]} numberOfLines={1}>
          {item.artists?.name || "Unknown Artist"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderArtistItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.artistCard} onPress={() => router.push(`/artist/${item.id}` as any)} activeOpacity={0.7}>
      <View style={[styles.artistAvatar, { backgroundColor: t.surfaceElevated }]}>
        <Ionicons name="person" size={28} color={t.textMuted} />
      </View>
      <Text style={[styles.artistName, { color: t.text }]} numberOfLines={1}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderEmptyState = (message: string, icon: any = "musical-notes-outline") => (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={48} color={t.textMuted} style={styles.emptyIcon} />
      <Text style={[styles.emptyText, { color: t.text }]}>{message}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: t.text }]}>Library</Text>
        <TouchableOpacity>
          <Ionicons name="add-circle-outline" size={26} color={t.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {tabs.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.tabActive,
              { borderColor: activeTab === tab ? t.primary : "transparent" },
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabLabel, { color: activeTab === tab ? t.primary : t.textMuted }]}>{tabLabels[i]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {activeTab === "playlists" && (
          <>
            {playlists && playlists.length > 0 ? (
              <FlatList
                data={playlists}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.grid}
                renderItem={renderPlaylistItem}
              />
            ) : (
              renderEmptyState("No playlists yet", "musical-notes-outline")
            )}
            <TouchableOpacity style={styles.createPlaylist}>
              <Ionicons name="add" size={24} color={t.primary} />
              <Text style={[styles.createPlaylistText, { color: t.primary }]}>Create playlist</Text>
            </TouchableOpacity>
          </>
        )}

        {activeTab === "tracks" && (
          <>
            {favoriteTracks && favoriteTracks.length > 0 ? (
              <FlatList
                data={favoriteTracks}
                keyExtractor={(item) => item.id}
                renderItem={renderTrackItem}
                ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: t.border }]} />}
              />
            ) : (
              renderEmptyState("No liked songs yet", "heart-outline")
            )}
          </>
        )}

        {activeTab === "albums" && (
          <>
            {albums && albums.length > 0 ? (
              <FlatList
                data={albums}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.grid}
                renderItem={renderAlbumItem}
              />
            ) : (
              renderEmptyState("No albums saved", "albums-outline")
            )}
          </>
        )}

        {activeTab === "artists" && (
          <>
            {artists && artists.length > 0 ? (
              <FlatList
                data={artists}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.grid}
                renderItem={renderArtistItem}
              />
            ) : (
              renderEmptyState("No artists followed", "person-outline")
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: "700", letterSpacing: -0.5 },
  tabBar: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 2, borderRadius: 4 },
  tabActive: {},
  tabLabel: { fontSize: 14, fontWeight: "600" },
  content: { flex: 1, paddingHorizontal: 16 },
  grid: { gap: 16, paddingBottom: 100 },
  playlistCard: { width: "48%", aspectRatio: 1, borderRadius: 12, overflow: "hidden" },
  playlistArtwork: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
  playlistInfo: { padding: 12 },
  playlistTitle: { fontSize: 14, fontWeight: "600" },
  playlistSubtitle: { fontSize: 12, marginTop: 2 },
  trackRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12 },
  artwork: { width: 56, height: 56, borderRadius: 6, overflow: "hidden" },
  artworkImage: { width: "100%", height: "100%" },
  trackInfo: { minWidth: 0, justifyContent: "center" },
  trackTitle: { fontSize: 16, fontWeight: "600" },
  trackSubtitle: { fontSize: 13, marginTop: 2 },
  trackDuration: { fontSize: 14, fontWeight: "500" },
  separator: { height: 1, marginLeft: 88 },
  albumCard: { width: "48%", aspectRatio: 1, borderRadius: 12, overflow: "hidden" },
  albumArtwork: { width: "100%", height: "100%" },
  albumArtworkImage: { width: "100%", height: "100%" },
  albumInfo: { padding: 12 },
  albumTitle: { fontSize: 14, fontWeight: "600" },
  albumSubtitle: { fontSize: 12, marginTop: 2 },
  artistCard: { width: "48%", aspectRatio: 1, borderRadius: 12, overflow: "hidden", alignItems: "center", justifyContent: "center", gap: 8, padding: 16 },
  artistAvatar: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center" },
  artistName: { fontSize: 14, fontWeight: "600", textAlign: "center" },
  emptyState: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 40 },
  emptyIcon: { marginBottom: 16 },
  emptyText: { fontSize: 16, fontWeight: "500", textAlign: "center" },
  createPlaylist: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, marginTop: 16 },
  createPlaylistText: { fontSize: 16, fontWeight: "600" },
});