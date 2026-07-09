import { Request, Response } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../db/pool';

const TRADE_FEE_RATE = 0.01;

export async function recordRevenue(kind: 'premium' | 'fee', amount: number): Promise<void> {
  if (!(amount > 0)) {
    return;
  }
  await query('insert into app_revenue (kind, amount) values ($1, $2)', [kind, +amount.toFixed(2)]);
}

const feeSchema = z.object({ value: z.number().positive().max(100_000_000) });

export async function recordTradeFee(req: Request, res: Response): Promise<void> {
  const { value } = feeSchema.parse(req.body);
  const fee = +(value * TRADE_FEE_RATE).toFixed(2);
  await recordRevenue('fee', fee);
  res.json({ fee });
}

export async function getRevenue(_req: Request, res: Response): Promise<void> {
  const row = await queryOne<{ total: string; premium: string; fees: string }>(
    `select
       coalesce(sum(amount), 0) as total,
       coalesce(sum(amount) filter (where kind = 'premium'), 0) as premium,
       coalesce(sum(amount) filter (where kind = 'fee'), 0) as fees
     from app_revenue`,
  );
  res.json({
    total: Number(row?.total ?? 0),
    premium: Number(row?.premium ?? 0),
    fees: Number(row?.fees ?? 0),
  });
}
