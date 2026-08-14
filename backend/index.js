import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createApiRouter } from './src/routes.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(
  cors({
    origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use('/api', createApiRouter());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'infdl-backend' });
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});
