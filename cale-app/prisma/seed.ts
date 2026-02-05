
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    const dataDir = path.join(__dirname, '../data');

    // 1. Migrate Users
    const usersPath = path.join(dataDir, 'users.json');
    if (fs.existsSync(usersPath)) {
        const users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
        console.log(`Seeding ${users.length} users...`);
        for (const user of users) {
            await prisma.user.upsert({
                where: { id: user.id },
                update: {},
                create: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    password: user.password,
                    isPro: user.isPro || false,
                },
            });
        }
    }

    // 2. Migrate Questions
    const questionsPath = path.join(dataDir, 'questions.json');
    if (fs.existsSync(questionsPath)) {
        const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));
        console.log(`Seeding ${questions.length} questions...`);
        for (const q of questions) {
            await prisma.question.upsert({
                where: { id: q.id },
                update: {
                    text: q.text,
                    options: q.options,
                    correctAnswer: q.correctAnswer
                },
                create: {
                    id: q.id,
                    category: q.category,
                    text: q.text,
                    options: q.options,
                    correctAnswer: q.correctAnswer,
                },
            });
        }
    }

    // 3. Migrate Results
    const resultsPath = path.join(dataDir, 'results.json');
    if (fs.existsSync(resultsPath)) {
        const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
        console.log(`Seeding ${results.length} results...`);
        for (const r of results) {
            const userExists = await prisma.user.findUnique({ where: { id: r.userId } });
            if (!userExists) {
                console.warn(`Skipping result ${r.id} for non-existent user ${r.userId}`);
                continue;
            }

            await prisma.result.upsert({
                where: { id: r.id },
                update: {},
                create: {
                    id: r.id,
                    userId: r.userId,
                    userName: r.userName,
                    category: r.category,
                    date: new Date(r.date),
                    score: r.score,
                    totalQuestions: r.totalQuestions,
                    failedQuestions: r.failedQuestions,
                },
            });
        }
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
