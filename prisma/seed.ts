import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash('Password123');

  const systemOwner = await prisma.user.upsert({
    where: { email: 'owner@subflow.com' },
    update: { passwordHash },
    create: {
      email: 'owner@subflow.com',
      firstName: 'System',
      lastName: 'Owner',
      passwordHash,
      isEmailVerified: true,
      role: Role.SYSTEM_OWNER,
    },
  });

  console.log({ systemOwner });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
