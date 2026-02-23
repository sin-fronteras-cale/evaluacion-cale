import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireAnyAdmin, sanitizeUser } from '@/lib/auth';
import { validateEmail, validateRole, parsePaginationParams } from '@/lib/validation';
import { User } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const authResult = await requireAnyAdmin(req);
    if (authResult instanceof NextResponse) return authResult;
    const currentUser = authResult;

    try {
        const { searchParams } = new URL(req.url);
        const { limit, skip } = parsePaginationParams(searchParams);

        const now = new Date();

        // Update users whose Pro status has expired
        await prisma.user.updateMany({
            where: {
                isPro: true,
                proExpiresAt: {
                    lt: now
                }
            },
            data: {
                isPro: false
            }
        });

        // Filter by companyTag if admin_supertaxis
        const where: any = {};
        if (currentUser.role === 'admin_supertaxis') {
            where.companyTag = currentUser.companyTag;
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                take: limit,
                skip,
                orderBy: { name: 'asc' },
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
                    policyAcceptedAt: true,
                    companyTag: true
                }
            }),
            prisma.user.count({ where })
        ]);

        return NextResponse.json({ users, total, limit, skip });
    } catch (e) {
        console.error('Users GET error:', e);
        return NextResponse.json({ error: 'Error al cargar usuarios' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const authResult = await requireAnyAdmin(req);
    if (authResult instanceof NextResponse) return authResult;
    const currentUser = authResult;

    try {
        const body = await req.json();

        if (body.action === 'delete') {
            if (!body.id) {
                return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
            }
            await prisma.user.delete({
                where: { id: body.id }
            });
            return NextResponse.json({ success: true });
        }

        // Validation
        if (!body.name || !body.email || !body.role) {
            return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
        }

        if (!validateEmail(body.email)) {
            return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
        }

        if (!validateRole(body.role)) {
            return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
        }

        // Hash password if provided and not already hashed
        let hashedPassword: string | undefined = undefined;
        if (body.password) {
            if (body.password.startsWith('$2')) {
                // Already hashed
                hashedPassword = body.password;
            } else {
                hashedPassword = await bcrypt.hash(body.password, 10);
            }
        }

        const user = await prisma.user.upsert({
            where: { id: body.id },
            update: {
                name: body.name,
                email: body.email,
                role: body.role,
                password: hashedPassword,
                phone: body.phone,
                idType: body.idType,
                idNumber: body.idNumber,
                city: body.city,
                department: body.department,
                policyAcceptedAt: body.policyAcceptedAt ? new Date(body.policyAcceptedAt) : undefined,
                isPro: body.isPro,
                companyTag: currentUser.role === 'admin_supertaxis' ? currentUser.companyTag : body.companyTag
            },
            create: {
                id: body.id,
                name: body.name,
                email: body.email,
                role: body.role,
                password: hashedPassword,
                phone: body.phone,
                idType: body.idType,
                idNumber: body.idNumber,
                city: body.city,
                department: body.department,
                policyAcceptedAt: body.policyAcceptedAt ? new Date(body.policyAcceptedAt) : undefined,
                isPro: body.isPro,
                companyTag: currentUser.role === 'admin_supertaxis' ? currentUser.companyTag : body.companyTag
            }
        });

        const safeUser = sanitizeUser(user);
        return NextResponse.json({ success: true, user: safeUser });
    } catch (e: any) {
        console.error('Users POST error:', e);
        if (e.code === 'P2002') {
            return NextResponse.json({ error: 'El email ya está en uso' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
    }
}
