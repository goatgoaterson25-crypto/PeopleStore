import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('changeme', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@peoplestore.local' },
    update: {},
    create: {
      email: 'admin@peoplestore.local',
      passwordHash: hash,
      name: 'Admin',
      role: 'ADMIN',
    },
  });

  const devHash = await bcrypt.hash('developer', 10);
  const dev = await prisma.user.upsert({
    where: { email: 'dev@peoplestore.local' },
    update: {},
    create: {
      email: 'dev@peoplestore.local',
      passwordHash: devHash,
      name: 'Demo Developer',
      role: 'DEVELOPER',
    },
  });

  const count = await prisma.app.count();
  if (count === 0) {
    await prisma.app.create({
      data: {
        name: 'Hello PeopleStore',
        slug: 'hello-peoplestore',
        description: 'Sample approved app so the store is not empty on first run.',
        category: 'Tools',
        version: '1.0.0',
        packageName: 'com.peoplestore.hello',
        status: 'APPROVED',
        developerId: dev.id,
      },
    });
  }

  console.log('Seeded admin:', admin.email);
  console.log('Seeded developer:', dev.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
