export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Artist {
  id: string;
  name: string;
}

export interface Album {
  id: string;
  title: string;
  artist_id: string | null;
  artwork_path: string | null;
}

export interface Track {
  id: string;
  title: string;
  artist_id: string | null;
  album_id: string | null;
  duration_ms: number;
  genre: string | null;
  language: string | null;
  artwork_path: string | null;
  audio_path: string;
  rights_note: string | null;
  created_at: string;
}

export interface Playlist {
  id: string;
  owner_id: string;
  title: string;
  is_public: boolean;
  created_at: string;
}

export interface PlaylistTrack {
  playlist_id: string;
  track_id: string;
  position: number;
}

export interface Favorite {
  user_id: string;
  track_id: string;
  created_at: string;
}

export interface PlayHistory {
  id: string;
  user_id: string;
  track_id: string;
  played_at: string;
  position_ms: number;
}

export interface Room {
  id: string;
  leader_id: string;
  track_id: string | null;
  status: "playing" | "paused" | "idle";
  position_ms: number;
  updated_at: string;
  sequence_number: number;
}

export interface RoomMember {
  room_id: string;
  user_id: string;
  joined_at: string;
  last_seen_at: string | null;
  profile?: Profile | null;
}

export interface TrackWithRelations extends Track {
  artist?: Artist | null;
  album?: Album | null;
}

export interface PlaybackState {
  currentTrack: TrackWithRelations | null;
  queue: TrackWithRelations[];
  queueIndex: number;
  positionMs: number;
  durationMs: number;
  isPlaying: boolean;
  repeat: "off" | "all" | "one";
  shuffle: boolean;
  source: "solo" | "room";
  roomId: string | null;
}