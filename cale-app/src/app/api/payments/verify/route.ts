import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
const WOMPI_BASE_URL = process.env.WOMPI_BASE_URL || 'https://production.wompi.co/v1';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing transaction ID' }, { status: 400 });
    }

    try {
        // Verify with Wompi (Sandbox for pub_test keys)
        const response = await fetch(`${WOMPI_BASE_URL}/transactions/${id}`);
        const data = await response.json();

        const transaction = data.data;
        if (!transaction) {
            return NextResponse.json({ success: false, status: 'UNKNOWN' });
        }

        const reference = transaction.reference || '';
        // Reference format: PRO-userId-timestamp
        const userId = reference.split('-')[1];
        const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;

        await prisma.payment.upsert({
            where: { transactionId: transaction.id },
            update: {
                reference,
                status: transaction.status || 'UNKNOWN',
                amountInCents: transaction.amount_in_cents || 0,
                currency: transaction.currency || 'COP',
                paymentMethodType: transaction.payment_method_type || null,
                customerEmail: transaction.customer_email || null,
                userId: user?.id || null,
                userName: user?.name || null,
                raw: transaction
            },
            create: {
                transactionId: transaction.id,
                reference,
                status: transaction.status || 'UNKNOWN',
                amountInCents: transaction.amount_in_cents || 0,
                currency: transaction.currency || 'COP',
                paymentMethodType: transaction.payment_method_type || null,
                customerEmail: transaction.customer_email || null,
                userId: user?.id || null,
                userName: user?.name || null,
                raw: transaction
            }
        });

        if (transaction.status === 'APPROVED' && userId) {
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

        return NextResponse.json({ success: false, status: transaction.status || 'UNKNOWN' });
    } catch (e) {
        console.error('Wompi Verification Error:', e);
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
    }
}
