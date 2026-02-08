import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit') || 200);

    try {
        const payments = await prisma.payment.findMany({
            orderBy: { createdAt: 'desc' },
            take: Math.min(Math.max(limit, 1), 500)
        });

        return NextResponse.json(payments);
    } catch (e) {
        console.error('Payments list error:', e);
        return NextResponse.json({ error: 'Failed to load payments' }, { status: 500 });
    }
}
