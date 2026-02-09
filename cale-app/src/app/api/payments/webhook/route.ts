import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const EVENTS_SECRET = process.env.WOMPI_EVENTS_SECRET;

if (!EVENTS_SECRET) {
    throw new Error('WOMPI_EVENTS_SECRET debe estar configurado en las variables de entorno');
}

type WompiTransaction = {
    id: string;
    reference: string;
    status: string;
    amount_in_cents: number;
    currency: string;
    payment_method_type?: string;
    customer_email?: string;
};

type WompiWebhookPayload = {
    event?: string;
    data?: {
        transaction?: WompiTransaction;
    };
    transaction?: WompiTransaction;
};

const computeChecksum = (payload: string, secret: string): string => {
    return crypto.createHash('sha256').update(payload + secret).digest('hex');
};

const parseTransaction = (payload: WompiWebhookPayload): WompiTransaction | null => {
    return payload?.data?.transaction || payload?.transaction || null;
};

export async function POST(req: Request) {
    try {
        // Verificar que el secret esté configurado
        if (!EVENTS_SECRET) {
            console.error('WOMPI_EVENTS_SECRET no está configurado');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const rawBody = await req.text();
        const checksumHeader = req.headers.get('x-event-checksum') || req.headers.get('x-wompi-signature') || '';

        const expected = computeChecksum(rawBody, EVENTS_SECRET);
        if (!checksumHeader || checksumHeader !== expected) {
            console.error('Webhook signature mismatch');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        let payload: WompiWebhookPayload;
        try {
            payload = JSON.parse(rawBody);
        } catch (e) {
            console.error('Invalid JSON in webhook payload:', e);
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        const transaction = parseTransaction(payload);
        if (!transaction || !transaction.id) {
            console.error('Missing transaction in webhook payload');
            return NextResponse.json({ error: 'Missing transaction' }, { status: 400 });
        }

        const reference = transaction.reference || '';
        const userId = reference.split('-')[1] || null;
        
        let user = null;
        if (userId) {
            user = await prisma.user.findUnique({ where: { id: userId } });
        }

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
                raw: transaction as any
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
                raw: transaction as any
            }
        });

        if (transaction.status === 'APPROVED' && user) {
            const proExpiresAt = new Date();
            proExpiresAt.setDate(proExpiresAt.getDate() + 120);

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    isPro: true,
                    proExpiresAt: proExpiresAt
                }
            });
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook processing error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
