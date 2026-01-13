import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// GET contatos de um segmento
export async function GET(
    _: Request,
    { params }: { params: Promise<{ id: string }> } // 👈 params é Promise
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
        return NextResponse.json(
            { status: false, error: 'Não autenticado' },
            { status: 401 }
        );
    }

    const { id } = await params; // 👈 agora funciona

    const contacts = await prisma.segmentContact.findMany({
        where: { segmentId: id },
    });

    return NextResponse.json({ status: true, contacts });
}

// POST - adicionar contatos em massa
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> } // 👈 mesma lógica
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
        return NextResponse.json(
            { status: false, error: 'Não autenticado' },
            { status: 401 }
        );
    }

    const { id } = await params;

    const data = await req.json();

    const created = await prisma.segmentContact.createMany({
        data: data.map((c: any) => ({
            segmentId: id,
            name: c.name,
            phone: c.phone,
            email: c.email,
            empresa: c.empresa,
            extraData: c.extraData || {},
        })),
    });

    return NextResponse.json({ status: true, count: created.count });
}
