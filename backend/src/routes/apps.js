import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { uploadApk, getApkStream } from '../lib/storage.js';
import { v4 as uuid } from 'uuid';

const prisma = new PrismaClient();
const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

router.get('/', async (req, res, next) => {
  try {
    const { q, category } = req.query;
    const where = { status: 'APPROVED' };
    if (category) where.category = String(category);
    if (q) {
      where.OR = [
        { name: { contains: String(q), mode: 'insensitive' } },
        { description: { contains: String(q), mode: 'insensitive' } },
      ];
    }
    const apps = await prisma.app.findMany({
      where,
      orderBy: { downloads: 'desc' },
      include: { developer: { select: { id: true, name: true } } },
    });
    res.json(apps);
  } catch (e) {
    next(e);
  }
});

router.get('/me/list', requireAuth, requireRole('DEVELOPER', 'ADMIN'), async (req, res, next) => {
  try {
    const apps = await prisma.app.findMany({
      where: { developerId: req.user.id },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(apps);
  } catch (e) {
    next(e);
  }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const app = await prisma.app.findUnique({
      where: { slug: req.params.slug },
      include: { developer: { select: { id: true, name: true } } },
    });
    if (!app || app.status !== 'APPROVED') {
      return res.status(404).json({ error: 'App not found' });
    }
    res.json(app);
  } catch (e) {
    next(e);
  }
});

const createSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  category: z.string().min(2),
  version: z.string().min(1),
  packageName: z.string().optional(),
});

router.post('/', requireAuth, requireRole('DEVELOPER', 'ADMIN'), async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    let slug = slugify(body.name);
    const existing = await prisma.app.findUnique({ where: { slug } });
    if (existing) slug = `\( {slug}- \){uuid().slice(0, 6)}`;

    const app = await prisma.app.create({
      data: {
        ...body,
        slug,
        status: 'DRAFT',
        developerId: req.user.id,
      },
    });
    res.status(201).json(app);
  } catch (e) {
    next(e);
  }
});

router.post(
  '/:id/upload',
  requireAuth,
  requireRole('DEVELOPER', 'ADMIN'),
  upload.single('apk'),
  async (req, res, next) => {
    try {
      const app = await prisma.app.findUnique({ where: { id: req.params.id } });
      if (!app) return res.status(404).json({ error: 'App not found' });
      if (app.developerId !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Not your app' });
      }
      if (!req.file) return res.status(400).json({ error: 'APK file required' });

      const objectName = `\( {app.id}/ \){app.version || '1.0.0'}-${uuid()}.apk`;
      await uploadApk(objectName, req.file.buffer, req.file.size);

      const updated = await prisma.app.update({
        where: { id: app.id },
        data: {
          apkObject: objectName,
          apkSize: req.file.size,
          status: 'PENDING',
        },
      });
      res.json(updated);
    } catch (e) {
      next(e);
    }
  }
);

router.get('/:id/download', async (req, res, next) => {
  try {
    const app = await prisma.app.findUnique({ where: { id: req.params.id } });
    if (!app?.apkObject) return res.status(404).json({ error: 'No APK' });
    if (app.status !== 'APPROVED') {
      return res.status(403).json({ error: 'App not approved for download' });
    }

    await prisma.app.update({
      where: { id: app.id },
      data: { downloads: { increment: 1 } },
    });

    const stream = await getApkStream(app.apkObject);
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', `attachment; filename="${app.slug}.apk"`);
    stream.pipe(res);
  } catch (e) {
    next(e);
  }
});

export default router;
