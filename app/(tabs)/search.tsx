import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useTheme } from "../providers/ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { TrackWithRelations } from "../../lib/types";
import { formatDuration } from "../../lib/utils";

const RECENT_SEARCHES = ["The Weeknd", "Lo-fi beats", "Taylor Swift", "Jazz", "Workout"];

export default function SearchScreen() {
  const t = useTheme();
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  const { data: results, isLoading } = useQuery({
    queryKey: ["search", query],
    queryFn: async () => {
      if (!query.trim()) return [];
      const { data } = await supabase
        .from("tracks")
        .select("*, artists(*), albums(*)")
        .ilike("title", `%${query}%`)
        .limit(20);
      return data as TrackWithRelations[];
    },
    enabled: query.length >= 2,
  });

  const { data: artists } = useQuery({
    queryKey: ["search-artists", query],
    queryFn: async () => {
      if (!query.trim()) return [];
      const { data } = await supabase
        .from("artists")
        .select("*")
        .ilike("name", `%${query}%`)
        .limit(10);
      return data;
    },
    enabled: query.length >= 2,
  });

  const handleSearch = (text: string) => {
    setQuery(text);
    setShowResults(text.length >= 2);
  };

  const clearSearch = () => {
    setQuery("");
    setShowResults(false);
  };

  const handleResultPress = (track: TrackWithRelations) => {
    router.push({ pathname: "/player", params: { trackId: track.id } });
  };

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <View style={styles.header}>
        <TextInput
          style={[styles.searchInput, { color: t.text, backgroundColor: t.surface }]}
          placeholder="Search songs, artists, albums..."
          placeholderTextColor={t.textMuted}
          value={query}
          onChangeText={handleSearch}
          onFocus={() => setShowResults(query.length >= 2)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Ionicons name="close" size={24} color={t.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {showResults && query.length >= 2 ? (
        <ScrollView style={styles.resultsContainer} contentContainerStyle={styles.resultsContent}>
          {isLoading ? (
            <View style={styles.loading}>
              <Text style={[styles.loadingText, { color: t.textMuted }]}>Searching...</Text>
            </View>
          ) : (
            <>
              {artists && artists.length > 0 && (
                <View style={styles.resultSection}>
                  <Text style={[styles.resultSectionTitle, { color: t.text }]}>Artists</Text>
                  <FlatList
                    data={artists}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                    renderItem={({ item }) => (
                      <TouchableOpacity style={styles.artistCard} onPress={() => router.push(`/artist/${item.id}` as any)}>
                        <View style={[styles.artistAvatar, { backgroundColor: t.surfaceElevated }]}>
                          <Ionicons name="person" size={28} color={t.textMuted} />
                        </View>
                        <Text style={[styles.artistName, { color: t.text }]} numberOfLines={1}>{item.name}</Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}

              {results && results.length > 0 && (
                <View style={styles.resultSection}>
                  <Text style={[styles.resultSectionTitle, { color: t.text }]}>Songs</Text>
                  <FlatList
                    data={results}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.trackRow}
                        onPress={() => handleResultPress(item)}
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
                            {item.artist?.name || "Unknown Artist"} · {item.album?.title || "Unknown Album"}
                          </Text>
                        </View>
                        <Text style={[styles.trackDuration, { color: t.textMuted }]}>{formatDuration(item.duration_ms)}</Text>
                      </TouchableOpacity>
                    )}
                    ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: t.border }]} />}
                  />
                </View>
              )}

              {!isLoading && (!results?.length && !artists?.length) && (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={48} color={t.textMuted} style={styles.emptyIcon} />
                  <Text style={[styles.emptyText, { color: t.text }]}>No results for "{query}"</Text>
                  <Text style={[styles.emptySubtext, { color: t.textMuted }]}>Try a different search term</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      ) : (
        <ScrollView style={styles.suggestionsContainer} contentContainerStyle={styles.suggestionsContent}>
          <View style={styles.suggestionSection}>
            <View style={[styles.suggestionHeader, { borderBottomColor: t.border }]}>
              <Text style={[styles.suggestionTitle, { color: t.text }]}>Browse all</Text>
            </View>
            <View style={styles.genreGrid}>
              {["Pop", "Hip-Hop", "Rock", "Electronic", "R&B", "Jazz", "Classical", "Country"].map((genre) => (
                <TouchableOpacity key={genre} style={[styles.genreCard, { backgroundColor: t.surfaceElevated }]} onPress={() => setQuery(genre)}>
                  <Ionicons name="musical-notes" size={24} color={t.primary} style={styles.genreIcon} />
                  <Text style={[styles.genreName, { color: t.text }]}>{genre}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.suggestionSection}>
            <View style={[styles.suggestionHeader, { borderBottomColor: t.border }]}>
              <Text style={[styles.suggestionTitle, { color: t.text }]}>Recent searches</Text>
            </View>
            {RECENT_SEARCHES.map((search) => (
              <TouchableOpacity key={search} style={styles.recentItem} onPress={() => setQuery(search)}>
                <Ionicons name="time" size={20} color={t.textMuted} style={styles.recentIcon} />
                <Text style={[styles.recentText, { color: t.text }]}>{search}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.suggestionSection}>
            <View style={[styles.suggestionHeader, { borderBottomColor: t.border }]}>
              <Text style={[styles.suggestionTitle, { color: t.text }]}>Trending now</Text>
            </View>
            <FlatList
              data={["Top 50 Global", "Viral 50", "New Music Friday", "Chill Hits", "RapCaviar"]}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.trendingItem} onPress={() => setQuery(item)}>
                  <View style={[styles.trendingRank, { backgroundColor: t.primaryDim }]}>
                    <Text style={[styles.trendingNumber, { color: t.primary }]}>#{["Top 50 Global", "Viral 50", "New Music Friday", "Chill Hits", "RapCaviar"].indexOf(item) + 1}</Text>
                  </View>
                  <View style={styles.trendingInfo}>
                    <Ionicons name="flame" size={16} color={t.primary} style={styles.trendingIcon} />
                    <Text style={[styles.trendingName, { color: t.text }]}>{item}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={t.textMuted} />
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: t.border }]} />}
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  searchInput: { flex: 1, height: 48, borderRadius: 24, paddingHorizontal: 20, fontSize: 16 },
  clearButton: { padding: 4 },
  resultsContainer: { flex: 1 },
  resultsContent: { paddingBottom: 100 },
  loading: { alignItems: "center", paddingVertical: 60 },
  loadingText: { fontSize: 16 },
  resultSection: { marginBottom: 32 },
  resultSectionTitle: { fontSize: 20, fontWeight: "700", paddingHorizontal: 20, marginBottom: 12 },
  horizontalList: { paddingHorizontal: 20, gap: 16 },
  artistCard: { width: 120, alignItems: "center", gap: 8 },
  artistAvatar: { width: 100, height: 100, borderRadius: 50, justifyContent: "center", alignItems: "center" },
  artistName: { fontSize: 14, fontWeight: "600", textAlign: "center", width: 120 },
  trackRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 10, gap: 12 },
  artwork: { width: 56, height: 56, borderRadius: 6, overflow: "hidden" },
  artworkImage: { width: "100%", height: "100%" },
  trackInfo: { flex: 1, minWidth: 0, justifyContent: "center" },
  trackTitle: { fontSize: 16, fontWeight: "600" },
  trackSubtitle: { fontSize: 13, marginTop: 2 },
  trackDuration: { fontSize: 14, fontWeight: "500" },
  separator: { height: 1, marginLeft: 88 },
  emptyState: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 40 },
  emptyIcon: { marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: "600", textAlign: "center", marginBottom: 8 },
  emptySubtext: { fontSize: 14, textAlign: "center" },
  suggestionsContainer: { flex: 1 },
  suggestionsContent: { paddingBottom: 100 },
  suggestionSection: { marginBottom: 24 },
  suggestionHeader: { paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  suggestionTitle: { fontSize: 18, fontWeight: "700" },
  genreGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 12 },
  genreCard: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  genreIcon: { marginRight: 4 },
  genreName: { fontSize: 14, fontWeight: "600" },
  recentItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  recentIcon: { marginRight: 4 },
  recentText: { fontSize: 16, flex: 1 },
  trendingItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, gap: 12 },
  trendingRank: { width: 32, height: 32, borderRadius: 6, justifyContent: "center", alignItems: "center" },
  trendingNumber: { fontSize: 12, fontWeight: "700" },
  trendingInfo: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  trendingIcon: { marginRight: 4 },
  trendingName: { fontSize: 16, fontWeight: "500" },
});