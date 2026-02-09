const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testApiQuery() {
    try {
        console.log('Testing the same query that the API uses...\n');
        
        const questions = await prisma.question.findMany({
            where: {},
            orderBy: { category: 'asc' }
        });
        
        console.log('Total questions found:', questions.length);
        
        if (questions.length > 0) {
            console.log('\nFirst question structure:');
            console.log(JSON.stringify(questions[0], null, 2));
            
            console.log('\nType of options field:', typeof questions[0].options);
            console.log('Is options an array?', Array.isArray(questions[0].options));
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testApiQuery();
