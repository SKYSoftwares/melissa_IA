"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  User,
  Copy,
  Loader2,
  AlertCircle,
  Clock,
  Quote,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

type Citation = { file_id: string; quote?: string };
type KbMessage = {
  id?: string;
  question: string;
  answer: string;
  createdAt?: string;
  citations?: Citation[];
};

export default function AgnesChat() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<KbMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const hasHistory = history.length > 0;

  async function loadHistory() {
    setError(null);
    try {
      const res = await fetch("/api/agnes/ask/history?limit=50");
      const json = await res.json();
      if (!res.ok)
        throw new Error(json?.error || "Falha ao carregar histórico");
      setHistory(json.history ?? []);
    } catch (e: any) {
      setError(e?.message || "Erro ao carregar histórico");
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, loading]);

  const canSend = useMemo(() => q.trim().length > 0 && !loading, [q, loading]);

  async function ask() {
    const question = q.trim();
    if (!question) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agnes/ask-varied", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (res.status === 401) {
        setError("Você precisa estar logado para perguntar.");
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Falha na pergunta");

      setHistory((prev) => [
        {
          id: crypto.randomUUID(),
          question,
          answer: json.answer ?? "",
          createdAt: new Date().toISOString(),
          citations: json.citations as Citation[] | undefined,
        },
        ...prev,
      ]);
      setQ("");
    } catch (e: any) {
      setError(e?.message || "Erro ao enviar pergunta");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && canSend) {
      e.preventDefault();
      void ask();
    }
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  }

  function clearLocal() {
    setHistory([]);
  }

  return (
    <div className="w-full">
      <Card className="border-none shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 flex items-center justify-center rounded-md bg-black text-white">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">
                  Agnes — Assistente de Conhecimento
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Respostas com base na documentação em PDF
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadHistory}
                disabled={loading}
              >
                <RotateCcw className="h-4 w-4 mr-1" /> Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="h-[55vh] md:h-[60vh] w-full rounded-md border bg-white">
            <ScrollArea className="h-full w-full">
              <div ref={scrollRef} className="p-4 space-y-6">
                {!hasHistory && !loading && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Sem mensagens ainda. Faça uma
                    pergunta para começar.
                  </div>
                )}

                {history
                  .slice()
                  .reverse()
                  .map((m) => (
                    <div key={m.id} className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-200">
                          <User className="h-4 w-4 text-gray-700" />
                        </div>
                        <div className="max-w-[85%] rounded-2xl bg-gray-100 px-4 py-3 text-sm whitespace-pre-wrap">
                          {m.question}
                          {m.createdAt && (
                            <div className="mt-1 text-[11px] text-gray-500">
                              {new Date(m.createdAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 flex items-center justify-center rounded-full bg-black text-white">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="max-w-[85%] rounded-2xl bg-white px-4 py-3 text-sm shadow-sm border whitespace-pre-wrap">
                          <div className="leading-relaxed">{m.answer}</div>
                          {!!m.citations?.length && (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              {m.citations.map((c, i) => (
                                <Badge
                                  key={i}
                                  variant="secondary"
                                  className="font-normal text-xs"
                                >
                                  <Quote className="h-3 w-3 mr-1" /> {c.file_id}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <div className="mt-2 flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleCopy(m.answer)}
                            >
                              <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                {loading && (
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 flex items-center justify-center rounded-full bg-black text-white">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="max-w-[85%] rounded-2xl bg-white px-4 py-3 text-sm shadow-sm border">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Pensando…
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]">
            <Textarea
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escreva sua pergunta… (Shift+Enter para nova linha)"
              className="min-h-[56px] max-h-40"
            />
            <div className="flex gap-2 items-start md:items-stretch">
              <Button
                onClick={() => ask()}
                disabled={!canSend}
                className="md:h-[56px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando
                  </>
                ) : (
                  "Perguntar"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={clearLocal}
                disabled={loading}
                className="md:h-[56px]"
              >
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
