import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireAuth, requireAnyAdmin } from '@/lib/auth';
import { validateCategory, parsePaginationParams } from '@/lib/validation';
import { Question } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');

        let whereClause: any = category && validateCategory(category)
            ? { category }
            : {};

        if (authResult.role === 'admin_supertaxis') {
            whereClause = {
                evaluation: {
                    companyTag: authResult.companyTag
                }
            };
        }

        const questions = await prisma.question.findMany({
            where: whereClause,
            orderBy: { category: 'asc' }
        });

        return NextResponse.json({ questions });
    } catch (e) {
        console.error('Questions GET error:', e);
        return NextResponse.json({ error: 'Error al cargar preguntas' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const authResult = await requireAnyAdmin(req);
    if (authResult instanceof NextResponse) return authResult;

    try {
        const body = await req.json();

        if (body.action === 'delete') {
            if (!body.id) {
                return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
            }
            await prisma.question.delete({
                where: { id: body.id }
            });
            return NextResponse.json({ success: true });
        }

        // Validation
        if (!body.category || !body.text || !body.options || !Array.isArray(body.options)) {
            return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
        }

        if (!validateCategory(body.category)) {
            return NextResponse.json({ error: 'Categoría inválida' }, { status: 400 });
        }

        if (typeof body.correctAnswer !== 'number' || body.correctAnswer < 0 || body.correctAnswer >= body.options.length) {
            return NextResponse.json({ error: 'Respuesta correcta inválida' }, { status: 400 });
        }

        const question = await prisma.question.upsert({
            where: { id: body.id },
            update: {
                category: body.category,
                text: body.text,
                options: body.options,
                correctAnswer: body.correctAnswer
            },
            create: {
                id: body.id,
                category: body.category,
                text: body.text,
                options: body.options,
                correctAnswer: body.correctAnswer
            }
        });

        return NextResponse.json({ success: true, question });
    } catch (e: any) {
        console.error('Questions POST error:', e);
        return NextResponse.json({ error: 'Error al actualizar pregunta' }, { status: 500 });
    }
}
