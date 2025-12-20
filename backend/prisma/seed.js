import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check if default room already exists
  const existingRoom = await prisma.room.findFirst({
    where: { name: 'Default Room' }
  });

  if (!existingRoom) {
    console.log('Creating default room...');
    await prisma.room.create({
      data: {
        name: 'Default Room',
        currencyCode: 'USD',
      },
    });
    console.log('✅ Default room created successfully!');
  } else {
    console.log('✅ Default room already exists.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });