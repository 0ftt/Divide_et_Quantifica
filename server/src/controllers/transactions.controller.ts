import { Request, Response } from 'express';
import { query } from '../db/pool';

interface TxRow {
  id: string;
  type: string;
  ticker: string | null;
  quantity: string | null;
  amount: string;
  note: string;
  created_at: string;
}

export async function listTransactions(req: Request, res: Response): Promise<void> {
  const rows = await query<TxRow>(
    `select id, type, ticker, quantity, amount, note, created_at
       from transactions
      where user_id = $1
      order by created_at desc
      limit 200`,
    [req.user!.sub],
  );

  res.json(
    rows.map((r) => ({
      id: r.id,
      type: r.type,
      ticker: r.ticker,
      quantity: r.quantity != null ? Number(r.quantity) : null,
      amount: Number(r.amount),
      note: r.note,
      createdAt: r.created_at,
    })),
  );
}
