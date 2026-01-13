import { bucket } from '@/lib/firebaseAdmin';
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';

const prisma = new PrismaClient();

/* =========================
   GET - Listar mensagens
   ========================= */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    try {
        const messages = await prisma.templateMessage.findMany({
            where: { templateId: id },
            orderBy: { createdAt: 'asc' },
        });

        return NextResponse.json({ status: true, messages });
    } catch (error) {
        console.error('Erro ao buscar mensagens:', error);
        return NextResponse.json(
            { status: false, error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

/* =========================
   POST - Criar mensagem (texto ou mídia)
   ========================= */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;

    try {
        const contentType = request.headers.get('content-type') || '';

        // 🔹 Upload de arquivo (multipart/form-data)
        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            const file = formData.get('file') as File;
            const { searchParams } = new URL(request.url);
            const type =
                (formData.get('type') as string) ||
                searchParams.get('type') ||
                '';

            if (!file) {
                return NextResponse.json(
                    { status: false, error: 'Arquivo não enviado' },
                    { status: 400 }
                );
            }

            //   console.log("📂 Upload recebido:", {
            //     type,
            //     fileName: file.name,
            //     mimeType: file.type,
            //   });

            // 🔹 Upload para Firebase Storage via Admin SDK
            const fileBuffer = Buffer.from(await file.arrayBuffer());
            const fileName = `${uuid()}-${file.name}`;
            const fileUpload = bucket.file(`templates/${id}/${fileName}`);

            await fileUpload.save(fileBuffer, {
                metadata: { contentType: file.type },
                public: true,
                resumable: false,
            });

            const fileUrl = `https://storage.googleapis.com/${bucket.name}/templates/${id}/${fileName}`;

            // 🔹 Mapeia tipo para campo certo
            const fieldMap: Record<string, string> = {
                image: 'imageUrl',
                video: 'videoUrl',
                audio: 'audioUrl',
                document: 'documentUrl',
            };

            const fieldName = fieldMap[type];
            console.log(fieldName, 'FN');
            if (!fieldName) {
                console.error('❌ Tipo inválido recebido:', type);
                return NextResponse.json(
                    { status: false, error: 'Tipo inválido' },
                    { status: 400 }
                );
            }

            const dataToSave: any = {
                templateId: id,
                text: null,
                [fieldName]: fileUrl,
            };

            // console.log('💾 Salvando TemplateMessage:', dataToSave);

            const message = await prisma.templateMessage.create({
                data: dataToSave,
            });

            return NextResponse.json({ status: true, message });
        }

        // 🔹 Mensagem de texto (application/json)
        const { text } = await request.json();
        if (!text) {
            return NextResponse.json(
                { status: false, error: "Campo 'text' é obrigatório" },
                { status: 400 }
            );
        }

        const message = await prisma.templateMessage.create({
            data: { text, templateId: id },
        });

        return NextResponse.json({
            status: true,
            message,
            successMessage: 'Mensagem criada com sucesso',
        });
    } catch (error: any) {
        console.error('❌ Erro ao criar mensagem:', error);
        return NextResponse.json(
            {
                status: false,
                error: error.message || 'Erro interno do servidor',
            },
            { status: 500 }
        );
    }
}

/* =========================
   PUT - Atualizar mensagem
   ========================= */
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    try {
        const { messageId, text, audioUrl, imageUrl, documentUrl, videoUrl } =
            await request.json();

        if (!messageId) {
            return NextResponse.json(
                { status: false, error: 'messageId é obrigatório' },
                { status: 400 }
            );
        }

        const existing = await prisma.templateMessage.findFirst({
            where: { id: messageId, templateId: id },
        });

        if (!existing) {
            return NextResponse.json(
                { status: false, error: 'Mensagem não encontrada' },
                { status: 404 }
            );
        }

        const message = await prisma.templateMessage.update({
            where: { id: messageId },
            data: { text, audioUrl, imageUrl, videoUrl, documentUrl },
        });

        return NextResponse.json({
            status: true,
            message,
            successMessage: 'Mensagem atualizada com sucesso',
        });
    } catch (error) {
        console.error('Erro ao atualizar mensagem:', error);
        return NextResponse.json(
            { status: false, error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

/* =========================
   DELETE - Remover mensagem
   ========================= */
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    try {
        const messageId = new URL(request.url).searchParams.get('messageId');
        if (!messageId) {
            return NextResponse.json(
                { status: false, error: 'messageId é obrigatório' },
                { status: 400 }
            );
        }

        const existing = await prisma.templateMessage.findFirst({
            where: { id: messageId, templateId: id },
        });

        if (!existing) {
            return NextResponse.json(
                { status: false, error: 'Mensagem não encontrada' },
                { status: 404 }
            );
        }

        await prisma.templateMessage.delete({ where: { id: messageId } });

        return NextResponse.json({
            status: true,
            message: 'Mensagem deletada com sucesso',
        });
    } catch (error) {
        console.error('Erro ao deletar mensagem:', error);
        return NextResponse.json(
            { status: false, error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
