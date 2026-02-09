import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, sanitizeUser } from '@/lib/auth';
import { validateEmail } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const currentUser = authResult;

    try {
        const user = await prisma.user.findUnique({
            where: { id: currentUser.id },
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
                policyAcceptedAt: true
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        return NextResponse.json({ user: sanitizeUser(user) });
    } catch (e) {
        console.error('Profile GET error:', e);
        return NextResponse.json({ error: 'Error al cargar perfil' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const currentUser = authResult;

    try {
        const body = await req.json();

        // Validation
        if (!body.name || !body.email) {
            return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
        }

        if (!validateEmail(body.email)) {
            return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
        }

        // Check if email is already taken by another user
        if (body.email !== currentUser.email) {
            const existingUser = await prisma.user.findUnique({
                where: { email: body.email }
            });

            if (existingUser && existingUser.id !== currentUser.id) {
                return NextResponse.json({ error: 'El email ya está en uso' }, { status: 400 });
            }
        }

        // Update only profile fields, not role or password
        const updatedUser = await prisma.user.update({
            where: { id: currentUser.id },
            data: {
                name: body.name,
                email: body.email,
                phone: body.phone || null,
                idType: body.idType || null,
                idNumber: body.idNumber || null,
                city: body.city || null,
                department: body.department || null
            },
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
                policyAcceptedAt: true
            }
        });

        return NextResponse.json({ success: true, user: sanitizeUser(updatedUser) });
    } catch (e: any) {
        console.error('Profile POST error:', e);
        if (e.code === 'P2002') {
            return NextResponse.json({ error: 'El email ya está en uso' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Error al actualizar perfil' }, { status: 500 });
    }
}
