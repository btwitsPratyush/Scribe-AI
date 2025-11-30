import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function debugDatabase() {
    try {
        console.log('=== Database Connection Test ===\n');

        // Test connection
        await prisma.$connect();
        console.log('Database connected\n');

        // Count all users
        const userCount = await prisma.user.count();
        console.log(`Total users in database: ${userCount}\n`);

        // List all users
        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
            }
        });

        console.log('All users:');
        allUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email} (${user.name}) - ID: ${user.id}`);
        });

        if (allUsers.length === 0) {
            console.log('\n⚠️  No users found in database!');
            console.log('This explains why login is failing.');
        }

    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

debugDatabase();
