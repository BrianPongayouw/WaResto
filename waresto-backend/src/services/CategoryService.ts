import { db } from '../config/db.js';
import { categories } from '../db/schema.js';
import { eq, asc } from 'drizzle-orm';

export class CategoryService {
  async getAll() {
    return await db.select().from(categories).orderBy(asc(categories.sortOrder));
  }

  async create(data: { name: string; sortOrder?: number }) {
    const [result] = await db.insert(categories).values(data).returning();
    return result;
  }

  async update(id: string, data: { name?: string; sortOrder?: number }) {
    const [result] = await db
      .update(categories)
      .set(data)
      .where(eq(categories.id, id))
      .returning();
    return result;
  }

  async delete(id: string) {
    const [result] = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning();
    return result;
  }
}
