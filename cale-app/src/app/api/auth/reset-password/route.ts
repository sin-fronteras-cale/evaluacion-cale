import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = typeof body?.token === 'string' ? body.token.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!token || !password || password.length < 6) {
      return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const now = new Date();

    const record = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: now }
      }
    });

    if (!record) {
      return NextResponse.json({ error: 'Token invalido o vencido' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: record.userId },
      data: { password }
    });

    await prisma.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null },
      data: { usedAt: now }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset password error', error);
    return NextResponse.json({ error: 'No se pudo restablecer' }, { status: 500 });
  }
}
