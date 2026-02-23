import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { parsePaginationParams } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const currentUser = authResult;

    try {
        const { searchParams } = new URL(req.url);
        const { limit, skip } = parsePaginationParams(searchParams);

        // Admin can see all, admin_supertaxis sees company results, regular users only their own
        let whereClause: any = {};
        if (currentUser.role === 'admin' || currentUser.role === 'admin_supertaxis') {
            whereClause = {};
        } else {
            whereClause = { userId: currentUser.id };
        }

        const [results, total] = await Promise.all([
            prisma.result.findMany({
                where: whereClause,
                take: limit,
                skip,
                orderBy: { date: 'desc' },
                include: {
                    user: { select: { name: true } },
                    evaluation: { select: { name: true } }
                }
            }),
            prisma.result.count({ where: whereClause })
        ]);

        const mappedResults = results.map(r => ({
            ...r,
            userName: r.user?.name || r.userName
        }));

        return NextResponse.json({ results: mappedResults, total, limit, skip });
    } catch (e) {
        console.error('Results GET error:', e);
        return NextResponse.json({ error: 'Error al cargar resultados' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const currentUser = authResult;

    try {
        const result = await req.json();

        // Ensure user can only create results for themselves, or is an admin
        const isAdmin = currentUser.role === 'admin' || currentUser.role === 'admin_supertaxis';
        if (result.userId !== currentUser.id && !isAdmin) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        if (!result.category || !result.score || !result.totalQuestions) {
            return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
        }

        const isStandard = ['A2', 'B1', 'C1'].includes(result.category);

        const savedResult = await prisma.result.create({
            data: {
                id: result.id,
                userId: result.userId,
                userName: result.userName,
                category: result.category,
                evaluationId: !isStandard ? result.category : null,
                date: new Date(result.date),
                score: result.score,
                totalQuestions: result.totalQuestions,
                failedQuestions: result.failedQuestions || []
            }
        });

        return NextResponse.json({ success: true, result: savedResult });
    } catch (e: any) {
        console.error('Results POST error:', e);
        return NextResponse.json({ error: 'Error al guardar resultado' }, { status: 500 });
    }
}
