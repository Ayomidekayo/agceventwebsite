import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client';
import { AdminRole, EventStatus } from '../src/generated/prisma/enums';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required. Configure PostgreSQL in api/.env.');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  const email = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!email || !password || password === 'change-this-before-running' || password.length < 12) {
    throw new Error('Set ADMIN_SEED_EMAIL and a unique ADMIN_SEED_PASSWORD of at least 12 characters in api/.env before seeding.');
  }

  await prisma.event.upsert({
    where: { slug: 'agn-2027-lagos' },
    update: {},
    create: {
      slug: 'agn-2027-lagos',
      title: 'Lagos Activation Global Conference 2027',
      theme: 'From Block to Breakthrough',
      description: 'A gathering focused on mindset, leadership, business and entrepreneurship.',
      eventDate: new Date('2027-02-27T09:00:00+01:00'),
      startTime: '9:00 AM',
      venue: 'Lagos State University (LASU)',
      venueStatus: 'PENDING_CONFIRMATION',
      targetAttendance: 1000,
      registrationMode: 'FREE_PENDING_APPROVAL',
      status: EventStatus.PUBLISHED,
    },
  });

  const passwordHash = await hash(password, 12);
  await prisma.adminUser.upsert({
    where: { email },
    update: {
      name: 'AGN Super Administrator',
      passwordHash,
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
    },
    create: {
      email,
      name: 'AGN Super Administrator',
      passwordHash,
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  console.log('AGN event and Super Admin account are ready. Store credentials securely.');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
