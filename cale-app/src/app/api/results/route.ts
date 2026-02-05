import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Include user details if needed, but for now just raw results
        const results = await prisma.result.findMany({
            include: { user: { select: { name: true } } }
        });

        // Map to match frontend expected interface if needed, or update frontend types.
        // Frontend expects: userId, userName. result.user.name gives userName.
        const mappedResults = results.map(r => ({
            ...r,
            userName: r.user?.name || r.userName // Use relation or fallback
        }));

        return NextResponse.json(mappedResults);
    } catch (e) {
        console.error(e);
        return NextResponse.json([], { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const result = await req.json();

        const savedResult = await prisma.result.create({
            data: {
                id: result.id,
                userId: result.userId,
                userName: result.userName,
                category: result.category,
                date: new Date(result.date),
                score: result.score,
                totalQuestions: result.totalQuestions,
                failedQuestions: result.failedQuestions || []
            }
        });

        return NextResponse.json({ success: true, result: savedResult });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to save result' }, { status: 500 });
    }
}
