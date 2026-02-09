import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { validateEmail } from '@/lib/validation';
import { sanitizeUser, createToken, createAuthResponse } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    // Apply rate limiting
    const clientIp = getClientIp(req);
    const rateLimitResult = checkRateLimit(`register:${clientIp}`, {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5 // Max 5 registrations per 15 minutes per IP
    });

    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: 'Demasiados intentos. Por favor intenta más tarde.' },
            { 
                status: 429,
                headers: {
                    'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
                    'X-RateLimit-Reset': new Date(rateLimitResult.resetAt).toISOString()
                }
            }
        );
    }

    try {
        const body = await req.json();
        const { name, email, password, phone, idType, idNumber, city, department, policyAcceptedAt } = body;

        // Validation
        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
        }

        if (!validateEmail(email)) {
            return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
        }

        if (!policyAcceptedAt) {
            return NextResponse.json({ error: 'Debes aceptar la política de tratamiento de datos' }, { status: 400 });
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'El correo ya está registrado' }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'user',
                phone: phone || null,
                idType: idType || null,
                idNumber: idNumber || null,
                city: city || null,
                department: department || null,
                policyAcceptedAt: policyAcceptedAt ? new Date(policyAcceptedAt) : new Date(),
                isPro: false
            }
        });

        // Create session token
        const token = createToken(user.id);
        const safeUser = sanitizeUser(user);

        return createAuthResponse(safeUser, token);
    } catch (e: any) {
        console.error('Register error:', e);
        if (e.code === 'P2002') {
            return NextResponse.json({ error: 'El email ya está en uso' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Error al registrar usuario' }, { status: 500 });
    }
}
