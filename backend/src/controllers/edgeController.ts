import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db';

export const listEdges = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM edges WHERE "projectId" = $1', [req.params.projectId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch edges' });
  }
};

export const listAllEdges = async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM edges');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch all edges' });
  }
};

export const createEdge = async (req: Request, res: Response) => {
  try {
    const { source, target, label } = req.body;
    if (!source || !target) return res.status(400).json({ error: 'Source and target are required' });

    const id = uuidv4();
    await pool.query(
      'INSERT INTO edges (id, "projectId", source, target, label) VALUES ($1, $2, $3, $4, $5)',
      [id, req.params.projectId, source, target, label || '']
    );
    res.status(201).json({ id, source, target, label });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create edge' });
  }
};

export const deleteEdge = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('DELETE FROM edges WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Edge not found' });
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete edge' });
  }
};
