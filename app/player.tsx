import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Easing,
  FlatList,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "./providers/ThemeProvider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { TrackWithRelations } from "../lib/types";
import { formatDuration, clamp } from "../lib/utils";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";

type PlayerParams = {
  trackId?: string;
  queue?: string;
  index?: string;
  source?: "solo" | "room";
  roomId?: string;
};

export default function PlayerScreen() {
  const t = useTheme();
  const params = useLocalSearchParams<PlayerParams>();
  const trackId = params.trackId;
  const initialQueue = params.queue ? JSON.parse(params.queue) : undefined;
  const initialIndex = params.index ? parseInt(params.index, 10) : 0;
  const source = (params.source as "solo" | "room") || "solo";
  const roomId = params.roomId;

  const [currentTrack, setCurrentTrack] = useState<TrackWithRelations | null>(null);
  const [queue, setQueue] = useState<TrackWithRelations[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");
  const [shuffle, setShuffle] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showQueue, setShowQueue] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const player = useAudioPlayer(currentTrack?.audio_path ?? null, {
    updateInterval: 200,
    downloadFirst: true,
  });
  const status = useAudioPlayerStatus(player);

  const { data: trackData } = useQuery({
    queryKey: ["track", trackId],
    queryFn: async () => {
      if (!trackId) return null;
      const { data } = await supabase
        .from("tracks")
        .select("*, artists(*), albums(*)")
        .eq("id", trackId)
        .single();
      return data as TrackWithRelations;
    },
    enabled: !!trackId,
  });

  const { data: queueData } = useQuery({
    queryKey: ["queue", initialQueue?.join(",")],
    queryFn: async () => {
      if (!initialQueue?.length) return [];
      const { data } = await supabase
        .from("tracks")
        .select("*, artists(*), albums(*)")
        .in("id", initialQueue);
      const sorted = initialQueue.map((id: string) => data?.find((tr: any) => tr.id === id)).filter(Boolean);
      return sorted as TrackWithRelations[];
    },
    enabled: !!initialQueue?.length,
  });

  useEffect(() => {
    if (trackData) {
      setCurrentTrack(trackData);
      if (!queue.length && !initialQueue?.length) {
        setQueue([trackData]);
        setQueueIndex(0);
      }
    }
  }, [trackData]);

  useEffect(() => {
    if (queueData && queueData.length) {
      setQueue(queueData);
      setQueueIndex(initialIndex);
    }
  }, [queueData]);

  const isPlaying = status.playing;
  const position = status.currentTime * 1000;
  const duration = status.duration * 1000;

  const loadTrack = useCallback(async (track: TrackWithRelations, autoPlay = true) => {
    try {
      await player.replace(track.audio_path);
      setCurrentTrack(track);
      if (autoPlay) {
        await player.play();
      }
    } catch (e) {
      console.error("Failed to load track:", e);
    }
  }, [player]);

  const handleNext = useCallback(() => {
    if (repeatMode === "one") {
      player.seekTo(0);
      player.play();
      return;
    }
    const nextIndex = queueIndex + 1;
    if (nextIndex < queue.length) {
      setQueueIndex(nextIndex);
      loadTrack(queue[nextIndex]);
    } else if (repeatMode === "all") {
      setQueueIndex(0);
      loadTrack(queue[0]);
    } else {
      player.pause();
    }
  }, [queue, queueIndex, repeatMode, loadTrack, player]);

  const handlePrevious = useCallback(() => {
    if (position > 3000) {
      player.seekTo(0);
    } else if (queueIndex > 0) {
      const prevIndex = queueIndex - 1;
      setQueueIndex(prevIndex);
      loadTrack(queue[prevIndex]);
    }
  }, [position, queueIndex, queue, loadTrack, player]);

  const handleSeek = useCallback(async (value: number) => {
    await player.seekTo(value / 1000);
  }, [player]);

  const handleProgressPan = useCallback((gestureState: { dx: number; moveX: number }) => {
    const width = 300;
    const clamped = clamp(gestureState.moveX, 0, width);
    setDragX(clamped);
    const newPosition = (clamped / width) * duration;
    setDragX(clamped);
  }, [duration]);

  const handleProgressStart = useCallback(() => setIsDragging(true), []);
  const handleProgressEnd = useCallback(() => {
    setIsDragging(false);
    const newPosition = (dragX / 300) * duration;
    handleSeek(newPosition);
    setDragX(0);
  }, [dragX, duration, handleSeek]);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => (prev === "off" ? "all" : prev === "all" ? "one" : "off"));
  }, []);

  const toggleShuffle = useCallback(() => setShuffle((prev) => !prev), []);

  const closePlayer = useCallback(() => {
    if (source === "room" && roomId) {
      router.push(`/room/${roomId}`);
    } else {
      router.back();
    }
  }, [source, roomId]);

  const artworkScale = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (duration > 0) {
      progressAnim.setValue(position / duration);
    }
  }, [position, duration]);

  const animateArtwork = useCallback((playing: boolean) => {
    Animated.timing(artworkScale, {
      toValue: playing ? 1.08 : 1,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    animateArtwork(isPlaying);
  }, [isPlaying, animateArtwork]);

  if (!currentTrack) {
    return (
      <View style={[styles.container, { backgroundColor: t.background }]}>
        <View style={styles.loading}>
          <Text style={[styles.loadingText, { color: t.textMuted }]}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <TouchableOpacity style={styles.dragHandle} onPress={closePlayer} activeOpacity={0.5}>
        <View style={[styles.dragBar, { backgroundColor: t.border }]} />
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.artworkContainer,
          {
            transform: [{ scale: artworkScale }],
          },
        ]}
      >
        {currentTrack.artwork_path ? (
          <Image source={{ uri: currentTrack.artwork_path }} style={styles.artwork} resizeMode="cover" />
        ) : (
          <View style={[styles.artwork, { backgroundColor: t.surfaceElevated, justifyContent: "center", alignItems: "center" }]}>
            <Ionicons name="musical-notes" size={80} color={t.textMuted} />
          </View>
        )}
        <Animated.View
          style={[
            styles.artworkGlow,
            {
              opacity: isPlaying ? 1 : 0,
              transform: [{ scale: artworkScale }],
            },
          ]}
        />
      </Animated.View>

      <View style={styles.trackInfo}>
        <Text style={[styles.trackTitle, { color: t.text }]}>{currentTrack.title}</Text>
        <Text style={[styles.trackArtist, { color: t.textSecondary }]}>{currentTrack.artist?.name || "Unknown Artist"}</Text>
        {currentTrack.album?.title && (
          <Text style={[styles.trackAlbum, { color: t.textMuted }]}>{currentTrack.album.title}</Text>
        )}
      </View>

      <View style={styles.progressContainer}>
        <Text style={[styles.timeText, { color: t.textMuted }]}>{formatDuration(position)}</Text>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: t.primary, width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) },
            ]}
          />
        </View>
        <Text style={[styles.timeText, { color: t.textMuted }]}>{formatDuration(duration)}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={toggleShuffle} activeOpacity={0.7}>
          <Ionicons name={shuffle ? "shuffle" : "shuffle-outline"} size={24} color={shuffle ? t.primary : t.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={handlePrevious} activeOpacity={0.7}>
          <Ionicons name="caret-back-circle" size={36} color={t.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.playBtn} onPress={() => (isPlaying ? player.pause() : player.play())} activeOpacity={0.7}>
          <Animated.View
            style={[
              styles.playBtnInner,
              { backgroundColor: t.primary },
              { transform: [{ scale: isPlaying ? 0.95 : 1 }] },
            ]}
          >
            <Ionicons name={isPlaying ? "pause" : "play"} size={32} color={t.background} />
          </Animated.View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={handleNext} activeOpacity={0.7}>
          <Ionicons name="caret-forward-circle" size={36} color={t.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={toggleRepeat} activeOpacity={0.7}>
          <Ionicons
            name={repeatMode === "off" ? "repeat-outline" : repeatMode === "all" ? "repeat" : "repeat"}
            size={24}
            color={repeatMode === "off" ? t.textMuted : t.primary}
          />
          {repeatMode === "one" && <Text style={styles.repeatOne}>1</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.bottomBtn} onPress={() => setShowQueue(!showQueue)} activeOpacity={0.7}>
          <Ionicons name="menu" size={24} color={t.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomBtn} activeOpacity={0.7}>
          <Ionicons name="heart-outline" size={24} color={t.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomBtn} activeOpacity={0.7}>
          <Ionicons name="share-social-outline" size={24} color={t.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomBtn} activeOpacity={0.7}>
          <Ionicons name="ellipsis-horizontal" size={24} color={t.text} />
        </TouchableOpacity>
      </View>

      {showQueue && (
        <View style={styles.queueOverlay}>
          <View style={styles.queueContainer}>
            <View style={styles.queueHeader}>
              <Text style={[styles.queueTitle, { color: t.text }]}>Up Next ({queue.length})</Text>
              <TouchableOpacity onPress={() => setShowQueue(false)}>
                <Ionicons name="close" size={24} color={t.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={queue}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.queueItem,
                    index === queueIndex && styles.queueItemPlaying,
                    { borderColor: t.border },
                  ]}
                  onPress={() => {
                    setQueueIndex(index);
                    loadTrack(item);
                    setShowQueue(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.queueNumber, { backgroundColor: index === queueIndex ? t.primary : "transparent" }]}>
                    {index === queueIndex ? (
                      <Ionicons name="musical-notes" size={14} color={t.background} />
                    ) : (
                      <Text style={[styles.queueNumberText, { color: t.textMuted }]}>{index + 1}</Text>
                    )}
                  </View>
                  <View style={[styles.queueArtwork, { backgroundColor: t.surfaceElevated }]}>
                    {item.artwork_path ? (
                      <Image source={{ uri: item.artwork_path }} style={styles.queueArtworkImage} resizeMode="cover" />
                    ) : (
                      <Ionicons name="musical-notes" size={18} color={t.textMuted} />
                    )}
                  </View>
                  <View style={[styles.queueInfo, { flex: 1 }]}>
                    <Text style={[styles.queueTitleText, { color: index === queueIndex ? t.primary : t.text }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.queueArtist, { color: t.textMuted }]} numberOfLines={1}>
                      {item.artist?.name || "Unknown Artist"}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={[styles.queueSeparator, { backgroundColor: t.border }]} />}
              contentContainerStyle={styles.queueContent}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 20 },
  dragHandle: { alignItems: "center", paddingVertical: 12 },
  dragBar: { width: 40, height: 4, borderRadius: 2 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { fontSize: 16 },
  artworkContainer: { alignItems: "center", marginTop: 20, marginBottom: 32 },
  artwork: { width: 300, height: 300, borderRadius: 16, overflow: "hidden" },
  artworkGlow: {
    ...StyleSheet.absoluteFill,
    borderRadius: 16,
    backgroundColor: "#D4A853",
    opacity: 0.3,
  },
  trackInfo: { alignItems: "center", paddingHorizontal: 24, marginBottom: 32 },
  trackTitle: { fontSize: 28, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  trackArtist: { fontSize: 16, textAlign: "center" },
  trackAlbum: { fontSize: 14, textAlign: "center", marginTop: 4 },
  progressContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 24, gap: 12, marginBottom: 32 },
  timeText: { fontSize: 13, fontVariant: ["tabular-nums"], minWidth: 45 },
  progressBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.1)", position: "relative" },
  progressFill: { position: "absolute", top: 0, left: 0, bottom: 0, borderRadius: 2 },
  progressThumb: { position: "absolute", top: -8, width: 20, height: 20, justifyContent: "center", alignItems: "center" },
  thumb: { width: 16, height: 16, borderRadius: 8 },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 32, marginBottom: 32 },
  controlBtn: { padding: 8 },
  playBtn: { padding: 4 },
  playBtnInner: { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center", shadowColor: "#D4A853", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  repeatOne: { position: "absolute", bottom: -18, right: -8, fontSize: 10, fontWeight: "700", color: "#D4A853" },
  bottomControls: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 40, marginBottom: 20 },
  bottomBtn: { padding: 8 },
  queueOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(14,14,18,0.95)", zIndex: 100 },
  queueContainer: { flex: 1, backgroundColor: "#1A1A22", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 20 },
  queueHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" },
  queueTitle: { fontSize: 18, fontWeight: "700" },
  queueContent: { paddingBottom: 40 },
  queueItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
  queueItemPlaying: { backgroundColor: "rgba(212,168,83,0.1)" },
  queueNumber: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  queueNumberText: { fontSize: 12, fontWeight: "600" },
  queueArtwork: { width: 48, height: 48, borderRadius: 6, overflow: "hidden" },
  queueArtworkImage: { width: "100%", height: "100%" },
  queueInfo: { minWidth: 0 },
  queueTitleText: { fontSize: 15, fontWeight: "600" },
  queueArtist: { fontSize: 13, marginTop: 2 },
  queueSeparator: { height: 1, marginLeft: 60 },
});