import { Request, Response } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../db/pool';
import { processMockCharge } from '../services/stripe-mock.service';

const rechargeSchema = z.object({
  amount: z.number().positive(),
});

export async function rechargeCredit(req: Request, res: Response): Promise<void> {
  const { amount } = rechargeSchema.parse(req.body);
  const userId = req.user!.sub;

  const charge = processMockCharge(amount);

  const rows = await query<{ credit: string }>(
    'update users set credit = credit + $1 where id = $2 returning credit',
    [amount, userId],
  );

  await query(
    `insert into transactions (user_id, type, amount, note)
     values ($1, 'recharge', $2, $3)`,
    [userId, amount, 'Ricarica simulata (Stripe mock)'],
  );

  res.json({ message: charge.message, credit: Number(rows[0].credit) });
}

export async function getBalance(req: Request, res: Response): Promise<void> {
  const row = await queryOne<{ credit: string }>('select credit from users where id = $1', [
    req.user!.sub,
  ]);
  res.json({ credit: Number(row?.credit ?? 0) });
}
