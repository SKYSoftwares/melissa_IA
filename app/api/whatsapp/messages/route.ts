import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        const userId = session.user.id;
        const { searchParams } = new URL(request.url);
        const chatId = searchParams.get('chatId');
        const showArchived = searchParams.get('showArchived') === 'true';

        if (!chatId) {
            return NextResponse.json(
                { error: 'ID do chat é obrigatório' },
                { status: 400 }
            );
        }

        // console.log("📨 [whatsapp/messages] Buscando mensagens:", {
        //   chatId,
        //   showArchived,
        // });

        // Buscar a última mensagem desse chat para descobrir o contato
        // Usamos a última (desc) pois é mais provável que ela tenha o contactId correto
        const lastMsg = await prisma.whatsAppMessage.findFirst({
            where: {
                chatId,
                session: {
                    userId // Segurança: garante que o chat pertence ao usuário
                }
            },
            include: {
                contact: {
                    include: {
                        session: {
                            select: {
                                sessionName: true,
                                connectionStatus: true,
                            },
                        },
                    },
                },
                session: {
                    select: {
                        sessionName: true,
                    },
                },
            },
            orderBy: { timestamp: 'desc' },
        });

        if (!lastMsg) {
            console.log(`❌ [whatsapp/messages] Chat não encontrado: ${chatId} para usuário ${userId}`);
            return NextResponse.json(
                { error: 'Chat não encontrado' },
                { status: 404 }
            );
        }

        // Buscar mensagens baseado no parâmetro showArchived
        const messages = await prisma.whatsAppMessage.findMany({
            where: {
                chatId,
                archived: showArchived,
            },
            orderBy: { timestamp: 'asc' },
        });

        // Formatar as mensagens
        const formattedMessages = messages.map((message) => ({
            id: message.id,
            messageId: message.messageId,
            text: message.body || '',
            timestamp: message.timestamp,
            direction: message.fromMe ? 'outbound' : 'inbound',
            fromType: message.fromMe ? 'user' : 'contact',
            type: message.type,
            mediaUrl: message.mediaUrl,
            mediaType: message.mediaType,
            fileName: message.fileName,
            caption: message.caption,
            quotedMsgId: message.quotedMsgId,
            isForwarded: message.isForwarded,
            isGroupMsg: message.isGroupMsg,
            author: message.author,
            channel: 'whatsapp',
            sessionName: lastMsg.contact?.session?.sessionName || lastMsg.session?.sessionName || '',
            contactId: lastMsg.contact?.id,
            contactName: lastMsg.contact?.name || chatId.split('@')[0],
            contactPhone: lastMsg.contact?.phone || chatId.split('@')[0],
        }));

        return NextResponse.json(formattedMessages);
    } catch (error) {
        console.error('❌ Erro ao buscar mensagens do WhatsApp:', error);
        return NextResponse.json(
            {
                error: 'Erro interno do servidor',
                message:
                    error instanceof Error
                        ? error.message
                        : 'Erro desconhecido',
            },
            { status: 500 }
        );
    }
}
