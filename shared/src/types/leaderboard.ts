export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  label: string;
  avatarDataUrl: string | null;
  score: number;
  gain: number;
  sharedAt: string;
  isMe: boolean;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
}

export interface ShareScoreResult {
  message: string;
  entry: LeaderboardEntry;
}

export interface LeaderboardHistoryPoint {
  score: number;
  sharedAt: string;
}

export interface LeaderboardReview {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface LeaderboardHolding {
  ticker: string;
  quantity: number;
}
