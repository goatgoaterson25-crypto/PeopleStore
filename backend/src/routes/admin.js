import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/apps', async (req, res, next) => {
  try {
    const status = req.query.status;
    const where = status ? { status: String(status) } : {};
    const apps = await prisma.app.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: { developer: { select: { id: true, email: true, name: true } } },
    });
    res.json(apps);
  } catch (e) {
    next(e);
  }
});

router.post('/apps/:id/approve', async (req, res, next) => {
  try {
    const app = await prisma.app.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED' },
    });
    res.json(app);
  } catch (e) {
    next(e);
  }
});

router.post('/apps/:id/reject', async (req, res, next) => {
  try {
    const app = await prisma.app.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED' },
    });
    res.json(app);
  } catch (e) {
    next(e);
  }
});

router.get('/users', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (e) {
    next(e);
  }
});

export default router;
