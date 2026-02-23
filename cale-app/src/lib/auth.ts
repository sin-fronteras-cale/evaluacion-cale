import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme-in-production';
const JWT_EXPIRES_IN = 7 * 24 * 60 * 60 * 1000; // 7 days

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  idType?: string | null;
  idNumber?: string | null;
  city?: string | null;
  department?: string | null;
  isPro: boolean;
  proExpiresAt?: Date | null;
  companyTag?: string | null;
};

type JWTPayload = {
  userId: string;
  exp: number;
};

// Simple JWT implementation
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString();
}

export function createToken(userId: string): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload: JWTPayload = {
    userId,
    exp: Date.now() + JWT_EXPIRES_IN
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;

    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    if (signature !== expectedSignature) return null;

    const payload: JWTPayload = JSON.parse(base64UrlDecode(encodedPayload));

    if (payload.exp < Date.now()) return null;

    return payload.userId;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: NextRequest | Request): string | null {
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map(c => c.trim());
  const authCookie = cookies.find(c => c.startsWith('auth_token='));

  if (!authCookie) return null;

  return authCookie.split('=')[1];
}

export async function getCurrentUser(req: NextRequest | Request): Promise<SafeUser | null> {
  const token = getTokenFromRequest(req);
  if (!token) return null;

  const userId = verifyToken(token);
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      idType: true,
      idNumber: true,
      city: true,
      department: true,
      isPro: true,
      proExpiresAt: true,
      companyTag: true
    }
  });

  return user;
}

export async function requireAuth(req: NextRequest | Request): Promise<SafeUser | NextResponse> {
  const user = await getCurrentUser(req);

  if (!user) {
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 }
    );
  }

  return user;
}

export async function requireAdmin(req: NextRequest | Request): Promise<SafeUser | NextResponse> {
  const user = await getCurrentUser(req);

  if (!user) {
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 }
    );
  }

  if (user.role !== 'admin') {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 403 }
    );
  }

  return user;
}

export async function requireAnyAdmin(req: NextRequest | Request): Promise<SafeUser | NextResponse> {
  const user = await getCurrentUser(req);

  if (!user) {
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 }
    );
  }

  if (user.role !== 'admin' && user.role !== 'admin_supertaxis') {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 403 }
    );
  }

  return user;
}

export function createAuthResponse(user: SafeUser, token: string): NextResponse {
  const response = NextResponse.json({
    success: true,
    user
  });

  // Set HTTP-only cookie
  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: JWT_EXPIRES_IN / 1000,
    path: '/'
  });

  return response;
}

export function clearAuthResponse(): NextResponse {
  const response = NextResponse.json({ success: true });

  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  });

  return response;
}

export function sanitizeUser(user: any): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || undefined,
    idType: user.idType || undefined,
    idNumber: user.idNumber || undefined,
    city: user.city || undefined,
    department: user.department || undefined,
    isPro: user.isPro || false,
    proExpiresAt: user.proExpiresAt || undefined,
    companyTag: user.companyTag || undefined
  };
}
