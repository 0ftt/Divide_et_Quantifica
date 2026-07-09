import { Request, Response } from 'express';
import { query, queryOne } from '../db/pool';
import { env } from '../config/env';
import { AppError } from '../middleware/error';
import { recordRevenue } from './app.controller';

export async function purchasePremium(req: Request, res: Response): Promise<void> {
  const userId = req.user!.sub;
  const price = env.premiumPrice;

  const user = await queryOne<{ credit: string; is_premium: boolean }>(
    'select credit, is_premium from users where id = $1',
    [userId],
  );
  if (!user) {
    throw new AppError(404, 'Utente non trovato.');
  }
  if (user.is_premium) {
    throw new AppError(409, 'Licenza Premium gia attiva.');
  }
  if (Number(user.credit) < price) {
    throw new AppError(402, `Credito insufficiente: servono ${price} €.`);
  }

  const rows = await query<{ credit: string }>(
    'update users set credit = credit - $1, is_premium = true where id = $2 returning credit',
    [price, userId],
  );

  await query(
    `insert into transactions (user_id, type, amount, note)
     values ($1, 'premium', $2, $3)`,
    [userId, price, 'Acquisto licenza Premium'],
  );

  await recordRevenue('premium', price);

  res.json({
    message: 'Licenza Premium attivata.',
    credit: Number(rows[0].credit),
    isPremium: true,
  });
}
