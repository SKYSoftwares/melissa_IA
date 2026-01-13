import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// GET - Listar todos os templates
export async function GET() {
    const session = await getServerSession().catch(() => null);
    console.log(session);
    const user = await prisma.team.findUnique({
        where: { email: session?.user?.email ?? '' },
        select: { id: true },
    });
    console.log(user);

    try {
        const templates = await prisma.template.findMany({
            where: {
                userId: user?.id,
                deletedAt: null,
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
                campaings: {
                    include: {
                        campaing: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({
            status: true,
            templates,
        });
    } catch (error) {
        console.error('Erro ao buscar templates:', error);
        return NextResponse.json(
            {
                status: false,
                error: 'Erro interno do servidor',
            },
            { status: 500 }
        );
    }
}

// POST - Criar novo template
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession().catch(() => null);
        // console.log(session);
        const user = await prisma.team.findFirst({
            where: { email: session?.user.email ?? '' },
            select: { id: true },
        });
        const { name, messages } = await request.json();

        if (!name) {
            return NextResponse.json(
                {
                    status: false,
                    error: 'name é obrigatório',
                },
                { status: 400 }
            );
        }

        // Criar template
        const template = await prisma.template.create({
            data: {
                name,
                userId: user?.id,
            },
        });

        // Se foram fornecidas mensagens, criar as mensagens do template
        if (messages && messages.length > 0) {
            const templateMessages = messages.map((message: any) => ({
                text: message.text,
                audioUrl: message.audioUrl,
                imageUrl: message.imageUrl,
                documentUrl: message.documentUrl,
                templateId: template.id,
            }));

            await prisma.templateMessage.createMany({
                data: templateMessages,
            });
        }

        // Buscar template com mensagens
        const templateWithMessages = await prisma.template.findUnique({
            where: { id: template.id },
            include: {
                messages: {
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
            },
        });

        return NextResponse.json({
            status: true,
            template: templateWithMessages,
            message: 'Template criado com sucesso',
        });
    } catch (error) {
        console.error('Erro ao criar template:', error);
        return NextResponse.json(
            {
                status: false,
                error: 'Erro interno do servidor',
            },
            { status: 500 }
        );
    }
}

// PUT - Atualizar template
export async function PUT(request: NextRequest) {
    try {
        const { id, name, messages } = await request.json();

        if (!id) {
            return NextResponse.json(
                {
                    status: false,
                    error: 'id é obrigatório',
                },
                { status: 400 }
            );
        }

        // Atualizar template
        const template = await prisma.template.update({
            where: { id },
            data: {
                name,
            },
        });

        // Se foram fornecidas mensagens, atualizar as mensagens
        if (messages !== undefined) {
            // Remover todas as mensagens existentes
            await prisma.templateMessage.deleteMany({
                where: { templateId: id },
            });

            // Criar novas mensagens
            if (messages.length > 0) {
                const templateMessages = messages.map((message: any) => ({
                    text: message.text,
                    audioUrl: message.audioUrl,
                    imageUrl: message.imageUrl,
                    documentUrl: message.documentUrl,
                    templateId: id,
                }));

                await prisma.templateMessage.createMany({
                    data: templateMessages,
                });
            }
        }

        // Buscar template atualizado com mensagens
        const templateWithMessages = await prisma.template.findUnique({
            where: { id },
            include: {
                messages: {
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
            },
        });

        return NextResponse.json({
            status: true,
            template: templateWithMessages,
            message: 'Template atualizado com sucesso',
        });
    } catch (error) {
        console.error('Erro ao atualizar template:', error);
        return NextResponse.json(
            {
                status: false,
                error: 'Erro interno do servidor',
            },
            { status: 500 }
        );
    }
}

// DELETE - Deletar template
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                {
                    status: false,
                    error: 'id é obrigatório',
                },
                { status: 400 }
            );
        }

        await prisma.template.delete({
            where: { id },
        });

        return NextResponse.json({
            status: true,
            message: 'Template deletado com sucesso',
        });
    } catch (error) {
        console.error('Erro ao deletar template:', error);
        return NextResponse.json(
            {
                status: false,
                error: 'Erro interno do servidor',
            },
            { status: 500 }
        );
    }
}
