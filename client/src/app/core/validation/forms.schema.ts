import { z } from 'zod';

export const quantitySchema = z.coerce.number().positive();

export const tickerSchema = z
  .string()
  .trim()
  .min(1)
  .max(15)
  .regex(/^[A-Za-z0-9.\-]+$/);

export const rechargeAmountSchema = z.coerce.number().positive().max(100000);
