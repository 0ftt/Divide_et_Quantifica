import { Request, Response } from 'express';
import { z } from 'zod';
import type {
  LeaderboardEntry,
  LeaderboardHistoryPoint,
  LeaderboardHolding,
  LeaderboardResponse,
  LeaderboardReview,
  ShareScoreResult,
} from '$shared';
import { query, queryOne } from '../db/pool';
import { AppError } from '../middleware/error';

interface LeaderboardRow {
  user_id: string;
  display_name: string;
  label: string;
  score: string;
  shared_at: string;
}

interface LeaderboardGainRow extends LeaderboardRow {
  invested: string | null;
  cost_basis: string | null;
  avatar_data_url: string | null;
}

const LEADERBOARD_LIMIT = 50;
const shareSchema = z.object({ label: z.string().trim().max(40).optional() });

export async function listLeaderboard(req: Request, res: Response): Promise<void> {
  const userId = req.user!.sub;

  const rows = await query<LeaderboardGainRow>(
    `select le.user_id, le.display_name, le.label, le.score, le.shared_at,
            u.avatar_data_url,
            coalesce((select sum(h.quantity * a.last_price)
                        from holdings h
                        join assets a on a.ticker = h.ticker
                       where h.user_id = le.user_id), 0) as invested,
            coalesce((select sum(h.quantity * h.avg_price)
                        from holdings h
                       where h.user_id = le.user_id), 0) as cost_basis
       from leaderboard_entries le
       join users u on u.id = le.user_id`,
  );

  const entries: LeaderboardEntry[] = rows
    .map((r) => {
      const gain = +(Number(r.invested ?? 0) - Number(r.cost_basis ?? 0)).toFixed(2);
      return {
        rank: 0,
        userId: r.user_id,
        displayName: r.display_name,
        label: r.label,
        avatarDataUrl: r.avatar_data_url,
        score: Number(r.score),
        gain,
        sharedAt: r.shared_at,
        isMe: r.user_id === userId,
      };
    })
    .sort((a, b) => b.gain - a.gain)
    .slice(0, LEADERBOARD_LIMIT)
    .map((e, index) => ({ ...e, rank: index + 1 }));

  const payload: LeaderboardResponse = { entries };
  res.json(payload);
}

export async function shareScore(req: Request, res: Response): Promise<void> {
  const userId = req.user!.sub;
  const { label } = shareSchema.parse(req.body ?? {});

  const user = await queryOne<{ display_name: string; credit: string; avatar_data_url: string | null }>(
    'select display_name, credit, avatar_data_url from users where id = $1',
    [userId],
  );
  if (!user) {
    throw new AppError(404, 'Utente non trovato.');
  }

  const investedRow = await queryOne<{ invested: string | null; cost_basis: string | null }>(
    `select sum(h.quantity * a.last_price) as invested,
            sum(h.quantity * h.avg_price) as cost_basis
       from holdings h
       join assets a on a.ticker = h.ticker
      where h.user_id = $1`,
    [userId],
  );
  const invested = Number(investedRow?.invested ?? 0);
  const costBasis = Number(investedRow?.cost_basis ?? 0);
  const gain = +(invested - costBasis).toFixed(2);
  const score = +(Number(user.credit) + invested).toFixed(2);
  const displayName = user.display_name || 'Trader anonimo';
  const entryLabel = (label && label.trim()) || 'Principale';

  const rows = await query<LeaderboardRow>(
    `insert into leaderboard_entries (user_id, display_name, label, score, shared_at)
     values ($1, $2, $3, $4, now())
     on conflict (user_id, label) do nothing
     returning user_id, display_name, label, score, shared_at`,
    [userId, displayName, entryLabel, score],
  );
  if (!rows.length) {
    throw new AppError(409, `Hai già condiviso una scheda chiamata "${entryLabel}". Rescindila prima di ricondividerla.`);
  }
  const saved = rows[0];

  await query('insert into leaderboard_history (user_id, score, shared_at) values ($1, $2, now())', [
    userId,
    saved.score,
  ]);

  const rankRow = await queryOne<{ rank: string }>(
    `select count(*) + 1 as rank from leaderboard_entries where score > $1`,
    [saved.score],
  );

  const payload: ShareScoreResult = {
    message: 'Scheda condivisa in classifica.',
    entry: {
      rank: Number(rankRow?.rank ?? 1),
      userId: saved.user_id,
      displayName: saved.display_name,
      label: saved.label,
      avatarDataUrl: user.avatar_data_url,
      score: Number(saved.score),
      gain,
      sharedAt: saved.shared_at,
      isMe: true,
    },
  };
  res.json(payload);
}

const unshareSchema = z.object({ label: z.string().max(40) });

export async function unshareScore(req: Request, res: Response): Promise<void> {
  const userId = req.user!.sub;
  const { label } = unshareSchema.parse(req.body ?? {});
  await query('delete from leaderboard_entries where user_id = $1 and label = $2', [userId, label]);
  res.json({ ok: true });
}

export async function getHistory(req: Request, res: Response): Promise<void> {
  const userId = req.params.userId;
  const rows = await query<{ score: string; shared_at: string }>(
    `select score, shared_at from leaderboard_history where user_id = $1 order by shared_at asc`,
    [userId],
  );
  const points: LeaderboardHistoryPoint[] = rows.map((r) => ({
    score: Number(r.score),
    sharedAt: r.shared_at,
  }));
  res.json({ points });
}

interface ReviewRow {
  id: string;
  author_id: string;
  author_name: string;
  body: string;
  created_at: string;
}

export async function listReviews(req: Request, res: Response): Promise<void> {
  const entryUserId = req.params.userId;
  const rows = await query<ReviewRow>(
    `select r.id, r.author_id, u.display_name as author_name, r.body, r.created_at
       from leaderboard_reviews r
       join users u on u.id = r.author_id
      where r.entry_user_id = $1
      order by r.created_at desc`,
    [entryUserId],
  );
  const payload: LeaderboardReview[] = rows.map((r) => ({
    id: r.id,
    authorId: r.author_id,
    authorName: r.author_name,
    body: r.body,
    createdAt: r.created_at,
  }));
  res.json(payload);
}

const reviewSchema = z.object({ body: z.string().trim().min(1).max(500) });

export async function addReview(req: Request, res: Response): Promise<void> {
  const entryUserId = req.params.userId;
  const authorId = req.user!.sub;
  const { body } = reviewSchema.parse(req.body);

  const entry = await queryOne<{ user_id: string }>(
    'select user_id from leaderboard_entries where user_id = $1',
    [entryUserId],
  );
  if (!entry) {
    throw new AppError(404, 'Entry di classifica non trovata.');
  }

  const rows = await query<ReviewRow>(
    `insert into leaderboard_reviews (entry_user_id, author_id, body)
     values ($1, $2, $3)
     returning id, author_id, (select display_name from users where id = $2) as author_name, body, created_at`,
    [entryUserId, authorId, body],
  );
  const saved = rows[0];

  const payload: LeaderboardReview = {
    id: saved.id,
    authorId: saved.author_id,
    authorName: saved.author_name,
    body: saved.body,
    createdAt: saved.created_at,
  };
  res.status(201).json(payload);
}

interface HoldingRow {
  ticker: string;
  quantity: string;
}

export async function getHoldings(req: Request, res: Response): Promise<void> {
  const entryUserId = req.params.userId;
  const rows = await query<HoldingRow>(
    'select ticker, quantity from holdings where user_id = $1 and quantity > 0',
    [entryUserId],
  );
  const payload: LeaderboardHolding[] = rows.map((r) => ({
    ticker: r.ticker,
    quantity: Number(r.quantity),
  }));
  res.json(payload);
}
