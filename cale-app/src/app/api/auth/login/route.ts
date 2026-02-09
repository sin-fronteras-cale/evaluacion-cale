import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { createToken, createAuthResponse, sanitizeUser } from '@/lib/auth';
import { validateEmail, validateRequired } from '@/lib/validation';

// Rate limit: 10 login attempts per 15 minutes per IP
const RATE_LIMIT = {
  windowMs: 15 * 60 * 1000,
  maxRequests: 10
};

export async function POST(req: Request) {
  try {
    // Rate limiting
    const clientIp = getClientIp(req);
    const rateLimitResult = checkRateLimit(`login:${clientIp}`, RATE_LIMIT);
    
    if (!rateLimitResult.success) {
      console.log('[login] Rate limit exceeded for IP:', clientIp);
      return NextResponse.json(
        { error: 'Demasiados intentos. Intenta de nuevo mas tarde.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    console.log('[login] Request body:', { email: body?.email, hasPassword: !!body?.password });
    
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    console.log('[login] Processed email:', email);
    console.log('[login] Email valid:', !!email);
    console.log('[login] Password valid:', !!password);

    if (!email || !password) {
      console.log('[login] Missing email or password');
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 });
    }

    if (!validateEmail(email)) {
      console.log('[login] Email validation failed:', email);
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    console.log('[login] Searching for user with email:', email);
    const user = await prisma.user.findUnique({
      where: { email }
    });

    console.log('[login] User found:', !!user);
    console.log('[login] User has password:', !!user?.password);

    if (!user || !user.password) {
      console.log('[login] User not found or no password');
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    // Support both hashed and legacy plain-text passwords
    let isValid = false;
    if (user.password.startsWith('$2')) {
      // bcrypt hash
      console.log('[login] Using bcrypt comparison');
      isValid = await bcrypt.compare(password, user.password);
      console.log('[login] bcrypt result:', isValid);
    } else {
      // Legacy plain-text (migrate on successful login)
      console.log('[login] Using plain text comparison');
      isValid = user.password === password;
      if (isValid) {
        const hashed = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashed }
        });
      }
    }

    if (!isValid) {
      console.log('[login] Password validation failed');
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    console.log('[login] Authentication successful for user:', user.id);
    // Create JWT token and set HTTP-only cookie
    const token = createToken(user.id);
    const safeUser = sanitizeUser(user);
    return createAuthResponse(safeUser, token);
  } catch (error) {
    console.error('[login] Exception:', error);
    return NextResponse.json({ error: 'Error al iniciar sesión' }, { status: 500 });
  }
}
