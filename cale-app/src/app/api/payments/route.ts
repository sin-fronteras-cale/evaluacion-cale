import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit') || 200);
    const userId = searchParams.get('userId');

    try {
        const where = userId ? { userId } : {};
        const payments = await prisma.payment.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: Math.min(Math.max(limit, 1), 500)
        });

        return NextResponse.json({ payments });
    } catch (e) {
        console.error('Payments list error:', e);
        return NextResponse.json({ error: 'Failed to load payments' }, { status: 500 });
    }
}
