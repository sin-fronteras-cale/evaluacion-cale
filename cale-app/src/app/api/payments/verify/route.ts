import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing transaction ID' }, { status: 400 });
    }

    try {
        // Verify with Wompi (Sandbox for pub_test keys)
        const response = await fetch(`https://sandbox.wompi.co/v1/transactions/${id}`);
        const data = await response.json();

        if (data.data && data.data.status === 'APPROVED') {
            const reference = data.data.reference;
            // Reference format: PRO-userId-timestamp
            const userId = reference.split('-')[1];

            if (userId) {
                const proExpiresAt = new Date();
                proExpiresAt.setDate(proExpiresAt.getDate() + 120);

                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        isPro: true,
                        proExpiresAt: proExpiresAt
                    }
                });
                return NextResponse.json({ success: true, status: 'APPROVED' });
            }
        }

        return NextResponse.json({ success: false, status: data.data?.status || 'UNKNOWN' });
    } catch (e) {
        console.error('Wompi Verification Error:', e);
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
    }
}
