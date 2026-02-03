import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const users = await prisma.user.findMany();
        return NextResponse.json(users);
    } catch (e) {
        console.error(e);
        return NextResponse.json([], { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        if (body.action === 'delete') {
            await prisma.user.delete({
                where: { id: body.id }
            });
            return NextResponse.json({ success: true });
        }

        const user = await prisma.user.upsert({
            where: { id: body.id },
            update: {
                name: body.name,
                email: body.email,
                role: body.role,
                password: body.password || undefined,
                isPro: body.isPro
            },
            create: {
                id: body.id,
                name: body.name,
                email: body.email,
                role: body.role,
                password: body.password,
                isPro: body.isPro
            }
        });

        return NextResponse.json({ success: true, user });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}
