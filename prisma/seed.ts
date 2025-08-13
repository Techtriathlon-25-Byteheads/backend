import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash('password123', salt);

  const superAdmin = await prisma.dimUsers.create({
    data: {
      userId: 'SUPERADMIN01',
      email: 'superadmin@gov.lk',
      passwordHash: password,
      role: 'SUPER_ADMIN',
      firstName: 'Super',
      lastName: 'Admin',
      isVerified: true,
    },
  });

  console.log({ superAdmin });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
