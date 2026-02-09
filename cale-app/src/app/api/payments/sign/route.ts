import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const INTEGRITY_SECRET = process.env.WOMPI_INTEGRITY_SECRET?.trim();

if (!INTEGRITY_SECRET) {
    throw new Error('WOMPI_INTEGRITY_SECRET debe estar configurado en las variables de entorno');
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const reference = searchParams.get('reference');
        const amountInCents = searchParams.get('amountInCents');
        const currency = searchParams.get('currency') || 'COP';

        if (!reference || !amountInCents) {
            return NextResponse.json({ error: 'Parámetros faltantes' }, { status: 400 });
        }

        const normalizedAmount = Math.round(Number(amountInCents));
        if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
            return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
        }
        
        // Integrity formula: SHA256(reference + amountInCents + currency + secret)
        const chain = `${reference}${normalizedAmount}${currency}${INTEGRITY_SECRET}`;
        const signature = crypto.createHash('sha256').update(chain).digest('hex');

        return NextResponse.json({ signature });
    } catch (e) {
        console.error('Signing Error:', e);
        return NextResponse.json({ error: 'Error al firmar' }, { status: 500 });
    }
}
