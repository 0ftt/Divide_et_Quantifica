import { z } from 'zod';

export const titleSchema = z.string().trim().min(1);
export const newsLimitSchema = z.coerce.number().int().positive();
