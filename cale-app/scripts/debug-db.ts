import { prisma } from '../src/lib/prisma';

async function main() {
    const evals = await prisma.evaluation.findMany({
        include: {
            _count: { select: { questions: true } }
        }
    });
    console.log('Evaluations:', JSON.stringify(evals, null, 2));

    const supertaxisQuestions = await prisma.question.findMany({
        where: {
            OR: [
                { category: 'supertaxis' },
                { category: { contains: 'cmlz' } } // likely ID prefix from my previous seed
            ]
        }
    });
    console.log('Supertaxis Questions:', supertaxisQuestions.length);
    if (supertaxisQuestions.length > 0) {
        console.log('First question category:', supertaxisQuestions[0].category);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
