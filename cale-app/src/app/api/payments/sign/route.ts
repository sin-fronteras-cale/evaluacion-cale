import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const INTEGRITY_SECRET = (process.env.WOMPI_INTEGRITY_SECRET || '').trim();

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');
    const amountInCents = searchParams.get('amountInCents');
    const currency = searchParams.get('currency') || 'COP';

    if (!reference || !amountInCents) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    try {
        if (!INTEGRITY_SECRET) {
            return NextResponse.json({ error: 'Missing integrity secret' }, { status: 500 });
        }
        const normalizedAmount = Math.round(Number(amountInCents));
        if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }
        // Integrity formula: SHA256(reference + amountInCents + currency + secret)
        const chain = `${reference}${normalizedAmount}${currency}${INTEGRITY_SECRET}`;
        const signature = crypto.createHash('sha256').update(chain).digest('hex');

        return NextResponse.json({ signature });
    } catch (e) {
        console.error('Signing Error:', e);
        return NextResponse.json({ error: 'Failed to sign' }, { status: 500 });
    }
}
