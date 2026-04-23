import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import routes from './routes';
import { pool } from './db';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Routes
app.use('/api', routes);

// Static files for PDFs
app.use('/api/pdfs', express.static(uploadsDir));

// Root route
app.get('/', (req, res) => {
  res.send('Research Graph API is running');
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const host = process.env.HOST || '0.0.0.0';
const server = app.listen(Number(port), host, () => {
  console.log(`Server running on http://${host}:${port}`);
});

const shutdown = async () => {
  try {
    await pool.end();
  } catch (e) {
    console.error('Pool shutdown error', e);
  }
  server.close(() => process.exit(0));
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
