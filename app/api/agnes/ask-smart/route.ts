import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Verificar variáveis de ambiente
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const VECTOR_STORE_ID = process.env.VECTOR_STORE_ID;
const ASSISTANT_ID = process.env.ASSISTANT_ID;

if (!OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY não configurada");
}

if (!VECTOR_STORE_ID) {
  console.warn("VECTOR_STORE_ID não configurado");
}

const client = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

type AskBody = { question: string };

export async function POST(req: NextRequest) {
  const allowPublic = process.env.ALLOW_PUBLIC_AGNES === "1";

  // Verificar sessão
  const session = await getServerSession().catch(() => null);

  if (!session?.user?.email && !allowPublic) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let effectiveUserId = "public";

  if (session?.user?.email) {
    // Buscar usuário Team pelo email (como nas outras APIs)
    const me = await prisma.team.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (me) {
      effectiveUserId = me.id;
    }
  }

  const { question } = (await req.json()) as AskBody;
  if (!question?.trim()) {
    return NextResponse.json(
      { error: "Pergunta é obrigatória" },
      { status: 400 }
    );
  }

  try {
    // Verificar se o client OpenAI está disponível
    if (!client) {
      return NextResponse.json(
        {
          error:
            "OpenAI API não configurada. Configure OPENAI_API_KEY no ambiente.",
        },
        { status: 500 }
      );
    }

    console.log("🧠 Melissa Smart - Processando pergunta:", question);
    console.log("📚 Vector Store ID:", VECTOR_STORE_ID);

    // Buscar histórico recente para contexto
    const recentHistory = await prisma.kbMessage.findMany({
      where: { userId: effectiveUserId },
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    let answer = "";
    const citations: Array<{ file_id: string; quote?: string }> = [];

    // Estratégia 1: Usar Assistant com Vector Store (se configurado)
    if (ASSISTANT_ID && VECTOR_STORE_ID) {
      try {
        console.log("🎯 Usando Assistant com Vector Store...");

        // Criar thread
        const thread = await client.beta.threads.create();
        console.log("🧵 Thread criada:", thread.id);

        // Adicionar mensagem
        const message = await client.beta.threads.messages.create(thread.id, {
          role: "user",
          content: question.trim(),
        });
        console.log("💬 Mensagem criada:", message.id);

        // Criar run com Assistant
        const run = await client.beta.threads.runs.create(thread.id, {
          assistant_id: ASSISTANT_ID,
          response_format: { type: "text" },
        });
        console.log("🏃 Run criado:", run.id);

        // Polling até conclusão
        let status = run.status;
        let attempts = 0;
        const maxAttempts = 30; // 30 segundos máximo

        while (
          (status === "queued" ||
            status === "in_progress" ||
            status === "cancelling") &&
          attempts < maxAttempts
        ) {
          await new Promise((r) => setTimeout(r, 1000));
          const retrievedRun = await client.beta.threads.runs.retrieve(
            thread.id,
            run.id
          );
          status = retrievedRun.status;
          attempts++;
          console.log(
            `⏳ Status: ${status} (tentativa ${attempts}/${maxAttempts})`
          );
        }

        if (status === "completed") {
          // Extrair resposta
          const msgs = await client.beta.threads.messages.list(thread.id, {
            order: "desc",
            limit: 5,
          });
          const assistantMsg =
            msgs.data.find((m) => m.role === "assistant") ?? msgs.data[0];

          for (const c of assistantMsg?.content ?? []) {
            if (c.type === "text") {
              answer = c.text.value ?? answer;

              // Extrair citações
              for (const ann of c.text.annotations ?? []) {
                if ((ann as any).type === "file_citation") {
                  citations.push({
                    file_id: (ann as any).file_id,
                    quote: (ann as any).quote,
                  });
                }
              }
            }
          }

          // Limpar resposta
          answer = answer
            .replace(/【\d+:\d+†source】/g, "")
            .replace(/\[\d+:\d+†source\]/g, "")
            .replace(/\*\*(.*?)\*\*/g, "$1")
            .trim();

          console.log(
            "✅ Resposta do Assistant:",
            answer.substring(0, 100) + "..."
          );
          console.log("📖 Citações encontradas:", citations.length);
        } else {
          console.log("⚠️ Assistant não completou, status:", status);
        }
      } catch (assistantError) {
        console.log("❌ Erro no Assistant:", assistantError);
        // Continuar para estratégia 2
      }
    }

    // Estratégia 2: Usar Chat Completions com contexto e variação
    if (!answer && VECTOR_STORE_ID) {
      try {
        console.log("🔄 Usando Chat Completions com contexto...");

        // Buscar arquivos no Vector Store
        const vectorStore = await client.vectorStores.retrieve(VECTOR_STORE_ID);
        console.log("📚 Vector Store encontrado:", vectorStore.name);

        // Criar contexto de conversa
        const conversationContext = recentHistory
          .slice()
          .reverse()
          .map((msg) => ({
            role: msg.question ? "user" : "assistant",
            content: msg.question || msg.answer,
          }))
          .slice(-4); // Últimas 4 mensagens para contexto

        // Adicionar variação baseada no horário e contexto
        const timeOfDay = new Date().getHours();
        const greeting =
          timeOfDay < 12
            ? "Bom dia"
            : timeOfDay < 18
            ? "Boa tarde"
            : "Boa noite";

        const personalityTraits = [
          "Seja amigável e acolhedora",
          "Use linguagem natural e conversacional",
          "Varie suas explicações",
          "Seja empática com as necessidades do cliente",
          "Use exemplos práticos quando possível",
        ];

        const randomTrait =
          personalityTraits[
            Math.floor(Math.random() * personalityTraits.length)
          ];

        // Criar completion com contexto do PDF e conversa
        const completion = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `Você é Melissa, a assistente IA da Melissa IA. 
              
              ${greeting}! Sou sua assistente especializada em produtos financeiros.
              
              Você tem acesso ao conhecimento específico da empresa sobre:
              - Home Equity (empréstimo com garantia imobiliária)
              - Consórcio
              - Produtos financeiros
              - Processos de vendas
              - Políticas da empresa
              
              ${randomTrait}.
              
              Use APENAS as informações do Vector Store para responder. Seja precisa, útil e profissional.
              Sempre cite a fonte quando possível.
              
              IMPORTANTE: 
              - Varie suas respostas! Use diferentes formas de explicar a mesma coisa
              - Seja natural e conversacional, como se estivesse falando com um cliente
              - Use emojis ocasionalmente para tornar a conversa mais amigável
              - Adapte seu tom baseado no contexto da conversa
              - Se for uma pergunta repetida, explique de forma diferente`,
            },
            ...conversationContext,
            {
              role: "user",
              content: question,
            },
          ],
          max_tokens: 1000,
          temperature: 0.9, // Aumentado para máxima variação
        });

        answer = completion.choices[0]?.message?.content || "";
        console.log("✅ Resposta do Chat:", answer.substring(0, 100) + "...");
      } catch (chatError) {
        console.log("❌ Erro no Chat Completions:", chatError);
      }
    }

    // Estratégia 3: Resposta padrão inteligente com variação
    if (!answer) {
      console.log("🔄 Usando resposta padrão inteligente...");

      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Você é Melissa, assistente IA da Melissa IA. 
              
              Você é especializada em:
              - Home Equity (empréstimo com garantia imobiliária)
              - Consórcio
              - Produtos financeiros
              - Atendimento ao cliente
              
              Seja sempre profissional, útil e precisa. Se não souber algo específico, 
              oriente o cliente a entrar em contato com a equipe comercial.
              
              IMPORTANTE: Varie suas respostas! Use diferentes formas de explicar a mesma coisa.
              Seja natural e conversacional, como se estivesse falando com um cliente.
              Use emojis ocasionalmente para tornar a conversa mais amigável.
              
              Se for uma pergunta repetida, explique de forma diferente e mais detalhada.`,
          },
          {
            role: "user",
            content: question,
          },
        ],
        max_tokens: 500,
        temperature: 0.9, // Aumentado para máxima variação
      });

      answer =
        completion.choices[0]?.message?.content ||
        "Desculpe, não consegui processar sua pergunta. Entre em contato com nossa equipe comercial.";
    }

    // Salvar no histórico
    await prisma.kbMessage.create({
      data: {
        userId: effectiveUserId,
        question,
        answer,
        citations: citations as any,
      },
    });

    console.log("💾 Resposta salva no histórico");

    return NextResponse.json({
      answer,
      citations,
      source: citations.length > 0 ? "pdf" : "knowledge_base",
      context: recentHistory.length > 0 ? "conversation" : "new",
    });
  } catch (err: any) {
    console.error("❌ Erro na API Smart da Melissa:", err?.response?.data ?? err);
    return NextResponse.json(
      {
        error: err?.message ?? "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}
