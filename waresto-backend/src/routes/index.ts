import { Router } from 'express';
import categoryRoutes from './category.routes.js';
import menuRoutes from './menu.routes.js';
import tableRoutes from './table.routes.js';
import orderRoutes from './order.routes.js';
import restaurantRoutes from './restaurant.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import { eventService } from '../services/EventService.js';

import uploadRoutes from './upload.routes.js';

const router = Router();

router.use('/categories', categoryRoutes);
router.use('/menus', menuRoutes);
router.use('/tables', tableRoutes);
router.use('/orders', orderRoutes);
router.use('/restaurant', restaurantRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/upload', uploadRoutes);

// SSE Endpoint
router.get('/events/orders', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = Date.now().toString();
  eventService.addClient(clientId, res);
});

export default router;
