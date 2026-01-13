import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

/**
 * API para buscar chats/conversas do WhatsApp
 *
 * ORDENAÇÃO CRONOLÓGICA:
 * - As conversas são ordenadas pela data da última mensagem (mais recente primeiro)
 * - Independentemente de qual conexão/sessão a mensagem pertence
 * - Isso garante que o sidebar mostre todas as conversas por ordem de chegada
 */
export async function GET(request: NextRequest) {
    const nextSession = await getServerSession(authOptions);

    if (!nextSession || !nextSession.user?.id) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    try {
        const userId = nextSession.user.id;
        const { searchParams } = new URL(request.url);
        const showArchived = searchParams.get('showArchived') === 'true';

        // console.log("📋 [whatsapp/chats] showArchived:", showArchived);

        // Busca mensagens apenas das sessões vinculadas a esse usuário
        // ORDENAÇÃO CRONOLÓGICA: ordenar APENAS por timestamp (data de chegada)
        // para exibir todas as conversas por ordem de chegada, independentemente da conexão
        const lastMessages = await prisma.whatsAppMessage.findMany({
            orderBy: [{ timestamp: 'desc' }], // 👈 Ordenar APENAS por data de chegada
            distinct: ['chatId'],
            where: {
                session: {
                    userId, // <-- filtro pelo dono da sessão
                },
                archived: showArchived, // <-- se showArchived=true, busca arquivadas; se false, busca não arquivadas
            },
            include: {
                contact: {
                    include: {
                        session: true,
                        tags: { include: { tag: true } },
                    },
                },
            },
        });

        async function getChats() {
            return Promise.all(
                lastMessages.map(async (msg) => {
                    const contact = (msg as any).contact as any;
                    const session = await prisma.whatsAppSession.findUnique({
                        where: { id: msg.sessionId },
                        select: { sessionName: true },
                    });

                    // Se estamos buscando mensagens arquivadas, o chat está arquivado
                    // Se estamos buscando mensagens não arquivadas, o chat não está arquivado
                    const isArchived = showArchived;

                    return {
                        id: msg.chatId,
                        chatId: msg.contactId,
                        sessionName: session?.sessionName,
                        sessionId: msg.sessionId,
                        channel: 'whatsapp',
                        contact: {
                            id: contact?.id,
                            name:
                                contact?.name ||
                                msg.chatId.split('@')[0] ||
                                'Sem nome',
                            phone: contact?.phone || msg.chatId.split('@')[0],
                            avatarUrl: contact?.profilePic,
                        },
                        lastMessage: {
                            id: msg.id,
                            text: msg.body || msg.caption || '',
                            timestamp: msg.timestamp,
                            direction: msg.fromMe ? 'outbound' : 'inbound',
                            fromType: msg.fromMe ? 'user' : 'contact',
                            type: msg.type,
                        },
                        tags: contact?.tags?.map((ct: any) => ct.tag) || [],
                        lastMessageAt: msg.timestamp,
                        isGroup: msg.chatId.includes('@g.us'),
                        isAssigned: false,
                        isAssignedToCurrentUser: false,
                        archived: isArchived,
                    };
                })
            );
        }

        const chats = await getChats();

        // Log para debug
        // console.log('📋 [whatsapp/chats] Total de chats:', chats.length);
        const archivedCount = chats.filter((chat) => chat.archived).length;
        // console.log('📋 [whatsapp/chats] Chats arquivados:', archivedCount);

        return NextResponse.json(chats);
    } catch (error) {
        console.error('❌ Erro ao buscar chats agrupados por chatId:', error);
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
