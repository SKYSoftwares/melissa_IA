// app/api/agnes/ask/route.ts
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma"; // ajuste se necessário

export const runtime = "nodejs";

// Verificar se as variáveis de ambiente estão disponíveis
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ASSISTANT_ID = process.env.ASSISTANT_ID;

// Se não houver chave da API, retornar erro mas não falhar no build
if (!OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY não configurada");
}

if (!ASSISTANT_ID) {
  console.warn("ASSISTANT_ID não configurado");
}

const client = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

type AskBody = { question: string };

export async function POST(req: NextRequest) {
  const allowPublic = process.env.ALLOW_PUBLIC_AGNES === "1";

  // Tenta ler a sessão sem depender de authOptions para evitar erro de import
  const session = await getServerSession().catch(() => null);

  if (!session?.user?.email && !allowPublic) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      { error: "Campo 'question' é obrigatório." },
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

    if (!ASSISTANT_ID) {
      return NextResponse.json(
        {
          error: "ASSISTANT_ID não configurado no ambiente.",
        },
        { status: 500 }
      );
    }

    console.log("DEBUG: ASSISTANT_ID:", ASSISTANT_ID);
    console.log("DEBUG: Question:", question);

    // 1) Thread nova
    console.log("DEBUG: About to create thread...");
    const thread = await client.beta.threads.create();

    console.log("DEBUG: Thread created:", thread.id);
    console.log("DEBUG: Thread object:", JSON.stringify(thread, null, 2));

    if (!thread || !thread.id) {
      throw new Error("Thread creation failed - no thread ID returned");
    }

    // Adicionar mensagem à thread
    console.log("DEBUG: About to create message...");
    const message = await client.beta.threads.messages.create(thread.id, {
      role: "user",
      content: question.trim(),
    });

    console.log("DEBUG: Message created:", message.id);

    // 2) Run no Assistant (já configurado no Platform c/ File Search + PDF)
    console.log("DEBUG: Creating run with thread ID:", thread.id);
    console.log("DEBUG: Using ASSISTANT_ID:", ASSISTANT_ID);

    const run = await client.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
      response_format: { type: "text" },
    });

    console.log("DEBUG: Run created with ID:", run.id);

    // 3) Poll
    const threadId = thread.id as string;
    const runId = run.id as string;
    let status = run.status;
    console.log("DEBUG: Initial run status:", status);
    console.log("DEBUG: Thread ID for polling:", threadId);
    console.log("DEBUG: Run ID for polling:", runId);

    while (
      status === "queued" ||
      status === "in_progress" ||
      status === "cancelling"
    ) {
      await new Promise((r) => setTimeout(r, 600));
      const retrievedRun = await client.beta.threads.runs.retrieve(runId, {
        thread_id: threadId,
      });
      status = retrievedRun.status;
      console.log("DEBUG: Updated run status:", status);
    }

    // 4) Extrair resposta + citações
    let answer = "";
    const citations: Array<{ file_id: string; quote?: string }> = [];

    if (status === "completed") {
      const msgs = await client.beta.threads.messages.list(threadId, {
        order: "desc",
        limit: 5,
      });
      const assistantMsg =
        msgs.data.find((m) => m.role === "assistant") ?? msgs.data[0];

      for (const c of assistantMsg?.content ?? []) {
        if (c.type === "text") {
          answer = c.text.value ?? answer;
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
    }

    // 4.1) Limpeza de marcadores de fonte e markdown bruto vindo do Assistants API
    const cleanAnswer = (text: string) => {
      return (
        text
          // remove marcadores de citação inline (duas variantes)
          .replace(/【\d+:\d+†source】/g, "")
          .replace(/\[\d+:\d+†source\]/g, "")
          // remove negrito markdown **texto**
          .replace(/\*\*(.*?)\*\*/g, "$1")
          .trim()
      );
    };
    answer = cleanAnswer(answer);

    // Se não houver resposta do Assistant, usar resposta padrão
    if (!answer || answer.trim() === "") {
      answer = "Não foi possível obter uma resposta.";
    }

    // 5) Salvar histórico
    await prisma.kbMessage.create({
      data: {
        userId: effectiveUserId,
        question,
        answer,
        citations: citations as any,
      },
    });

    return NextResponse.json({ answer, citations });
  } catch (err: any) {
    console.error("agnes/ask error:", err?.response?.data ?? err);
    return NextResponse.json(
      { error: err?.message ?? "Erro inesperado" },
      { status: 500 }
    );
  }
}
