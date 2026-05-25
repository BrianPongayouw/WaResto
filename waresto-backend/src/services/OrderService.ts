import { db } from '../config/db.js';
import { orders, orderItems, tables, restaurantProfile } from '../db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';
import { eventService } from './EventService.js';

export class OrderService {
  async getAll() {
    return await db.query.orders.findMany({
      where: sql`DATE(created_at) = CURRENT_DATE`,
      with: {
        items: true,
        table: true,
      },
      orderBy: [desc(orders.createdAt)],
    });
  }

  async getById(id: string) {
    return await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        items: true,
        table: true,
      },
    });
  }

  async create(data: any) {
    const { items, tableNumber, ...orderData } = data;

    const resultId = await db.transaction(async (tx) => {
      // Resolve tableId from tableNumber if provided
      let finalTableId = orderData.tableId;
      if (tableNumber && !finalTableId) {
        const table = await tx.query.tables.findFirst({
          where: eq(tables.number, tableNumber),
        });
        if (table) {
          finalTableId = table.id;
        }
      }

      // Fetch restaurant profile for tax rate
      const profile = await tx.query.restaurantProfile.findFirst();
      const taxRate = profile?.taxRate ? parseFloat(profile.taxRate.toString()) : 0.10;

      // Calculate subtotal from items
      let subtotal = 0;
      for (const item of items) {
        subtotal += parseFloat(item.price.toString()) * item.quantity;
      }

      const taxAmount = subtotal * taxRate;
      const total = subtotal + taxAmount;

      const [newOrder] = await tx.insert(orders).values({
        ...orderData,
        tableId: finalTableId,
        subtotal: subtotal.toString(),
        taxAmount: taxAmount.toString(),
        total: total.toString(),
      }).returning();

      // Insert order items
      const itemsWithOrderId = items.map((item: any) => ({
        ...item,
        orderId: newOrder.id,
      }));
      await tx.insert(orderItems).values(itemsWithOrderId);

      // Update table status if dine-in
      if (finalTableId && orderData.type === 'dine_in') {
        await tx.update(tables).set({ status: 'terisi' }).where(eq(tables.id, finalTableId));
      }

      return newOrder.id;
    });

    const result = await this.getById(resultId);
    // Broadcast new order
    eventService.broadcast('new_order', result);
    return result;
  }

  async updateStatus(id: string, status: string) {
    await db.transaction(async (tx) => {
      const [updatedOrder] = await tx
        .update(orders)
        .set({ status: status as any })
        .where(eq(orders.id, id))
        .returning();

      // If finished or cancelled, set table back to vacant
      if ((status === 'selesai' || status === 'dibatalkan') && updatedOrder.tableId) {
        await tx.update(tables).set({ status: 'kosong' }).where(eq(tables.id, updatedOrder.tableId));
      }
    });

    const result = await this.getById(id);
    // Broadcast status change
    eventService.broadcast('status_changed', result);
    return result;
  }

  async updateItems(id: string, newItems: any[]) {
    await db.transaction(async (tx) => {
      // Fetch restaurant profile for tax rate
      const profile = await tx.query.restaurantProfile.findFirst();
      const taxRate = profile?.taxRate ? parseFloat(profile.taxRate.toString()) : 0.10;

      // Recalculate totals
      let subtotal = 0;
      for (const item of newItems) {
        subtotal += parseFloat(item.price.toString()) * item.quantity;
      }
      const taxAmount = subtotal * taxRate;
      const total = subtotal + taxAmount;

      // Delete existing items and re-insert
      await tx.delete(orderItems).where(eq(orderItems.orderId, id));
      if (newItems.length > 0) {
        await tx.insert(orderItems).values(
          newItems.map((item: any) => ({ ...item, orderId: id }))
        );
      }

      // Update order totals
      await tx
        .update(orders)
        .set({ subtotal: subtotal.toString(), taxAmount: taxAmount.toString(), total: total.toString() })
        .where(eq(orders.id, id))
        .returning();
    });

    const result = await this.getById(id);
    eventService.broadcast('status_changed', result);
    return result;
  }

  async clearHistory() {
    // Delete orders that are 'selesai' or 'dibatalkan'
    const result = await db.delete(orders).where(sql`${orders.status} IN ('selesai', 'dibatalkan')`).returning();
    eventService.broadcast('history_cleared', { count: result.length });
    return result;
  }

  async startNewDay() {
    // Delete ALL orders
    const result = await db.delete(orders).returning();
    // Also reset table statuses
    await db.update(tables).set({ status: 'kosong' });
    eventService.broadcast('new_day_started', { count: result.length });
    return result;
  }
}
