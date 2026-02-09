import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { requireAuth } from '@/lib/auth';
import { validatePassword } from '@/lib/validation';

// Rate limit: 5 attempts per time window per IP
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000,
  maxRequests: 5
};

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;
  const currentUser = authResult;

  try {
    const clientIp = getClientIp(req);
    const rateLimitResult = checkRateLimit(`change-pw:${clientIp}`, RATE_LIMIT);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Intenta de nuevo mas tarde.' },
        { status: 429 }
      );
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.message }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id }
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Verify current (old) password
    let isMatch = false;
    if (user.password.startsWith('$2')) {
        isMatch = await bcrypt.compare(currentPassword, user.password);
    } else {
        // Legacy plain text check
        isMatch = user.password === currentPassword;
    }

    if (!isMatch) {
      return NextResponse.json({ error: 'La contraseña actual es incorrecta' }, { status: 401 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: currentUser.id },
      data: { password: hashedPassword }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
