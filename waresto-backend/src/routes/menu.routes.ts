import { Router } from 'express';
import { MenuService } from '../services/MenuService.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createMenuSchema, updateMenuSchema } from '../schemas/menu.schema.js';

const router = Router();
const menuService = new MenuService();

router.get('/', async (req, res) => {
  try {
    const categoryId = req.query.categoryId as string;
    const menus = await menuService.getAll(categoryId);
    res.json(menus);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menus' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const menu = await menuService.getById(req.params.id);
    if (!menu) return res.status(404).json({ error: 'Menu not found' });
    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

router.post('/', requireAuth, validate(createMenuSchema), async (req, res) => {
  try {
    const menu = await menuService.create(req.body);
    res.status(201).json(menu);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create menu' });
  }
});

router.patch('/:id', requireAuth, validate(updateMenuSchema), async (req, res) => {
  try {
    const menu = await menuService.update(req.params.id, req.body);
    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update menu' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await menuService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete menu' });
  }
});

export default router;
