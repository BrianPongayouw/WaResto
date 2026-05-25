import { db } from '../config/db.js';
import { tables } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export class TableService {
  async getAll() {
    return await db.select().from(tables);
  }

  async getById(id: string) {
    return await db.query.tables.findFirst({
      where: eq(tables.id, id),
    });
  }

  async create(data: { number: string; qrCodeUrl?: string; menuUrl?: string }) {
    const [result] = await db.insert(tables).values(data).returning();
    return result;
  }

  async update(id: string, data: any) {
    const [result] = await db
      .update(tables)
      .set(data)
      .where(eq(tables.id, id))
      .returning();
    return result;
  }

  async updateStatus(id: string, status: 'kosong' | 'terisi') {
    const [result] = await db
      .update(tables)
      .set({ status })
      .where(eq(tables.id, id))
      .returning();
    return result;
  }

  async delete(id: string) {
    const [result] = await db.delete(tables).where(eq(tables.id, id)).returning();
    return result;
  }

  async getByNumber(number: string) {
    return await db.query.tables.findFirst({
      where: eq(tables.number, number),
    });
  }
}
