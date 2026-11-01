import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from "react-native";
import { Link, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../providers/ThemeProvider";
import { useAuth } from "../providers/SupabaseProvider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { Room, RoomMember, TrackWithRelations, Profile } from "../../lib/types";
import { formatDuration } from "../../lib/utils";

const SURFACE = "#1A1A22";
const BORDER = "rgba(255,255,255,0.08)";
const BACKGROUND = "#0E0E12";
const PRIMARY = "#D4A853";
const TEXT = "#F5F0E8";
const TEXT_SECONDARY = "#A8A0B8";
const TEXT_MUTED = "#6B6580";
const ERROR = "#E0646E";

export default function RoomScreen() {
  const t = useTheme();
  const { session } = useAuth();
  const params = useLocalSearchParams<{ id: string }>();
  const roomId = params.id;

  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<(RoomMember & { profile?: Profile | null })[]>([]);
  const [currentTrack, setCurrentTrack] = useState<TrackWithRelations | null>(null);
  const [isLeader, setIsLeader] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  const { data: roomData } = useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => {
      const { data } = await supabase.from("rooms").select("*").eq("id", roomId).single();
      return data as Room;
    },
    enabled: !!roomId,
  });

  const { data: membersData } = useQuery({
    queryKey: ["room-members", roomId],
    queryFn: async () => {
      const { data } = await supabase
        .from("room_members")
        .select("*, profiles(*)")
        .eq("room_id", roomId);
      return data as (RoomMember & { profiles?: Profile })[];
    },
    enabled: !!roomId,
  });

  const { data: trackData } = useQuery({
    queryKey: ["room-track", room?.track_id],
    queryFn: async () => {
      if (!room?.track_id) return null;
      const { data } = await supabase
        .from("tracks")
        .select("*, artists(*), albums(*)")
        .eq("id", room.track_id)
        .single();
      return data as TrackWithRelations;
    },
    enabled: !!room?.track_id,
  });

  useEffect(() => {
    if (roomData) {
      setRoom(roomData);
      setIsLeader(roomData.leader_id === session?.user?.id);
    }
  }, [roomData, session?.user?.id]);

  useEffect(() => {
    if (membersData) {
      setMembers(
        membersData.map((m) => ({
          room_id: m.room_id,
          user_id: m.user_id,
          joined_at: m.joined_at,
          last_seen_at: m.last_seen_at,
          profile: m.profiles || null,
        }))
      );
    }
  }, [membersData]);

  useEffect(() => {
    if (trackData) {
      setCurrentTrack(trackData);
    }
  }, [trackData]);

  const handleJoin = async () => {
    if (!session?.user || !roomId) return;
    await supabase.from("room_members").upsert({
      room_id: roomId,
      user_id: session.user.id,
      joined_at: new Date().toISOString(),
    });
  };

  const handleLeave = async () => {
    if (!session?.user || !roomId) return;
    await supabase.from("room_members").delete().eq("room_id", roomId).eq("user_id", session.user.id);
    router.back();
  };

  const handlePlayPause = async () => {
    if (!room || !isLeader) return;
    await supabase
      .from("rooms")
      .update({
        status: room.status === "playing" ? "paused" : "playing",
        updated_at: new Date().toISOString(),
        sequence_number: room.sequence_number + 1,
      })
      .eq("id", roomId);
  };

  if (!room) {
    return (
      <View style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading room...</Text>
        </View>
      </View>
    );
  }

  const isMember = members.some((m) => m.user_id === session?.user?.id);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={t.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.roomTitle}>{room.status === "playing" ? "🎵 Now Playing" : room.status === "paused" ? "⏸ Paused" : "🎧 Listening Room"}</Text>
          <Text style={styles.roomSubtitle}>{members.length} listener{members.length !== 1 ? "s" : ""}</Text>
        </View>
        <TouchableOpacity onPress={() => setShowMembers(!showMembers)} style={styles.membersBtn}>
          <Ionicons name="people-outline" size={26} color={t.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {currentTrack && (
          <View style={styles.nowPlaying}>
            <View style={styles.npArtwork}>
              {currentTrack.artwork_path ? (
                <Image source={{ uri: currentTrack.artwork_path }} style={styles.npArtworkImage} resizeMode="cover" />
              ) : (
                <Ionicons name="musical-notes" size={48} color={t.textMuted} />
              )}
            </View>
            <View style={styles.npInfo}>
              <Text style={styles.npLabel}>NOW PLAYING</Text>
              <Text style={styles.npTitle} numberOfLines={1}>{currentTrack.title}</Text>
              <Text style={styles.npArtist} numberOfLines={1}>
                {currentTrack.artist?.name || "Unknown Artist"}
              </Text>
              <View style={styles.npProgress}>
                <Text style={styles.npTime}>{formatDuration(room.position_ms)}</Text>
                <View style={styles.npBar}>
                  <View
                    style={[
                      styles.npFill,
                      { backgroundColor: t.primary, width: `${(room.position_ms / (currentTrack.duration_ms || 1)) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.npTime}>{formatDuration(currentTrack.duration_ms)}</Text>
              </View>
            </View>
          </View>
        )}

        {isLeader && (
          <View style={styles.leaderControls}>
            <TouchableOpacity
              style={[
                styles.leaderBtn,
                { backgroundColor: room.status === "playing" ? SURFACE : PRIMARY },
              ]}
              onPress={handlePlayPause}
            >
              <Ionicons
                name={room.status === "playing" ? "pause" : "play"}
                size={24}
                color={room.status === "playing" ? t.text : BACKGROUND}
              />
              <Text
                style={[
                  styles.leaderBtnText,
                  { color: room.status === "playing" ? t.text : BACKGROUND },
                ]}
              >
                {room.status === "playing" ? "Pause" : "Play"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.leaderBtn} onPress={() => {}}>
              <Ionicons name="play-skip-forward" size={24} color={t.text} />
              <Text style={styles.leaderBtnText}>Next</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isMember && (
          <TouchableOpacity style={styles.joinBtn} onPress={handleJoin}>
            <Text style={styles.joinBtnText}>Join Room</Text>
          </TouchableOpacity>
        )}

        <View style={styles.memberListHeader}>
          <Text style={styles.sectionTitle}>Listeners</Text>
          <TouchableOpacity onPress={() => setShowMembers(!showMembers)}>
            <Text style={styles.seeAll}>{showMembers ? "Show less" : "Show all"}</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={showMembers ? members : members.slice(0, 5)}
          keyExtractor={(item) => item.user_id}
          renderItem={({ item }) => (
            <View style={styles.memberItem}>
              <View style={styles.memberAvatar}>
                {item.profile?.avatar_url ? (
                  <Image source={{ uri: item.profile.avatar_url }} style={styles.memberAvatarImage} />
                ) : (
                  <Text style={styles.memberInitials}>
                    {item.profile?.display_name?.charAt(0).toUpperCase() || "U"}
                  </Text>
                )}
                {item.user_id === room.leader_id && (
                  <View style={styles.leaderBadge}>
                    <Ionicons name="star" size={10} color={t.primary} />
                  </View>
                )}
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{item.profile?.display_name || "Anonymous"}</Text>
                {item.user_id === session?.user?.id && <Text style={styles.memberYou}>You</Text>}
              </View>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.memberListContent}
        />

        {isMember && (
          <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
            <Ionicons name="log-out-outline" size={20} color={ERROR} style={styles.leaveIcon} />
            <Text style={styles.leaveText}>Leave Room</Text>
          </TouchableOpacity>
        )}
      </View>

      {showMembers && (
        <View style={styles.membersModal}>
          <View style={styles.membersModalContent}>
            <View style={styles.membersModalHeader}>
              <Text style={styles.membersModalTitle}>All Listeners ({members.length})</Text>
              <TouchableOpacity onPress={() => setShowMembers(false)}>
                <Ionicons name="close" size={24} color={t.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={members}
              keyExtractor={(item) => item.user_id}
              renderItem={({ item }) => (
                <View style={styles.memberItem}>
                  <View style={styles.memberAvatar}>
                    {item.profile?.avatar_url ? (
                      <Image source={{ uri: item.profile.avatar_url }} style={styles.memberAvatarImage} />
                    ) : (
                      <Text style={styles.memberInitials}>
                        {item.profile?.display_name?.charAt(0).toUpperCase() || "U"}
                      </Text>
                    )}
                    {item.user_id === room.leader_id && (
                      <View style={styles.leaderBadge}>
                        <Ionicons name="star" size={10} color={t.primary} />
                      </View>
                    )}
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{item.profile?.display_name || "Anonymous"}</Text>
                    {item.user_id === session?.user?.id && <Text style={styles.memberYou}>You</Text>}
                  </View>
                </View>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              contentContainerStyle={styles.memberListContent}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { fontSize: 16, color: TEXT_MUTED },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, alignItems: "center" },
  roomTitle: { fontSize: 18, fontWeight: "700", color: TEXT },
  roomSubtitle: { fontSize: 13, marginTop: 2, color: TEXT_MUTED },
  membersBtn: { padding: 4 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  nowPlaying: { flexDirection: "row", alignItems: "center", gap: 16, padding: 16, backgroundColor: SURFACE, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: BORDER },
  npArtwork: { width: 72, height: 72, borderRadius: 12, overflow: "hidden", backgroundColor: "#25252F" },
  npArtworkImage: { width: "100%", height: "100%" },
  npInfo: { flex: 1, minWidth: 0 },
  npLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 1, marginBottom: 4, color: PRIMARY },
  npTitle: { fontSize: 16, fontWeight: "600", marginBottom: 2, color: TEXT },
  npArtist: { fontSize: 13, marginBottom: 12, color: TEXT_SECONDARY },
  npProgress: { flexDirection: "row", alignItems: "center", gap: 8 },
  npTime: { fontSize: 11, fontVariant: ["tabular-nums"], minWidth: 35, color: TEXT_MUTED },
  npBar: { flex: 1, height: 3, borderRadius: 1.5, backgroundColor: "rgba(255,255,255,0.1)" },
  npFill: { height: "100%", borderRadius: 1.5 },
  leaderControls: { flexDirection: "row", gap: 12, marginBottom: 24 },
  leaderBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, borderWidth: 1, borderColor: BORDER },
  leaderBtnText: { fontSize: 14, fontWeight: "600" },
  joinBtn: { alignSelf: "center", paddingHorizontal: 40, paddingVertical: 16, borderRadius: 24, marginBottom: 24, backgroundColor: PRIMARY },
  joinBtnText: { color: BACKGROUND, fontSize: 16, fontWeight: "700" },
  memberListHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: TEXT },
  seeAll: { fontSize: 14, fontWeight: "600", color: PRIMARY },
  memberItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12 },
  memberAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", position: "relative", overflow: "hidden", backgroundColor: "#25252F" },
  memberAvatarImage: { width: "100%", height: "100%", borderRadius: 22 },
  memberInitials: { fontSize: 16, fontWeight: "700", color: PRIMARY },
  leaderBadge: { position: "absolute", bottom: 0, right: 0, width: 16, height: 16, borderRadius: 8, backgroundColor: BACKGROUND, borderWidth: 2, borderColor: BACKGROUND, justifyContent: "center", alignItems: "center" },
  memberInfo: { flex: 1, minWidth: 0 },
  memberName: { fontSize: 15, fontWeight: "600", color: TEXT },
  memberYou: { fontSize: 12, fontWeight: "600", marginTop: 2, color: PRIMARY },
  separator: { height: 1, marginLeft: 56, backgroundColor: BORDER },
  memberListContent: { paddingBottom: 20 },
  leaveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1, marginTop: 16, borderColor: ERROR },
  leaveIcon: { marginRight: 4 },
  leaveText: { fontSize: 16, fontWeight: "600", color: ERROR },
  membersModal: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(14,14,18,0.9)", zIndex: 100, justifyContent: "flex-end" },
  membersModalContent: { backgroundColor: SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "80%" },
  membersModalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: BORDER },
  membersModalTitle: { fontSize: 18, fontWeight: "700", color: TEXT },
});