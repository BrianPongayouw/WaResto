import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    customerName: z.string().min(1, 'Customer name is required'),
    type: z.enum(['dine_in', 'take_away'], {
      message: 'Type must be dine_in or take_away',
    }),
    items: z
      .array(
        z.object({
          menuId: z.string().uuid('Invalid menu ID'),
          quantity: z.number().positive('Quantity must be positive'),
          price: z.number().positive('Price must be positive'),
          name: z.string().min(1, 'Item name is required'),
        })
      )
      .min(1, 'At least one item is required'),
    tableId: z.string().uuid('Invalid table ID').optional(),
    specialNote: z.string().optional(),
  }),
});

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(['menunggu', 'proses', 'siap', 'selesai', 'dibatalkan'], {
      message: 'Status must be one of: menunggu, proses, siap, selesai, dibatalkan',
    }),
  }),
});
