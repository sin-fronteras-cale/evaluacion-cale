import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const EVENTS_SECRET = process.env.WOMPI_EVENTS_SECRET || '';

const computeChecksum = (payload: string, secret: string) => {
    return crypto.createHash('sha256').update(payload + secret).digest('hex');
};

const parseTransaction = (payload: any) => {
    return payload?.data?.transaction || payload?.transaction || payload?.data || null;
};

export async function POST(req: Request) {
    const rawBody = await req.text();
    const checksumHeader = req.headers.get('x-event-checksum') || req.headers.get('x-wompi-signature') || '';

    if (EVENTS_SECRET) {
        const expected = computeChecksum(rawBody, EVENTS_SECRET);
        if (!checksumHeader || checksumHeader !== expected) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
    }

    let payload: any = null;
    try {
        payload = JSON.parse(rawBody);
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const transaction = parseTransaction(payload);
    if (!transaction) {
        return NextResponse.json({ error: 'Missing transaction' }, { status: 400 });
    }

    const reference = transaction.reference || '';
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
    }

    return NextResponse.json({ received: true });
}
