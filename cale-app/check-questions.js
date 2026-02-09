const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkQuestions() {
    try {
        const count = await prisma.question.count();
        console.log('Total questions in database:', count);
        
        if (count > 0) {
            const sample = await prisma.question.findMany({ take: 3 });
            console.log('\nSample questions:');
            sample.forEach(q => {
                console.log(`- [${q.category}] ${q.text.substring(0, 50)}...`);
            });
        }
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkQuestions();
