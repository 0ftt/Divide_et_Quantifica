import { Request, Response } from 'express';
import { z } from 'zod';
import type { Holding, PortfolioResponse, OrderResult } from '$shared';
import { query, queryOne } from '../db/pool';
import { AppError } from '../middleware/error';

interface HoldingRow {
  ticker: string;
  name: string;
  quantity: string;
  avg_price: string;
  last_price: string;
}

const orderSchema = z.object({
  ticker: z.string().trim().min(1),
  quantity: z.number().positive(),
});

export async function getPortfolio(req: Request, res: Response): Promise<void> {
  const userId = req.user!.sub;

  const rows = await query<HoldingRow>(
    `select h.ticker, a.name, h.quantity, h.avg_price, a.last_price
       from holdings h
       join assets a on a.ticker = h.ticker
      where h.user_id = $1
      order by h.ticker asc`,
    [userId],
  );

  const holdings: Holding[] = rows.map((r) => {
    const quantity = Number(r.quantity);
    const lastPrice = Number(r.last_price);
    return {
      ticker: r.ticker,
      name: r.name,
      quantity,
      avgPrice: Number(r.avg_price),
      lastPrice,
      value: +(quantity * lastPrice).toFixed(2),
    };
  });

  const creditRow = await queryOne<{ credit: string }>('select credit from users where id = $1', [
    userId,
  ]);
  const invested = holdings.reduce((sum, h) => sum + h.value, 0);

  const payload: PortfolioResponse = {
    credit: Number(creditRow?.credit ?? 0),
    investedValue: +invested.toFixed(2),
    holdings,
  };
  res.json(payload);
}

export async function buy(req: Request, res: Response): Promise<void> {
  const { ticker, quantity } = orderSchema.parse(req.body);
  const userId = req.user!.sub;
  const symbol = ticker.toUpperCase();

  const asset = await queryOne<{ last_price: string }>(
    'select last_price from assets where ticker = $1',
    [symbol],
  );
  if (!asset) {
    throw new AppError(404, 'Asset non presente nel listino.');
  }

  const price = Number(asset.last_price);
  const cost = +(price * quantity).toFixed(2);

  const user = await queryOne<{ credit: string }>('select credit from users where id = $1', [
    userId,
  ]);
  if (!user || Number(user.credit) < cost) {
    throw new AppError(402, 'Credito insufficiente per l\'acquisto.');
  }

  await query('update users set credit = credit - $1 where id = $2', [cost, userId]);

  const existing = await queryOne<{ quantity: string; avg_price: string }>(
    'select quantity, avg_price from holdings where user_id = $1 and ticker = $2',
    [userId, symbol],
  );

  if (existing) {
    const oldQty = Number(existing.quantity);
    const oldAvg = Number(existing.avg_price);
    const newQty = oldQty + quantity;
    const newAvg = +((oldQty * oldAvg + quantity * price) / newQty).toFixed(4);
    await query(
      'update holdings set quantity = $1, avg_price = $2 where user_id = $3 and ticker = $4',
      [newQty, newAvg, userId, symbol],
    );
  } else {
    await query(
      'insert into holdings (user_id, ticker, quantity, avg_price) values ($1, $2, $3, $4)',
      [userId, symbol, quantity, price],
    );
  }

  await query(
    `insert into transactions (user_id, type, ticker, quantity, amount, note)
     values ($1, 'buy', $2, $3, $4, $5)`,
    [userId, symbol, quantity, cost, `Acquisto ${quantity} ${symbol}`],
  );

  const payload: OrderResult = { message: `Acquistate ${quantity} unita di ${symbol}.`, cost };
  res.json(payload);
}

export async function sell(req: Request, res: Response): Promise<void> {
  const { ticker, quantity } = orderSchema.parse(req.body);
  const userId = req.user!.sub;
  const symbol = ticker.toUpperCase();

  const holding = await queryOne<{ quantity: string }>(
    'select quantity from holdings where user_id = $1 and ticker = $2',
    [userId, symbol],
  );
  if (!holding || Number(holding.quantity) < quantity) {
    throw new AppError(400, 'Quantita in portafoglio insufficiente.');
  }

  const asset = await queryOne<{ last_price: string }>(
    'select last_price from assets where ticker = $1',
    [symbol],
  );
  const price = Number(asset?.last_price ?? 0);
  const proceeds = +(price * quantity).toFixed(2);
  const remaining = Number(holding.quantity) - quantity;

  if (remaining > 0) {
    await query('update holdings set quantity = $1 where user_id = $2 and ticker = $3', [
      remaining,
      userId,
      symbol,
    ]);
  } else {
    await query('delete from holdings where user_id = $1 and ticker = $2', [userId, symbol]);
  }

  await query('update users set credit = credit + $1 where id = $2', [proceeds, userId]);

  await query(
    `insert into transactions (user_id, type, ticker, quantity, amount, note)
     values ($1, 'sell', $2, $3, $4, $5)`,
    [userId, symbol, quantity, proceeds, `Vendita ${quantity} ${symbol}`],
  );

  const payload: OrderResult = { message: `Vendute ${quantity} unita di ${symbol}.`, proceeds };
  res.json(payload);
}
