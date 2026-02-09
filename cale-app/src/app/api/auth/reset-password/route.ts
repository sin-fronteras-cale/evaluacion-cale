import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { validatePassword } from '@/lib/validation';

// Rate limit: 10 requests per 15 minutes per IP
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000,
  maxRequests: 10
};

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const clientIp = getClientIp(req);
    const rateLimitResult = checkRateLimit(`reset-password:${clientIp}`, RATE_LIMIT);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Intenta de nuevo mas tarde.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const token = typeof body?.token === 'string' ? body.token.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!token || !password) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.message }, { status: 400 });
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

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: record.userId },
      data: { password: hashedPassword }
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
