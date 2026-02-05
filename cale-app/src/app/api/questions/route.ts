import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const questions = await prisma.question.findMany();
        return NextResponse.json(questions);
    } catch (e) {
        console.error(e);
        return NextResponse.json([], { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (body.action === 'delete') {
            await prisma.question.delete({
                where: { id: body.id }
            });
            return NextResponse.json({ success: true });
        }

        const question = await prisma.question.upsert({
            where: { id: body.id },
            update: {
                category: body.category,
                text: body.text,
                options: body.options,
                correctAnswer: body.correctAnswer
            },
            create: {
                id: body.id,
                category: body.category,
                text: body.text,
                options: body.options,
                correctAnswer: body.correctAnswer
            }
        });

        return NextResponse.json({ success: true, question });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
    }
}
