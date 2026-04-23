import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { pool } from '../db';
import { getSupabaseAdmin, uploadPdfToSupabase } from '../supabaseStorage';

const uploadsDir = path.join(__dirname, '../../uploads');

const JSON_PAPER_FIELDS = new Set(['authors', 'labels', 'paperTags', 'canvasData', 'pdfHighlights']);

const UPDATE_FIELD_SQL: Record<string, string> = {
  title: 'title',
  year: 'year',
  authors: 'authors',
  labels: 'labels',
  paperTags: '"paperTags"',
  metrics: 'metrics',
  dataset: 'dataset',
  core: 'core',
  observations: 'observations',
  group: '"group"',
  relevance: 'relevance',
  importance: 'importance',
  canvasData: '"canvasData"',
  pdfPath: '"pdfPath"',
  pdfHighlights: '"pdfHighlights"',
};

function mapPaperRow(p: Record<string, unknown>) {
  const r = p as Record<string, unknown>;
  const pdfPath = (r.pdfPath ?? r.pdfpath ?? null) as string | null;
  const projectId = (r.projectId ?? r.projectid) as string;
  return {
    ...r,
    projectId,
    pdfPath,
    authors: JSON.parse(String(r.authors || '[]')),
    labels: JSON.parse(String(r.labels || '[]')),
    paperTags: JSON.parse(String((r as { paperTags?: string }).paperTags || '[]')),
    canvasData: r.canvasData ? JSON.parse(String(r.canvasData)) : null,
    pdfHighlights: JSON.parse(String((r as { pdfHighlights?: string }).pdfHighlights || '[]')),
  };
}

export const listPapers = async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM papers WHERE "projectId" = $1', [req.params.projectId]);
    res.json(rows.map((p) => mapPaperRow(p as Record<string, unknown>)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch papers' });
  }
};

export const listAllPapers = async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM papers');
    res.json(rows.map((p) => mapPaperRow(p as Record<string, unknown>)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch all papers' });
  }
};

export const createPaper = async (req: Request, res: Response) => {
  try {
    const { title, year, authors, labels, paperTags, group, relevance, importance, pdfPath } = req.body;
    if (!title) return res.status(400).json({ error: 'Paper title is required' });

    const id = uuidv4();
    await pool.query(
      `INSERT INTO papers (id, "projectId", title, year, authors, labels, "paperTags", metrics, dataset, core, observations, "group", relevance, importance, "pdfHighlights", "pdfPath")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        id,
        req.params.projectId,
        title,
        year ?? null,
        JSON.stringify(authors || []),
        JSON.stringify(labels || []),
        JSON.stringify(paperTags || []),
        '',
        '',
        '',
        '',
        group || 'Ungrouped',
        relevance ?? 0,
        importance ?? 0,
        JSON.stringify([]),
        pdfPath ?? null,
      ]
    );
    res.status(201).json({
      id,
      title,
      year,
      authors,
      labels,
      paperTags,
      group,
      relevance,
      importance,
      pdfPath: pdfPath ?? null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create paper' });
  }
};

export const updatePaper = async (req: Request, res: Response) => {
  try {
    const updates = req.body as Record<string, unknown>;
    const fields = Object.keys(updates).filter((f) => UPDATE_FIELD_SQL[f]);
    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    const values: unknown[] = [];
    const setParts = fields.map((f, i) => {
      const val = updates[f];
      const serialized = JSON_PAPER_FIELDS.has(f) ? JSON.stringify(val) : val;
      values.push(serialized);
      return `${UPDATE_FIELD_SQL[f]} = $${i + 1}`;
    });
    values.push(req.params.id);

    const query = `UPDATE papers SET ${setParts.join(', ')} WHERE id = $${values.length}`;
    const result = await pool.query(query, values);

    if (result.rowCount === 0) return res.status(404).json({ error: 'Paper not found' });
    res.sendStatus(200);
  } catch (err) {
    console.error('Update paper error:', err);
    res.status(500).json({ error: 'Failed to update paper' });
  }
};

export const deletePaper = async (req: Request, res: Response) => {
  try {
    const result = await pool.query('DELETE FROM papers WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Paper not found' });
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete paper' });
  }
};

export const uploadPdf = async (req: Request, res: Response) => {
  if (!req.file?.buffer) return res.status(400).json({ error: 'No file uploaded' });

  try {
    if (getSupabaseAdmin()) {
      const publicUrl = await uploadPdfToSupabase(req.file.buffer, {
        contentType: req.file.mimetype,
        originalName: req.file.originalname,
      });
      return res.json({ pdfPath: publicUrl });
    }

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const ext = path.extname(req.file.originalname) || '.pdf';
    const filename = `${uuidv4()}${ext}`;
    fs.writeFileSync(path.join(uploadsDir, filename), req.file.buffer);
    return res.json({ pdfPath: filename });
  } catch (err) {
    console.error('uploadPdf:', err);
    return res.status(500).json({ error: 'Failed to store PDF' });
  }
};
