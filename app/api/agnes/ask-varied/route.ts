// app/api/agnes/ask/route.ts
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

/**
 * Agnes — Dr. Zeus Capital CRM
 * - Assistants API com File Search (Vector Store)
 * - Fallback Chat Completions com primer + few-shots + histórico
 * - Temperatura dinâmica por intenção
 * - Slot-filling (city, propertyValue, purpose)
 * - CTA consistente para agendar Meet
 */

export const runtime = "nodejs";

/* ========================= ENV & CLIENT ========================= */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const VECTOR_STORE_ID = process.env.VECTOR_STORE_ID;
const ASSISTANT_ID = process.env.ASSISTANT_ID;
const ALLOW_PUBLIC = process.env.ALLOW_PUBLIC_AGNES === "1";

if (!OPENAI_API_KEY) console.warn("[Agnes] OPENAI_API_KEY não configurada.");
if (!VECTOR_STORE_ID) console.warn("[Agnes] VECTOR_STORE_ID não configurado.");
if (!ASSISTANT_ID) console.warn("[Agnes] ASSISTANT_ID não configurado.");

const client = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

/* ========================= CONTEXTO FIXO (PRIMER) ========================= */

const PLATFORM_PRIMER = `
Você é **Agnes**, IA do **Dr. Zeus Capital CRM**.

MISSÃO
- Explicar, orientar e qualificar leads com precisão e transparência.
- Nunca prometa aprovação, taxa exata ou prazo garantido sem análise.

VOZ DA MARCA
- Clara, consultiva, humana e confiante; sem juridiquês.
- Foco em educação financeira e planejamento responsável.

O QUE O CRM FAZ
- Gestão de leads, propostas e contratos
- Agendamentos (Google Meet)
- Integração WhatsApp
- Simuladores (Home Equity e Consórcio)
- Relatórios e hierarquias de equipe

HOME EQUITY — PILARES
- LTV: geralmente **35%–60%** do valor de mercado (teto seguro até **60%**).
- Imóveis aceitos: residenciais, comerciais, mistos; rurais produtivos **> 30 ha** com CAR/geo/ITR; terrenos urbanizados.
- Perfis: PF/PJ; negativado **pode** ser analisado se o **imóvel** e a estrutura forem sólidos; imóvel de terceiros com garantidores.
- Prazos: **36–240 meses** | **Carência até 180 dias** | **Crédito livre** (uso estratégico).
- Benefícios: DFI/MIP, consolidação de dívidas caras, alavancagem quando o ROI supera juros.
- Riscos & Mitigação: inadimplência → risco de leilão; mitigamos com análise de capacidade, carência, renegociação e educação financeira.

COMO RESPONDER
1) Seja factual e cite a base quando for política/produto (sem números inventados).
2) Se faltar dado, admita e convide para reunião/simulação.
3) Evite parecer “banco”: somos **hub consultivo + tecnologia**.
4) Identifique intenção de compra e **colete slots** (cidade/UF, valor do imóvel, finalidade do crédito, renda aproximada, docs) com naturalidade.
5) Ofereça sempre o **agendamento de Google Meet** para avançar.

FRASES-CHAVE
- “Trabalhamos com LTV seguro, normalmente até 60%.”
- “Carência de até 180 dias ajuda a aplicar o recurso antes da 1ª parcela.”
- “Negativado pode ser analisado quando o imóvel e a estrutura são sólidos.”
- “Imóveis rurais são elegíveis quando produtivos > 30 ha e com CAR/geo/ITR.”
- “Seguros DFI/MIP protegem família e patrimônio.”

LIMITES & ESCALADA
- Nada de aconselhamento jurídico/fiscal personalizado: oriente a falar com jurídico/contábil.
- Prefira intervalos (ex.: “geralmente”, “em média”) e ofereça **simulação**.
- Se houver urgência/fit alto → **agende Meet**.

CTA PADRÃO
“Com o que mais posso te ajudar?”
`;

/* ========================= FEW-SHOTS ========================= */

const FEW_SHOTS: Array<{ user: string; assistant: string }> = [
  {
    user: "Qual LTV vocês trabalham?",
    assistant:
      "Normalmente entre **35% e 60%** do valor de mercado do imóvel; manter o teto em **60%** dá segurança à operação. Posso estimar para o seu caso se você me disser cidade/UF e valor estimado do imóvel.",
  },
  {
    user: "Tem carência?",
    assistant:
      "Sim, **até 180 dias** para iniciar os pagamentos — útil para aplicar o recurso e gerar caixa antes das parcelas. Posso simular com e sem carência pra você comparar.",
  },
  {
    user: "Quais documentos preciso enviar?",
    assistant:
      "RG/CPF, comprovante de residência, matrícula/ITR/IPTU/certeidões do imóvel e comprovante de renda; para PJ, atos societários. Se quiser, já te envio a checklist completa e abro a pré-análise.",
  },
  {
    user: "Estou negativado; consigo?",
    assistant:
      "**Pode** ser viável se o **imóvel** for elegível e a estrutura fizer sentido. A análise é caso a caso. Me conta o valor do imóvel e a cidade/UF pra eu adiantar a pré-checada.",
  },
  {
    user: "Imóvel rural entra?",
    assistant:
      "Entra quando **produtivo > 30 ha** e com **CAR, georreferenciamento e ITR** em dia. Se me passar localização e área, eu verifico os próximos passos.",
  },
];

/* ========================= TIPOS & HELPERS ========================= */

type AskBody = { question: string };

type Cit = { file_id: string; quote?: string };

function detectIntent(q: string): "sales" | "faq" | "smalltalk" {
  const sales =
    /(simular|taxa|prazo|document|car[êe]ncia|agendar|reuni[aã]o|meet|proposta|contrato|aprova[cç][aã]o|valor)/i.test(
      q
    );
  const faq =
    /(o que|como funciona|posso|aceitam|qual|quando|onde|por que|porque|diferen[cç]a|entra|negativado|rural)/i.test(
      q
    );
  if (sales) return "sales";
  if (faq) return "faq";
  return "smalltalk";
}

function paramsByIntent(intent: "sales" | "faq" | "smalltalk") {
  if (intent === "sales")
    return { temperature: 0.2, top_p: 0.9, freq: 0.0, pres: 0.0 };
  if (intent === "faq")
    return { temperature: 0.4, top_p: 0.9, freq: 0.1, pres: 0.1 };
  return { temperature: 0.7, top_p: 0.95, freq: 0.3, pres: 0.2 };
}

function extractSlots(text: string) {
  const cityUF =
    text.match(/\b([A-ZÁ-Ú][a-zà-úç]+)\s*-\s*([A-Z]{2})\b/)?.[0] ?? null;
  const propertyValueRaw =
    text.replace(/\s/g, "").match(
      /\b(?:R?\$)?(\d{2,3}(?:\.\d{3}){1,2}|\d{5,8})(?:,\d{2})?\b/ // 100.000 / 1.200.000 / 250000 etc.
    )?.[0] ?? null;
  const purpose =
    /(quitar dívidas|investir|reforma|capital de giro|comprar imóvel|negócio)/i.exec(
      text
    )?.[0] ?? null;

  return {
    cityUF,
    propertyValue: propertyValueRaw,
    purpose,
  };
}

function appendCTA(answer: string, intent: "sales" | "faq" | "smalltalk") {
  if (intent === "sales" || /simula|agend|meet|reuni/i.test(answer)) {
    return answer;
  }
  return answer;
}

/* ========================= PERSONALIDADES ========================= */

const PERSONALITIES = [
  {
    tone: "amigável e acolhedora",
    style: "conversacional e natural",
    emoji: "😊",
    intro: "Olá! Fico feliz em te ajudar!",
  },
  {
    tone: "profissional e precisa",
    style: "técnica e detalhada",
    emoji: "💼",
    intro: "Perfeito! Vou te explicar detalhadamente.",
  },
  {
    tone: "empática e atenciosa",
    style: "cuidadosa e explicativa",
    emoji: "🤝",
    intro: "Entendo sua dúvida! Deixe-me te ajudar.",
  },
  {
    tone: "dinâmica e entusiasmada",
    style: "energética e motivadora",
    emoji: "🚀",
    intro: "Excelente pergunta! Vamos descobrir juntos!",
  },
  {
    tone: "calma e reflexiva",
    style: "ponderada e analítica",
    emoji: "🤔",
    intro: "Interessante! Vou analisar isso para você.",
  },
] as const;

/* ========================= ROUTE HANDLER ========================= */

export async function POST(req: NextRequest) {
  const session = await getServerSession().catch(() => null);

  if (!session?.user?.email && !ALLOW_PUBLIC) {
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

  const body = (await req.json().catch(() => ({}))) as AskBody;
  const question = body?.question?.trim() ?? "";

  if (!question) {
    return NextResponse.json(
      { error: "Pergunta é obrigatória" },
      { status: 400 }
    );
  }

  if (!client) {
    return NextResponse.json(
      { error: "OpenAI API não configurada." },
      { status: 500 }
    );
  }

  try {
    /* ---------- CONTEXTO DINÂMICO ---------- */
    const recentHistory = await prisma.kbMessage.findMany({
      where: { userId: effectiveUserId },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const timeOfDay = new Date().getHours();
    const greeting =
      timeOfDay < 12 ? "Bom dia" : timeOfDay < 18 ? "Boa tarde" : "Boa noite";

    const seed = (() => {
      const q = question.toLowerCase().replace(/\s+/g, "");
      return (q.charCodeAt(0) + Date.now()) % 1000;
    })();
    const personality = PERSONALITIES[seed % PERSONALITIES.length];

    const intent = detectIntent(question);
    const { temperature, top_p, freq, pres } = paramsByIntent(intent);

    /* ---------- VARIÁVEIS DE TRABALHO ---------- */
    let answer = "";
    const citations: Cit[] = [];

    /* ---------- ESTRATÉGIA 1: Assistants + Vector Store ---------- */
    if (ASSISTANT_ID && VECTOR_STORE_ID) {
      try {
        console.log("[Agnes] Assistants + Vector Store...");

        // 1) Thread
        const thread = await client.beta.threads.create();

        // 2) Mensagem do usuário
        await client.beta.threads.messages.create(thread.id, {
          role: "user",
          content: question,
        });

        // 3) Run com file_search conectado + primer/instruções
        const run = await client.beta.threads.runs.create(
          thread.id,
          {
            assistant_id: ASSISTANT_ID!,
            response_format: { type: "text" },
            tool_resources: {
              file_search: { vector_store_ids: [VECTOR_STORE_ID as string] },
            },
            instructions: `${PLATFORM_PRIMER}\n\nContexto dinâmico: ${greeting}! ${personality.intro} ${personality.emoji}`,
          } as any // 👈 força aceitar o tool_resources
        );

        // 4) Polling
        let status = run.status;
        for (let i = 0; i < 30; i++) {
          if (
            status !== "queued" &&
            status !== "in_progress" &&
            status !== "cancelling"
          )
            break;
          await new Promise((r) => setTimeout(r, 1000));
          const r2 = await client.beta.threads.runs.retrieve(run.id, {
            thread_id: thread.id,
          });
          status = r2.status;
          console.log(`[Agnes] Run status: ${status}`);
        }

        if (status === "completed") {
          const msgs = await client.beta.threads.messages.list(thread.id, {
            order: "desc",
            limit: 5,
          });
          const assistantMsg =
            msgs.data.find((m) => m.role === "assistant") ?? msgs.data[0];

          for (const c of assistantMsg?.content ?? []) {
            if (c.type === "text") {
              const txt = c.text.value ?? "";
              answer = (answer + "\n" + txt).trim();

              // Coleta de citações
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

          // Limpando marcadores visuais
          answer = answer
            .replace(/【\d+:\d+†source】/g, "")
            .replace(/\[\d+:\d+†source\]/g, "")
            .replace(/\*\*(.*?)\*\*/g, "$1")
            .trim();
        } else {
          console.log("[Agnes] Assistants não concluiu, status:", status);
        }
      } catch (err) {
        console.log("[Agnes] Erro Assistants:", err);
      }
    }

    /* ---------- ESTRATÉGIA 2: Chat Completions (fallback guiado) ---------- */
    if (!answer) {
      try {
        console.log("[Agnes] Fallback Chat Completions...");

        const conversationContext = recentHistory
          .slice()
          .reverse()
          .map((msg) => ({
            role: msg.question ? ("user" as const) : ("assistant" as const),
            content: msg.question || msg.answer,
          }))
          .slice(-4);

        const messages: Array<{
          role: "system" | "user" | "assistant";
          content: string;
        }> = [
          {
            role: "system",
            content: PLATFORM_PRIMER,
          },
          // persona/greeting leve no system complementar
          {
            role: "system",
            content: `${greeting}! ${personality.intro} ${personality.emoji}`,
          },
          // few-shots
          ...FEW_SHOTS.flatMap((fs) => [
            { role: "user" as const, content: fs.user },
            { role: "assistant" as const, content: fs.assistant },
          ]),
          // histórico curto
          ...conversationContext,
          // pergunta atual
          { role: "user", content: question },
        ];

        const completion = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages,
          max_tokens: 900,
          temperature,
          top_p,
          frequency_penalty: freq,
          presence_penalty: pres,
        });

        answer = completion.choices[0]?.message?.content?.trim() ?? "";
      } catch (err) {
        console.log("[Agnes] Erro Chat Completions:", err);
      }
    }

    /* ---------- ESTRATÉGIA 3: Mensagem padrão de segurança ---------- */
    if (!answer) {
      answer =
        "Posso te ajudar com Home Equity e Consórcio de forma consultiva. Se me disser cidade/UF, valor estimado do imóvel e finalidade do crédito, eu já começo a pré-avaliação e agendo um Google Meet.";
    }

    /* ---------- SLOT-FILLING & CTA ---------- */
    const slots = extractSlots(question);

    answer = appendCTA(answer, intent);

    /* ---------- PERSISTÊNCIA DO HISTÓRICO ---------- */
    try {
      await prisma.kbMessage.create({
        data: {
          userId: effectiveUserId,
          question,
          answer,
          citations: citations as any,
        },
      });
    } catch (e) {
      console.log("[Agnes] Aviso: não consegui salvar kbMessage:", e);
    }

    /* ---------- RESPOSTA ---------- */
    return NextResponse.json({
      answer,
      citations,
      source: citations.length > 0 ? "vector_store" : "knowledge_base",
      context: "conversation",
      personality: personality.tone,
      intent,
      seed,
      slotsCaptured: slots,
    });
  } catch (err: any) {
    console.error("[Agnes] Erro fatal:", err?.response?.data ?? err);
    return NextResponse.json(
      { error: err?.message ?? "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
