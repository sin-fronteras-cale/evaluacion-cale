import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const DEFAULTS: Record<string, number> = {
    pro_price_cop: 20000
};

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const key = searchParams.get('key');

        if (key) {
            const setting = await prisma.appSetting.findUnique({ where: { key } });
            const valueInt = setting?.valueInt ?? DEFAULTS[key];
            if (typeof valueInt !== 'number') {
                return NextResponse.json({ key, valueInt: null }, { status: 404 });
            }
            return NextResponse.json({ key, valueInt });
        }

        const settings = await prisma.appSetting.findMany();
        return NextResponse.json(settings);
    } catch (e) {
        console.error('Settings GET error:', e);
        return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const authResult = await requireAdmin(req);
    if (authResult instanceof NextResponse) return authResult;

    try {
        const body = await req.json();
        const key = typeof body?.key === 'string' ? body.key.trim() : '';
        const valueInt = Number(body?.valueInt);

        if (!key || !Number.isFinite(valueInt) || valueInt <= 0) {
            return NextResponse.json({ error: 'Invalid setting payload' }, { status: 400 });
        }

        const setting = await prisma.appSetting.upsert({
            where: { key },
            update: { valueInt },
            create: { key, valueInt }
        });

        return NextResponse.json({ success: true, setting });
    } catch (e) {
        console.error('Settings POST error:', e);
        return NextResponse.json({ error: 'Failed to save setting' }, { status: 500 });
    }
}
