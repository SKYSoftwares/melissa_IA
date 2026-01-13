import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Cache para respostas frequentes
const responseCache = new Map<
  string,
  { answer: string; citations: any[]; timestamp: number }
>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { question } = await request.json();

    if (!question || question.trim().length === 0) {
      return NextResponse.json(
        { error: "Pergunta é obrigatória" },
        { status: 400 }
      );
    }

    // Verificar cache primeiro
    const cacheKey = question.toLowerCase().trim();
    const cached = responseCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        answer: cached.answer,
        citations: cached.citations,
        cached: true,
      });
    }

    // Buscar respostas similares no banco
    const similarQuestions = await prisma.kbMessage.findMany({
      where: {
        question: {
          contains: question,
          mode: "insensitive",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
    });

    if (similarQuestions.length > 0) {
      // Usar resposta mais similar
      const bestMatch = similarQuestions[0];

      // Cache da resposta
      responseCache.set(cacheKey, {
        answer: bestMatch.answer,
        citations: (bestMatch.citations as any[]) || [],
        timestamp: Date.now(),
      });

      return NextResponse.json({
        answer: bestMatch.answer,
        citations: bestMatch.citations || [],
        similar: true,
      });
    }

    // Se não encontrou resposta similar, usar IA externa (OpenAI, etc.)
    const aiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "Você é Agnes, uma assistente IA especializada em atendimento ao cliente e vendas. Responda de forma clara, concisa e útil.",
            },
            {
              role: "user",
              content: question,
            },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      }
    );

    if (!aiResponse.ok) {
      throw new Error("Erro na API de IA");
    }

    const aiData = await aiResponse.json();
    const answer = aiData.choices[0].message.content;

    // Salvar no banco para futuras consultas
    await prisma.kbMessage.create({
      data: {
        userId: session.user.email,
        question: question,
        answer: answer,
        citations: [],
      },
    });

    // Cache da resposta
    responseCache.set(cacheKey, {
      answer: answer,
      citations: [],
      timestamp: Date.now(),
    });

    return NextResponse.json({
      answer: answer,
      citations: [],
      ai: true,
    });
  } catch (error) {
    console.error("Erro na API otimizada da Agnes:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
