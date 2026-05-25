import { Router } from 'express';
import { DashboardService } from '../services/DashboardService.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();
const dashboardService = new DashboardService();

router.get('/stats', requireAuth, async (req, res) => {
  try {
    const stats = await dashboardService.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;
