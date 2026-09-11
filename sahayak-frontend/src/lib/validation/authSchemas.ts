import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(true),
});

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  preferredName: z.string().optional(),
  role: z.enum(['elderly', 'caregiver', 'family', 'healthcare', 'admin']).default('elderly'),
  languagePreference: z.string().optional().default('en'),
  gender: z.string().optional().default('neutral'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
