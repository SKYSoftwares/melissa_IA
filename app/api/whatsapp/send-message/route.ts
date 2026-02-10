import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

const WHATSAPP_SERVER_URL = process.env.BACKEND_WPP_CONNECT;

export async function POST(request: NextRequest) {
    try {
        const { contactId, text, sessionName } = await request.json();

        let contact = null;

        // Caso 1: É UUID (formato padrão com hífens)
        const isUUID = /^[0-9a-fA-F-]{36}$/.test(contactId);

        // Caso 2: É WhatsApp ID
        let cleanPhone = '';

        if (!isUUID) {
            cleanPhone = contactId.split('@')[0].replace(/\D/g, '');
        }

        if (!contactId || !text || !sessionName) {
            return NextResponse.json(
                {
                    error: 'contactId, text e sessionName são obrigatórios',
                },
                { status: 400 }
            );
        }

        console.log(`📱 Enviando mensagem WhatsApp para contato: ${contactId}`);


        if (isUUID) {
            contact = await prisma.whatsAppContact.findUnique({
                where: { id: contactId },
                include: { session: true },
            });
        } else {
            contact = await prisma.whatsAppContact.findFirst({
                where: { phone: cleanPhone },
                include: { session: true },
            });
        }

        if (!contact) {
            return NextResponse.json(
                { error: 'Contato não encontrado' },
                { status: 404 }
            );
        }

        // Verificar se a sessão está conectada
        try {
            const statusResp = await axios.get(
                `${WHATSAPP_SERVER_URL}/${sessionName}/status`,
                { timeout: 10000 }
            );

            const sessionStatus = statusResp.data?.connectionState;

            if (sessionStatus !== 'CONNECTED') {
                return NextResponse.json(
                    {
                        error: 'Sessão WhatsApp não está conectada',
                        details: `Status atual: ${sessionStatus}`,
                    },
                    { status: 409 }
                );
            }
        } catch (statusErr: any) {
            console.error(
                '❌ Erro ao consultar status da sessão no WPPConnect:',
                statusErr.message
            );

            if (statusErr.response?.status === 404) {
                // 🚨 Sessão não existe → recriar
                console.log(
                    `⚠️ Sessão ${sessionName} não existe, recriando...`
                );

                // Chama a rota de criação do WPPConnect
                await axios.post(
                    `${WHATSAPP_SERVER_URL}/${sessionName}/createsession`
                );

                // Recupera do banco o número que deveria estar vinculado a essa sessão
                const expectedNumber =
                    contact.session?.phoneNumber || contact.phone;

                return NextResponse.json(
                    {
                        error: 'Sessão inexistente, recriação iniciada',
                        reconnect: true,
                        session: sessionName,
                        expectedNumber, // 👈 aqui vai o número que deve ser conectado
                        message: `A sessão ${sessionName} foi recriada. Escaneie o QR Code com o número ${expectedNumber}.`,
                    },
                    { status: 404 }
                );
            }

            return NextResponse.json(
                {
                    error: 'Não foi possível validar o status da sessão',
                    details: statusErr.response?.data || statusErr.message,
                },
                { status: 502 }
            );
        }
        console.log("Número enviado ao WPP:", contact.phone);

        let response;

        // Pega chatId do banco, se existir
        const lastMsg = await prisma.whatsAppMessage.findFirst({
            where: { contactId: contact.id },
            orderBy: { timestamp: 'desc' },
        });

        // Se existir chatId, usa ele; senão, envia pelo número do contato
        let chatIdToSend = lastMsg?.chatId || contact.phone;

        if (!chatIdToSend) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Não foi possível determinar chatId ou telefone para envio',
                },
                { status: 400 }
            );
        }

        try {
            const isLid = chatIdToSend.endsWith?.('@lid') ?? false;

            response = await axios.post(
                `${WHATSAPP_SERVER_URL}/${sessionName}/sendmessage`,
                {
                    chatId: isLid ? chatIdToSend : undefined,
                    telnumber: isLid ? undefined : chatIdToSend,
                    message: text,
                },
                { timeout: 30000 }
            );

            console.log("✅ Mensagem enviada com payload:", {
                chatId: isLid ? chatIdToSend : undefined,
                telnumber: isLid ? undefined : chatIdToSend,
            });
        } catch (err: any) {
            console.error("❌ Erro ao enviar mensagem:", err.message || err);
            return NextResponse.json(
                {
                    success: false,
                    error: "Falha no envio da mensagem",
                    details: err.response?.data || err.message,
                },
                { status: 500 }
            );
        }

        const result = response.data;


        console.log(contact?.phone, 'phone');
        if (result.status) {
            // Mensagem enviada com sucesso
            console.log(
                `✅ Mensagem enviada com sucesso para ${contact.phone} via sessão ${sessionName}`
            );

            // A mensagem será salva automaticamente pelo webhook quando o servidor WhatsApp disparar o evento 'sent'
            // Mas vamos atualizar a última atividade do contato
            if (contact?.id) {
                await prisma.whatsAppContact.update({
                    where: { id: contact.id },
                    data: {
                        lastMessageAt: new Date(),
                    },
                });
            }

            return NextResponse.json({
                success: true,
                data: {
                    messageId: result.message,
                    contactPhone: contact.phone,
                    sessionName: sessionName,
                },
            });
        } else {
            // Erro no envio
            console.error(
                `❌ Erro no envio para ${contact.phone}:`,
                result.message
            );
            return NextResponse.json(
                {
                    success: false,
                    error: 'Erro ao enviar mensagem',
                    details: result.message,
                },
                { status: 400 }
            );
        }
    } catch (apiError: any) {
        console.error(
            '❌ Erro na comunicação com servidor WhatsApp:',
            apiError
        );

        if (apiError.code === 'ECONNREFUSED') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Servidor WhatsApp indisponível',
                    details:
                        'Não foi possível conectar ao servidor WhatsApp',
                },
                { status: 503 }
            );
        }

        if (apiError.response) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Erro no servidor WhatsApp',
                    details:
                        apiError.response.data?.message || apiError.message,
                },
                { status: 400 }
            );
        }

        throw apiError;
    }
}
