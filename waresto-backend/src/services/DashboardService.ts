import { db } from '../config/db.js';
import { orders } from '../db/schema.js';
import { sql, eq, sum, count } from 'drizzle-orm';

export class DashboardService {
  async getStats() {
    // Total orders for TODAY
    const totalOrdersResult = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM orders
      WHERE DATE(created_at) = CURRENT_DATE
    `);
    const totalOrdersCount = parseInt(String(totalOrdersResult.rows[0]?.count ?? '0'), 10);

    const totalRevenue = await db.select({ total: sum(orders.total) }).from(orders).where(eq(orders.status, 'selesai'));
    const pendingOrdersResult = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM orders
      WHERE status = 'menunggu'
        AND DATE(created_at) = CURRENT_DATE
    `);
    const pendingOrdersCount = parseInt(String(pendingOrdersResult.rows[0]?.count ?? '0'), 10);
    
    // Today's revenue
    const todayRevenueResult = await db.execute(sql`
      SELECT COALESCE(SUM(total), 0) as revenue
      FROM orders
      WHERE status = 'selesai'
        AND DATE(created_at) = CURRENT_DATE
    `);

    // Yesterday's revenue
    const yesterdayRevenueResult = await db.execute(sql`
      SELECT COALESCE(SUM(total), 0) as revenue
      FROM orders
      WHERE status = 'selesai'
        AND DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
    `);

    const todayRevenue = parseFloat(String(todayRevenueResult.rows[0]?.revenue ?? '0'));
    const yesterdayRevenue = parseFloat(String(yesterdayRevenueResult.rows[0]?.revenue ?? '0'));
    const revenueGrowth = yesterdayRevenue > 0
      ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100)
      : (todayRevenue > 0 ? 100 : 0);

    // Revenue by day for the last 7 days
    const revenueByDay = await db.execute(sql`
      SELECT 
        DATE(created_at) as date,
        SUM(total) as revenue
      FROM orders
      WHERE status = 'selesai' AND created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `);

    return {
      totalOrders: totalOrdersCount,
      totalRevenue: totalRevenue[0].total || 0,
      todayRevenue,
      yesterdayRevenue,
      revenueGrowth,
      pendingOrders: pendingOrdersCount,
      revenueByDay: revenueByDay.rows,
    };
  }
}
