import { db } from '../config/db.js';
import { menus, menuOptions, categories } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

export class MenuService {
  async getAll(categoryId?: string) {
    const query = db
      .select({
        id: menus.id,
        name: menus.name,
        description: menus.description,
        price: menus.price,
        categoryId: menus.categoryId,
        category: categories.name,
        imageUrl: menus.imageUrl,
        isAvailable: menus.isAvailable,
        createdAt: menus.createdAt,
      })
      .from(menus)
      .leftJoin(categories, eq(menus.categoryId, categories.id));

    if (categoryId) {
      return await query.where(eq(menus.categoryId, categoryId));
    }
    return await query;
  }

  async getById(id: string) {
    const menu = await db.query.menus.findFirst({
      where: eq(menus.id, id),
      with: {
        options: true,
      },
    });
    return menu;
  }

  async create(data: any) {
    const { options, ...menuData } = data;
    
    return await db.transaction(async (tx) => {
      const [newMenu] = await tx.insert(menus).values(menuData).returning();
      
      if (options && options.length > 0) {
        const optionsWithMenuId = options.map((opt: any) => {
          const { id, ...rest } = opt;
          return { ...rest, menuId: newMenu.id };
        });
        await tx.insert(menuOptions).values(optionsWithMenuId);
      }
      
      const menuWithOptions = await tx.query.menus.findFirst({
        where: eq(menus.id, newMenu.id),
        with: { options: true },
      });
      return menuWithOptions;
    });
  }

  async update(id: string, data: any) {
    const { options, ...menuData } = data;

    return await db.transaction(async (tx) => {
      const [updatedMenu] = await tx
        .update(menus)
        .set(menuData)
        .where(eq(menus.id, id))
        .returning();

      if (options) {
        // Simple approach: delete all and re-insert
        await tx.delete(menuOptions).where(eq(menuOptions.menuId, id));
        if (options.length > 0) {
          const optionsWithMenuId = options.map((opt: any) => {
            const { id: optId, ...rest } = opt;
            return { ...rest, menuId: id };
          });
          await tx.insert(menuOptions).values(optionsWithMenuId);
        }
      }

      const menuWithOptions = await tx.query.menus.findFirst({
        where: eq(menus.id, id),
        with: { options: true },
      });
      return menuWithOptions;
    });
  }

  async delete(id: string) {
    const [result] = await db.delete(menus).where(eq(menus.id, id)).returning();
    return result;
  }
}
