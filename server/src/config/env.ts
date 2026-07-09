import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variabile d'ambiente mancante: ${name}`);
  }
  return value;
}

function numberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function parseOrigins(raw: string | undefined): string | string[] {
  if (!raw || raw.trim() === '*') return '*';
  const list = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return list.length === 1 ? list[0] : list;
}

export const env = {
  port: numberEnv('PORT', 3000),
  corsOrigin: parseOrigins(process.env.CORS_ORIGIN),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  premiumPrice: numberEnv('PREMIUM_PRICE', 10),
  quoteCacheMinutes: numberEnv('QUOTE_CACHE_MINUTES', 20),

  mailUser: process.env.MAIL_USER ?? '',
  mailPass: process.env.MAIL_PASS ?? '',
  mailFrom: process.env.MAIL_FROM ?? process.env.MAIL_USER ?? '',

  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:8100',
};
