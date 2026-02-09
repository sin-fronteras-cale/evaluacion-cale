import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { promises as fs } from 'fs';
import path from 'path';
import { User } from '@/lib/data';

export const dynamic = 'force-dynamic';

const loadSeedUsers = async (): Promise<User[]> => {
    try {
        const filePath = path.join(process.cwd(), 'data', 'users.json');
        const raw = await fs.readFile(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error('Failed to load seed users', e);
        return [];
    }
};

export async function GET() {
    try {
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

        const users = await prisma.user.findMany();
        if (users.length === 0) {
            const fallbackUsers = await loadSeedUsers();
            if (fallbackUsers.length > 0) return NextResponse.json(fallbackUsers);
        }

        return NextResponse.json(users);
    } catch (e) {
        console.error(e);
        const fallbackUsers = await loadSeedUsers();
        if (fallbackUsers.length > 0) return NextResponse.json(fallbackUsers);
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
                isPro: body.isPro
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
                isPro: body.isPro
            }
        });

        return NextResponse.json({ success: true, user });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}
