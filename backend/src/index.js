import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import appRoutes from './routes/apps.js';
import adminRoutes from './routes/admin.js';
import { ensureBucket } from './lib/storage.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'peoplestore-api' });
});

app.use('/auth', authRoutes);
app.use('/apps', appRoutes);
app.use('/admin', adminRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: 'Validation failed', details: err.errors });
  }
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

async function start() {
  try {
    await ensureBucket().catch((e) => {
      console.warn('MinIO unavailable, APK uploads disabled:', e.message);
    });
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`PeopleStore API listening on :${PORT}`);
    });
  } catch (e) {
    console.error('Failed to start', e);
    process.exit(1);
  }
}

start();
