import { db } from '../config/db.js';
import { restaurantProfile } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export class RestaurantService {
  async getProfile() {
    return await db.query.restaurantProfile.findFirst();
  }

  async updateProfile(data: any) {
    const existing = await this.getProfile();
    if (existing) {
      const [updated] = await db
        .update(restaurantProfile)
        .set(data)
        .where(eq(restaurantProfile.id, existing.id))
        .returning();
      return updated;
    } else {
      // Provide default name if not given, since it's NOT NULL
      const [created] = await db
        .insert(restaurantProfile)
        .values({ name: 'Ayam Lumion', ...data })
        .returning();
      return created;
    }
  }
}
