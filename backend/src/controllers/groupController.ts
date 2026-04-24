import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db';

export const listGroups = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({ error: 'projectId is required' });
    }

    const { rows } = await pool.query('SELECT * FROM groups WHERE "projectId" = $1', [projectId]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
};

export const createGroup = async (req: Request, res: Response) => {
  try {
    const { projectId, name, description } = req.body;
    if (!projectId || !name) return res.status(400).json({ error: 'projectId and name are required' });

    const id = uuidv4();
    await pool.query('INSERT INTO groups (id, "projectId", name, description) VALUES ($1, $2, $3, $4)', [
      id,
      projectId,
      name,
      description || '',
    ]);
    res.status(201).json({ id, projectId, name, description });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create group' });
  }
};

export const updateGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const found = await pool.query('SELECT * FROM groups WHERE id = $1', [id]);
    const group = found.rows[0] as Record<string, unknown> | undefined;
    if (!group) return res.status(404).json({ error: 'Group not found' });

    await pool.query('UPDATE groups SET name = $1, description = $2 WHERE id = $3', [
      name ?? group.name,
      description ?? group.description,
      id,
    ]);

    res.json({
      ...group,
      name: name ?? group.name,
      description: description ?? group.description,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update group' });
  }
};

export const deleteGroup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM groups WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete group' });
  }
};
