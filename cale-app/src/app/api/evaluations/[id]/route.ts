import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAnyAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const user = await getCurrentUser(req);
        const evaluation = await prisma.evaluation.findUnique({
            where: { id },
            include: {
                questions: {
                    orderBy: { id: 'asc' }
                },
                _count: {
                    select: { questions: true }
                }
            }
        });

        if (!evaluation) {
            return NextResponse.json({ error: 'Evaluación no encontrada' }, { status: 404 });
        }

        // Check companyTag access if user is company admin
        if (user && user.role === 'admin_supertaxis' && evaluation.companyTag !== user.companyTag) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        return NextResponse.json({ evaluation });
    } catch (e: any) {
        console.error('Error fetching evaluation:', e);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const authResult = await requireAnyAdmin(req);
        if (authResult instanceof NextResponse) return authResult;
        const currentUser = authResult;

        const body = await req.json();
        const { name, description, durationMinutes, questionCount, isActive, companyTag } = body;

        // Check access
        const existing = await prisma.evaluation.findUnique({ where: { id } });
        if (existing && currentUser.role === 'admin_supertaxis' && existing.companyTag !== currentUser.companyTag) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const evaluation = await prisma.evaluation.update({
            where: { id },
            data: {
                name,
                description,
                durationMinutes,
                questionCount,
                isActive,
                companyTag: currentUser.role === 'admin_supertaxis' ? currentUser.companyTag : companyTag
            }
        });

        return NextResponse.json({ evaluation });
    } catch (e: any) {
        console.error('Error updating evaluation:', e);
        return NextResponse.json({ error: 'Error al actualizar', details: e?.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const authResult = await requireAnyAdmin(req);
        if (authResult instanceof NextResponse) return authResult;
        const currentUser = authResult;

        // Check access
        const existing = await prisma.evaluation.findUnique({ where: { id } });
        if (existing && currentUser.role === 'admin_supertaxis' && existing.companyTag !== currentUser.companyTag) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        console.log(`Attempting to delete evaluation: ${id}`);

        // Explicitly delete questions first as a fallback for potential DB constraint issues
        await prisma.question.deleteMany({
            where: { evaluationId: id }
        });

        // Some questions might have the evaluation ID as category without evaluationId link
        await prisma.question.deleteMany({
            where: { category: id }
        });

        await prisma.evaluation.delete({
            where: { id }
        });

        console.log(`Successfully deleted evaluation: ${id}`);
        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error('Error deleting evaluation:', e);
        return NextResponse.json({
            error: 'Error al eliminar evaluación',
            details: e?.message,
            code: e?.code
        }, { status: 500 });
    }
}
