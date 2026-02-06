import { NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Valores padrão
const DEFAULT_CONFIG = {
  assistantName: "Agnes",
  assistantRole: "assistente virtual",
  assistantTeam: "equipe do Dr. Marcelo",
  assistantContext: `Olá! Eu me chamo Agnes😊, faço parte da equipe do Dr. Marcelo. Como posso te ajudar hoje?
As consultas com o Dr. Marcelo são bastante simples e eficazes! Aqui está como funciona:

1. Agendamento: Você pode agendar sua consulta escolhendo a data e o horário que melhor se encaixem na sua rotina. Para agendar, preciso apenas do seu nome completo.

2. Consulta: Durante a consulta, o Dr. Marcelo fará uma avaliação detalhada da sua saúde ocular. Ele pode solicitar exames, esclarecer suas dúvidas e discutir opções de tratamento, se necessário.

3. Retorno: Caso o Dr. Marcelo considere necessário, você terá direito a um retorno, que já está incluído no valor da consulta.

A consulta custa R$ 400,00 e inclui o direito a retorno, caso seja necessário.

Se precisar agendar um horário ou tiver mais perguntas, estou aqui para ajudar!`,
  appointmentFlow: `Quando o paciente quiser AGENDAR, siga este fluxo de agendamento:

- Peça o NOME COMPLETO, caso ainda não saiba.
- Depois peça o DIA da consulta.
- Depois peça o HORÁRIO da consulta.

Quando tiver NOME + DIA + HORÁRIO, confirme assim:
"{DIA} às {HORÁRIO}, para {NOME}. Confere?"`,
  confirmationMessage: `Se o paciente confirmar:
Responda APENAS:
"✅ Consulta marcada para {NOME} no dia {DIA} às {HORÁRIO}."

Depois disso, encerre o atendimento e NÃO faça novas perguntas.`,
  generalRules: `Regras gerais:
- Mensagens curtas, em tom de WhatsApp.
- Não invente preços diferentes dos informados.
- Não faça diagnóstico nem prescreva tratamento.
- Não use emojis em excesso.`,
};

function getBrazilGreeting() {
  const now = new Date();

  // Força o horário do Brasil (UTC-3)
  const brazilHour = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  ).getHours();

  if (brazilHour >= 5 && brazilHour < 12) return "Bom dia!";
  if (brazilHour >= 12 && brazilHour < 18) return "Boa tarde!";
  return "Boa noite!";
}

async function getAIConfig(userId: string | null) {
  if (!userId) {
    return DEFAULT_CONFIG;
  }

  try {
    const config = await prisma.aIConfig.findUnique({
      where: { userId },
    });

    if (config) {
      return {
        assistantName: config.assistantName,
        assistantRole: config.assistantRole,
        assistantTeam: config.assistantTeam,
        assistantContext: config.assistantContext,
        greetingMessage: config.greetingMessage,
        appointmentFlow: config.appointmentFlow,
        confirmationMessage: config.confirmationMessage,
        generalRules: config.generalRules,
      };
    }
  } catch (error) {
    console.error("Erro ao buscar configuração da IA:", error);
  }

  return DEFAULT_CONFIG;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { chatId, contactName, contactPhone, messages } = body as {
      chatId: string;
      contactName?: string;
      contactPhone?: string;
      messages: {
        role: "user" | "assistant" | "system";
        content: string;
      }[];
    };

    // Buscar userId através do chatId (via mensagem ou contato)
    let userId: string | null = null;
    try {
      const message = await prisma.whatsAppMessage.findFirst({
        where: { chatId },
        include: {
          contact: {
            include: {
              session: true,
            },
          },
        },
      });

      if (message?.contact?.session?.userId) {
        userId = message.contact.session.userId;
      }
    } catch (error) {
      console.error("Erro ao buscar userId:", error);
    }

    // Buscar configuração da IA
    const aiConfig = await getAIConfig(userId);

    const systemMessage = {
      role: "system" as const,
      content: `
          Você é a ${aiConfig.assistantName}, ${aiConfig.assistantRole}, faz parte da ${aiConfig.assistantTeam}
          (equipe de medicina). Você atende pelo WhatsApp.
          
          Use o texto abaixo como CONTEXTO para suas respostas. Não envie esse texto
          todo de uma vez; use apenas as partes necessárias para responder às dúvidas
          do paciente de forma curta, clara e direta:
          
          "${aiConfig.assistantContext}"
          
          ${aiConfig.appointmentFlow}
          
          ${aiConfig.confirmationMessage}
          
          ${aiConfig.generalRules}
          `,
    };

    const chatMessages = [
      systemMessage,
      ...(messages || []).filter((m) => m.content?.trim()),
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini", // ou outro modelo que você quiser
      messages: chatMessages,
      temperature: 0.6,
      max_tokens: 300,
    });

    const reply =
      completion.choices[0]?.message?.content?.trim() ||
      "Desculpe, tive um problema para gerar a resposta agora.";

    return NextResponse.json({ ok: true, reply });
  } catch (err) {
    console.error("Erro na rota /api/whatsapp/ai-reply:", err);
    return NextResponse.json(
      { ok: false, error: "Erro ao gerar resposta de IA." },
      { status: 500 }
    );
  }
}
