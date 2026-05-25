import { z } from 'zod';

export const createMenuSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    price: z.number().positive('Price must be positive'),
    categoryId: z.string().uuid('Invalid category ID').optional(),
    description: z.string().optional(),
    isAvailable: z.boolean().optional(),
  }),
});

export const updateMenuSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').optional(),
    price: z.number().positive('Price must be positive').optional(),
    categoryId: z.string().uuid('Invalid category ID').optional(),
    description: z.string().optional(),
    isAvailable: z.boolean().optional(),
  }),
});
