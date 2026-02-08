const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const id = process.env.QUESTION_ID || '';

const main = async () => {
  if (!id) {
    console.error('Missing QUESTION_ID');
    process.exit(1);
  }

  const q = await prisma.question.findUnique({ where: { id } });
  const text = (q && q.text) ? q.text : '';
  const preview = text.slice(0, 80);
  console.log(`DB text preview: ${preview}`);
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
