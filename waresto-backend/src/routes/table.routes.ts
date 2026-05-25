import { Router } from 'express';
import { TableService } from '../services/TableService.js';

const router = Router();
const tableService = new TableService();

router.get('/', async (req, res) => {
  try {
    const tables = await tableService.getAll();
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

router.post('/', async (req, res) => {
  try {
    const table = await tableService.create(req.body);
    res.status(201).json(table);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create table' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const table = await tableService.update(req.params.id, req.body);
    res.json(table);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update table' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await tableService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete table' });
  }
});

export default router;
