import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAnyAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser(req);

        const where: any = {};
        if (user) {
            if (user.role === 'supertaxis') {
                where.companyTag = user.companyTag;
            } else if (user.role === 'admin_supertaxis') {
                where.companyTag = user.companyTag;
            }
        }

        const evaluations = await prisma.evaluation.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { questions: true }
                }
            }
        });
        return NextResponse.json({ evaluations });
    } catch (e: any) {
        console.error('Error fetching evaluations:', e);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const authResult = await requireAnyAdmin(req);
        if (authResult instanceof NextResponse) return authResult;
        const currentUser = authResult;

        const body = await req.json();
        const { name, description, durationMinutes, questionCount } = body;

        if (!name || typeof durationMinutes !== 'number' || typeof questionCount !== 'number') {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const evaluation = await prisma.evaluation.create({
            data: {
                name,
                description,
                durationMinutes,
                questionCount,
                isActive: true,
                companyTag: currentUser.role === 'admin_supertaxis' ? currentUser.companyTag : body.companyTag
            }
        });

        return NextResponse.json({ evaluation });
    } catch (e: any) {
        console.error('Error creating evaluation:', e);
        return NextResponse.json({ error: 'Error al crear la evaluación', details: e?.message }, { status: 500 });
    }
}
