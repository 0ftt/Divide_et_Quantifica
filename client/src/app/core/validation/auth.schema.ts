import { z } from 'zod';

export const emailSchema = z.string().trim().email();
export const passwordSchema = z.string().min(6);

export const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(20)
  .regex(/^[a-zA-Z0-9_]+$/);
export const addressSchema = z.string().trim().min(3).max(120);
export const citySchema = z.string().trim().min(2).max(80);

export const capSchema = z.string().trim().regex(/^\d{5}$/);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().trim().optional(),
  username: usernameSchema,
  phone: z.string().trim().max(30).optional(),

  address: addressSchema.optional(),
  city: citySchema.optional(),
  postalCode: capSchema.optional(),
});
