import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// Valores padrão baseados no código atual
const DEFAULT_CONFIG = {
  assistantName: "Melissa",
  assistantRole: "assistente virtual",
  assistantTeam: "equipe do Dr. Marcelo",
  assistantContext: `Olá! Eu me chamo Melissa😊, faço parte da equipe do Dr. Marcelo. Como posso te ajudar hoje?
As consultas com o Dr. Marcelo são bastante simples e eficazes! Aqui está como funciona:

1. Agendamento: Você pode agendar sua consulta escolhendo a data e o horário que melhor se encaixem na sua rotina. Para agendar, preciso apenas do seu nome completo.

2. Consulta: Durante a consulta, o Dr. Marcelo fará uma avaliação detalhada da sua saúde ocular. Ele pode solicitar exames, esclarecer suas dúvidas e discutir opções de tratamento, se necessário.

3. Retorno: Caso o Dr. Marcelo considere necessário, você terá direito a um retorno, que já está incluído no valor da consulta.

A consulta custa R$ 400,00 e inclui o direito a retorno, caso seja necessário.

Se precisar agendar um horário ou tiver mais perguntas, estou aqui para ajudar!`,
  greetingMessage:
    "Olá! Eu me chamo Melissa, faço parte da equipe da Melissa IA. Como posso te ajudar hoje?",
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

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.team.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    let config = await prisma.aIConfig.findUnique({
      where: { userId: user.id },
    });

    // Se não existe, retorna os valores padrão
    if (!config) {
      return NextResponse.json({
        ...DEFAULT_CONFIG,
        id: null,
        userId: user.id,
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Erro ao buscar configurações da IA:", error);
    return NextResponse.json(
      { error: "Erro ao buscar configurações" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.team.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      assistantName,
      assistantRole,
      assistantTeam,
      assistantContext,
      greetingMessage,
      appointmentFlow,
      confirmationMessage,
      generalRules,
    } = body;

    // Verifica se já existe configuração
    const existingConfig = await prisma.aIConfig.findUnique({
      where: { userId: user.id },
    });

    let config;
    if (existingConfig) {
      // Atualiza
      config = await prisma.aIConfig.update({
        where: { userId: user.id },
        data: {
          assistantName: assistantName || DEFAULT_CONFIG.assistantName,
          assistantRole: assistantRole || DEFAULT_CONFIG.assistantRole,
          assistantTeam: assistantTeam || DEFAULT_CONFIG.assistantTeam,
          assistantContext: assistantContext || DEFAULT_CONFIG.assistantContext,
          greetingMessage: greetingMessage || DEFAULT_CONFIG.greetingMessage,
          appointmentFlow: appointmentFlow || DEFAULT_CONFIG.appointmentFlow,
          confirmationMessage:
            confirmationMessage || DEFAULT_CONFIG.confirmationMessage,
          generalRules: generalRules || DEFAULT_CONFIG.generalRules,
        },
      });
    } else {
      // Cria nova
      config = await prisma.aIConfig.create({
        data: {
          userId: user.id,
          assistantName: assistantName || DEFAULT_CONFIG.assistantName,
          assistantRole: assistantRole || DEFAULT_CONFIG.assistantRole,
          assistantTeam: assistantTeam || DEFAULT_CONFIG.assistantTeam,
          assistantContext: assistantContext || DEFAULT_CONFIG.assistantContext,
          greetingMessage: greetingMessage || DEFAULT_CONFIG.greetingMessage,
          appointmentFlow: appointmentFlow || DEFAULT_CONFIG.appointmentFlow,
          confirmationMessage:
            confirmationMessage || DEFAULT_CONFIG.confirmationMessage,
          generalRules: generalRules || DEFAULT_CONFIG.generalRules,
        },
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Erro ao salvar configurações da IA:", error);
    return NextResponse.json(
      { error: "Erro ao salvar configurações" },
      { status: 500 }
    );
  }
}
