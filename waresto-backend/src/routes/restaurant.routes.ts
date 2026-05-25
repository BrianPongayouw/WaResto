import { Router } from 'express';
import { RestaurantService } from '../services/RestaurantService.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();
const restaurantService = new RestaurantService();

router.get('/profile', async (req, res) => {
  try {
    const profile = await restaurantService.getProfile();
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch restaurant profile' });
  }
});

router.patch('/profile', requireAuth, async (req, res) => {
  try {
    const profile = await restaurantService.updateProfile(req.body);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update restaurant profile' });
  }
});

export default router;
