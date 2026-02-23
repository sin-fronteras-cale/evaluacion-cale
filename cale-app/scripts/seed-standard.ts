import { prisma } from '../src/lib/prisma';
import { SEED_QUESTIONS } from '../src/lib/data';

async function main() {
    console.log('Seeding standard questions (A2, B1, C1)...');

    for (const q of SEED_QUESTIONS) {
        await prisma.question.upsert({
            where: { id: q.id },
            update: {
                text: q.text,
                options: q.options,
                correctAnswer: q.correctAnswer,
                category: q.category
            },
            create: {
                id: q.id,
                text: q.text,
                options: q.options,
                correctAnswer: q.correctAnswer,
                category: q.category
            }
        });
    }

    console.log(`Successfully seeded ${SEED_QUESTIONS.length} questions.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
