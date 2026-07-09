import { Request, Response } from 'express';
import { z } from 'zod';
import { randomBytes, createHash } from 'node:crypto';
import { query, queryOne } from '../db/pool';
import { hashPassword, verifyPassword } from '../auth/password';
import { signToken } from '../auth/jwt';
import { AppError } from '../middleware/error';
import { sendMail, emailLayout } from '../services/mail.service';
import { env } from '../config/env';

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
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
  token_version: number;
}

function toPublicUser(u: UserRow) {
  return {
    id: u.id,
    email: u.email,
    displayName: u.display_name,
    username: u.username,
    phone: u.phone,
    address: u.address,
    city: u.city,
    postalCode: u.postal_code,
    role: u.role,
    credit: Number(u.credit),

    isPremium: u.is_premium || u.role === 'admin',
    avatarDataUrl: u.avatar_data_url,
  };
}

const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(20)
  .regex(/^[a-zA-Z0-9_]+$/, 'Username: solo lettere, numeri e underscore (3-20).');

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().trim().optional(),
  username: usernameSchema,
  phone: z.string().trim().max(30).optional(),

  address: z.string().trim().min(3).max(120).optional(),
  city: z.string().trim().min(2).max(80).optional(),
  postalCode: z.string().trim().regex(/^\d{5}$/, 'CAP: 5 cifre.').optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, displayName, username, phone, address, city, postalCode } =
    registerSchema.parse(req.body);

  const existing = await queryOne<UserRow>('select * from users where email = $1', [email]);
  if (existing) {
    throw new AppError(409, 'Email gia registrata.');
  }

  const takenUsername = await queryOne<{ id: string }>(
    'select id from users where lower(username) = lower($1)',
    [username],
  );
  if (takenUsername) {
    throw new AppError(409, 'Username gia in uso.');
  }

  const count = await queryOne<{ n: string }>('select count(*)::int as n from users');
  const role = Number(count?.n ?? 0) === 0 ? 'admin' : 'user';
  const hash = await hashPassword(password);

  const rows = await query<UserRow>(
    `insert into users (email, password_hash, display_name, username, phone, address, city, postal_code, role)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning *`,
    [email, hash, displayName ?? '', username, phone ?? null, address ?? '', city ?? '', postalCode ?? '', role],
  );
  const user = rows[0];

  const token = signToken({ sub: user.id, role: user.role, email: user.email, tv: user.token_version });

  void sendMail(
    user.email,
    'Benvenuto in Divide et Quantifica',
    emailLayout(
      `Ciao ${user.username || 'trader'}!`,
      `Il tuo account è pronto. Accedi con la tua email e inizia a comporre la tua plancia di trading simulato.`,
    ),
  );

  res.status(201).json({ token, user: toPublicUser(user) });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = loginSchema.parse(req.body);

  const user = await queryOne<UserRow>('select * from users where email = $1', [email]);
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    throw new AppError(401, 'Credenziali non valide.');
  }

  const bumped = await query<{ token_version: number }>(
    'update users set token_version = token_version + 1 where id = $1 returning token_version',
    [user.id],
  );
  const token = signToken({
    sub: user.id,
    role: user.role,
    email: user.email,
    tv: bumped[0].token_version,
  });
  res.json({ token, user: toPublicUser(user) });
}

const recoverSchema = z.object({ email: z.string().trim().email() });
const resetSchema = z.object({ token: z.string().min(10), password: z.string().min(6) });

export async function recover(req: Request, res: Response): Promise<void> {
  const { email } = recoverSchema.parse(req.body);
  const user = await queryOne<{ id: string }>('select id from users where email = $1', [email]);
  if (user) {
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await query(
      'insert into password_resets (user_id, token_hash, expires_at) values ($1, $2, $3)',
      [user.id, tokenHash, expiresAt],
    );
    const origin = (req.headers.origin as string) || env.frontendUrl;
    const link = `${origin}/reset?token=${token}`;
    void sendMail(
      email,
      'Recupero password DeQ',
      emailLayout(
        'Reimposta la password',
        `Hai richiesto il reset della password. Apri questo link (valido 1 ora):<br><br>
         <a href="${link}" style="color:#01B7C6;">Reimposta la password</a><br><br>
         Se non sei stato tu, ignora questa email.`,
      ),
    );
  }
  res.json({ ok: true });
}

export async function reset(req: Request, res: Response): Promise<void> {
  const { token, password } = resetSchema.parse(req.body);
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const row = await queryOne<{ id: string; user_id: string; expires_at: string; used: boolean }>(
    'select id, user_id, expires_at, used from password_resets where token_hash = $1',
    [tokenHash],
  );
  if (!row || row.used || new Date(row.expires_at) < new Date()) {
    throw new AppError(400, 'Link di reset non valido o scaduto.');
  }
  const passwordHash = await hashPassword(password);
  await query(
    'update users set password_hash = $1, token_version = token_version + 1 where id = $2',
    [passwordHash, row.user_id],
  );
  await query('update password_resets set used = true where id = $1', [row.id]);
  res.json({ ok: true });
}
