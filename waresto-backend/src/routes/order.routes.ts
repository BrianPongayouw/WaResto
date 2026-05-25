import { Router } from 'express';
import { OrderService } from '../services/OrderService.js';

const router = Router();
const orderService = new OrderService();

router.get('/', async (req, res) => {
  try {
    const orders = await orderService.getAll();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await orderService.getById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

router.post('/', async (req, res) => {
  try {
    const order = await orderService.create(req.body);
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const order = await orderService.updateStatus(req.params.id, req.body.status);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

router.patch('/:id/items', async (req, res) => {
  try {
    const order = await orderService.updateItems(req.params.id, req.body.items);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order items' });
  }
});

router.delete('/clear-history', async (req, res) => {
  try {
    await orderService.clearHistory();
    res.json({ success: true, message: 'History cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

router.post('/start-new-day', async (req, res) => {
  try {
    await orderService.startNewDay();
    res.json({ success: true, message: 'New day started' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start new day' });
  }
});

export default router;
