import { Request, Response } from 'express';
import { z } from 'zod';
import type { User } from '$shared';
import { query, queryOne } from '../db/pool';
import { AppError } from '../middleware/error';

interface UserRow {
  id: string;
  email: string;
  display_name: string;
  username: string | null;
  phone: string | null;
  address: string;
  city: string;
  postal_code: string;
  role: 'user' | 'admin';
  credit: string;
  is_premium: boolean;
  avatar_data_url: string | null;
}

function toPublicMe(user: UserRow): User {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    username: user.username,
    phone: user.phone,
    address: user.address,
    city: user.city,
    postalCode: user.postal_code,
    role: user.role,
    credit: Number(user.credit),

    isPremium: user.is_premium || user.role === 'admin',
    avatarDataUrl: user.avatar_data_url,
  };
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const user = await queryOne<UserRow>(
    'select id, email, display_name, username, phone, address, city, postal_code, role, credit, is_premium, avatar_data_url from users where id = $1',
    [req.user!.sub],
  );
  if (!user) {
    throw new AppError(404, 'Utente non trovato.');
  }

  res.json(toPublicMe(user));
}

const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(20)
  .regex(/^[a-zA-Z0-9_]+$/, 'Username: solo lettere, numeri e underscore (3-20).');

const updateMeSchema = z.object({
  displayName: z.string().trim().min(1).optional(),
  username: usernameSchema.optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  avatarDataUrl: z.string().max(2_000_000).nullable().optional(),
  address: z.string().trim().max(120).optional(),
  city: z.string().trim().max(80).optional(),
  postalCode: z.string().trim().regex(/^\d{5}$/, 'CAP: 5 cifre.').optional(),
});

export async function updateMe(req: Request, res: Response): Promise<void> {
  const patch = updateMeSchema.parse(req.body);
  if (
    patch.displayName === undefined &&
    patch.username === undefined &&
    patch.phone === undefined &&
    patch.avatarDataUrl === undefined &&
    patch.address === undefined &&
    patch.city === undefined &&
    patch.postalCode === undefined
  ) {
    throw new AppError(400, 'Nessun campo da aggiornare.');
  }

  if (patch.username !== undefined) {
    const taken = await queryOne<{ id: string }>(
      'select id from users where lower(username) = lower($1) and id <> $2',
      [patch.username, req.user!.sub],
    );
    if (taken) {
      throw new AppError(409, 'Username gia in uso.');
    }
  }

  const rows = await query<UserRow>(
    `update users
        set display_name = coalesce($1, display_name),
            username = coalesce($2, username),
            phone = case when $3::boolean then $4 else phone end,
            avatar_data_url = case when $5::boolean then $6 else avatar_data_url end,
            address = coalesce($7, address),
            city = coalesce($8, city),
            postal_code = coalesce($9, postal_code)
      where id = $10
      returning id, email, display_name, username, phone, address, city, postal_code, role, credit, is_premium, avatar_data_url`,
    [
      patch.displayName ?? null,
      patch.username ?? null,
      patch.phone !== undefined,
      patch.phone ?? null,
      patch.avatarDataUrl !== undefined,
      patch.avatarDataUrl ?? null,
      patch.address ?? null,
      patch.city ?? null,
      patch.postalCode ?? null,
      req.user!.sub,
    ],
  );
  if (!rows[0]) {
    throw new AppError(404, 'Utente non trovato.');
  }

  res.json(toPublicMe(rows[0]));
}

export async function deleteMe(req: Request, res: Response): Promise<void> {
  await query('delete from users where id = $1', [req.user!.sub]);
  res.json({ message: 'Account eliminato.' });
}

interface AdminUserRow {
  id: string;
  email: string;
  display_name: string;
  role: 'user' | 'admin';
  credit: string;
  is_premium: boolean;
}

export async function listUsers(_req: Request, res: Response): Promise<void> {
  const rows = await query<AdminUserRow>(
    'select id, email, display_name, role, credit, is_premium from users order by role desc, display_name asc',
  );
  res.json(
    rows.map((u) => ({
      id: u.id,
      email: u.email,
      displayName: u.display_name,
      role: u.role,
      credit: Number(u.credit),
      isPremium: u.is_premium || u.role === 'admin',
    })),
  );
}

export async function adminDeleteUser(req: Request, res: Response): Promise<void> {
  const id = req.params.id;
  if (id === req.user!.sub) {
    throw new AppError(400, 'Non puoi eliminare il tuo account da qui.');
  }
  const existing = await queryOne<{ id: string }>('select id from users where id = $1', [id]);
  if (!existing) {
    throw new AppError(404, 'Utente non trovato.');
  }
  await query('delete from users where id = $1', [id]);
  res.json({ message: 'Utente eliminato.' });
}
