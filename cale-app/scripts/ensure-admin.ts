import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
    const email = 'carlospt@live.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(`Ensuring admin user: ${email}...`);

    await prisma.user.upsert({
        where: { email },
        update: {
            role: 'admin',
            password: hashedPassword
        },
        create: {
            name: 'Carlos Admin',
            email: email,
            password: hashedPassword,
            role: 'admin'
        }
    });

    console.log('Admin user ready.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
