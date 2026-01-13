// app/api/segments/[id]/import/route.ts
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> } // 👈 params é Promise
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
        return NextResponse.json(
            { status: false, error: 'Não autenticado' },
            { status: 401 }
        );
    }

    // 👇 agora a gente espera o params antes de usar
    const { id } = await params;

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
        return NextResponse.json(
            { status: false, error: 'Arquivo não enviado' },
            { status: 400 }
        );
    }

    try {
        // Validar se o segmento existe e pertence ao usuário
        const segment = await prisma.segment.findFirst({
            where: { id, userId: session.user.id },
        });

        if (!segment) {
            return NextResponse.json(
                { status: false, error: 'Segmento não encontrado' },
                { status: 404 }
            );
        }

        // Ler buffer do Excel
        const buffer = Buffer.from(await file.arrayBuffer());
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);

        // Inserir contatos
        const created = await prisma.segmentContact.createMany({
            data: rows.map((row) => ({
                segmentId: segment.id,
                name: row.Nome || null,
                phone: String(row.Telefone || '').replace(/\D/g, ''),
                email: row.Email || null,
                empresa: row.Empresa || null,
                extraData: row,
            })),
            skipDuplicates: true,
        });

        return NextResponse.json({ status: true, imported: created.count });
    } catch (error) {
        console.error('Erro ao importar Excel:', error);
        return NextResponse.json(
            { status: false, error: 'Erro interno' },
            { status: 500 }
        );
    }
}
