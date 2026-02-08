import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';

const TOKEN_TTL_MS = 1000 * 60 * 60;

const getAppUrl = (req: Request) => {
  const proto = req.headers.get('x-forwarded-proto') ?? 'https';
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  if (host) return `${proto}://${host}`;
  if (process.env.APP_URL) return process.env.APP_URL.trim().replace(/\/+$/, '');
  return 'http://localhost:3000';
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json({ success: true });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() }
    });

    await prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt
      }
    });

    const resetLink = `${getAppUrl(req)}/reset-password?token=${token}`;
    await sendPasswordResetEmail(user.email, resetLink);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error', error);
    return NextResponse.json({ error: 'No se pudo enviar el correo' }, { status: 500 });
  }
}
