import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;

    try {
        const payment = await prisma.payment.findUnique({
            where: { id }
        });

        if (!payment) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }

        return NextResponse.json(payment);
    } catch (e) {
        console.error('Payment detail error:', e);
        return NextResponse.json({ error: 'Failed to load payment' }, { status: 500 });
    }
}
