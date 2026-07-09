import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  LeaderboardResponse,
  ShareScoreResult,
  LeaderboardHistoryPoint,
  LeaderboardReview,
  LeaderboardHolding,
} from '$shared';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getLeaderboard(): Observable<LeaderboardResponse> {
    return this.http.get<LeaderboardResponse>(`${this.base}/leaderboard`);
  }

  shareScore(label?: string): Observable<ShareScoreResult> {
    return this.http.post<ShareScoreResult>(`${this.base}/leaderboard/share`, { label });
  }

  getHistory(userId: string): Observable<{ points: LeaderboardHistoryPoint[] }> {
    return this.http.get<{ points: LeaderboardHistoryPoint[] }>(
      `${this.base}/leaderboard/${userId}/history`,
    );
  }

  getReviews(userId: string): Observable<LeaderboardReview[]> {
    return this.http.get<LeaderboardReview[]>(`${this.base}/leaderboard/${userId}/reviews`);
  }

  addReview(userId: string, body: string): Observable<LeaderboardReview> {
    return this.http.post<LeaderboardReview>(`${this.base}/leaderboard/${userId}/reviews`, { body });
  }

  getHoldings(userId: string): Observable<LeaderboardHolding[]> {
    return this.http.get<LeaderboardHolding[]>(`${this.base}/leaderboard/${userId}/holdings`);
  }
}
