import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { promises as fs } from 'fs';
import path from 'path';
import { Question } from '@/lib/data';

export const dynamic = 'force-dynamic';

const loadSeedQuestions = async (): Promise<Question[]> => {
    try {
        const filePath = path.join(process.cwd(), 'data', 'questions.json');
        const raw = await fs.readFile(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error('Failed to load seed questions', e);
        return [];
    }
};

export async function GET() {
    try {
        const questions = await prisma.question.findMany();
        if (questions.length === 0) {
            const fallbackQuestions = await loadSeedQuestions();
            if (fallbackQuestions.length > 0) return NextResponse.json(fallbackQuestions);
        }

        return NextResponse.json(questions);
    } catch (e) {
        console.error(e);
        const fallbackQuestions = await loadSeedQuestions();
        if (fallbackQuestions.length > 0) return NextResponse.json(fallbackQuestions);
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
