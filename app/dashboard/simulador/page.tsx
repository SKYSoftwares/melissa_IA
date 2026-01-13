"use client";

import { PDFConfigModal } from "@/components/PDFConfigModal";
import { HomeEquityPDFModal } from "@/components/HomeEquityPDFModal";
import { gerarPDFSimulacao } from "@/components/SimuladorPDF";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  calcularLanceCompleto,
  calcularParcelasConsorcioReduzido,
  calcularParcelasHomeEquity,
  calcularSimulacaoLance,
  simuladorConsorcioLanceFixo,
  simuladorConsorcioLanceVariavel,
  simuladorConsorcioSorteio,
  simuladorConsorcioUnificado,
} from "@/lib/simuladores";
import {
  ArrowLeftRight,
  BarChart3,
  Check,
  DollarSign,
  FileText,
  List,
  Loader2,
  RefreshCw,
  Search,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { gerarPDFHomeEquity } from "@/components/new-simulator";

// ——— % helpers ———
function formatPercentFromNumber(value?: number) {
  if (typeof value !== "number" || isNaN(value)) return "";
  return `${value.toFixed(2).replace(".", ",")}%`;
}

function parsePercentInput(value: string) {
  // mantém só dígitos; "1234" -> 12.34
  const digits = value.replace(/\D/g, "");
  if (!digits) return 0;
  const num = parseInt(digits, 10) / 100;
  return Math.min(Math.max(num, 0), 100); // clamp 0..100
}

export default function SimuladorPage() {
  const session = useSession();
  const [tipoConsorcio, setTipoConsorcio] = useState<string>("lance-fixo");
  const [paramsLanceFixo, setParamsLanceFixo] = useState<any>({});
  const [resultLanceFixo, setResultLanceFixo] = useState<any>(null);
  console.log("resultLanceFixo", resultLanceFixo);
  const [paramsSorteio, setParamsSorteio] = useState<any>({});
  const [resultSorteio, setResultSorteio] = useState<any>(null);
  const [paramsLanceVar, setParamsLanceVar] = useState<any>({});
  const [resultLanceVar, setResultLanceVar] = useState<any>(null);
  const [paramsHomeEquity, setParamsHomeEquity] = useState<any>({});
  const [resultHomeEquity, setResultHomeEquity] = useState<any>(null);
  const [parcelasHomeEquity, setParcelasHomeEquity] = useState<any[]>([]);

  const [loadingConsorcio, setLoadingConsorcio] = useState(false);
  const [loadingLanceFixo, setLoadingLanceFixo] = useState(false);
  const [loadingHomeEquity, setLoadingHomeEquity] = useState(false);
  const [isHomeEquityModalOpen, setIsHomeEquityModalOpen] = useState(false);

  const [segmento, setSegmento] = useState<
    "consorcio-imoveis" | "consorcio-servico" | "consorcio-automovel"
  >("consorcio-imoveis");

  // Estados para valores formatados dos inputs
  const [valorImovelFormatado, setValorImovelFormatado] = useState<string>("");
  const [valorCreditoFormatado, setValorCreditoFormatado] =
    useState<string>("");
  const [paramsLance, setParamsLance] = useState<any>({
    tipoLance: "lance-livre",
  });
  const [resultLance, setResultLance] = useState<any>(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina] = useState(20);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [isCreatingLead, setIsCreatingLead] = useState(false);
  type NewLead = {
    name: string;
    email?: string;
    phone: string;
    ocupation?: string;
    product?: string; // string simples
    potentialValue?: string; // no schema é String; mandamos como texto ("50000" ou "R$ 50.000")
    observations?: string;
    status?: string; // livre; default "novos_leads"
  };

  const [newLead, setNewLead] = useState<NewLead>({
    name: "",
    email: "",
    phone: "",
    ocupation: "",
    product: "consorcio-imoveis",
    potentialValue: "",
    observations: "",
    status: "novos_leads",
  });
  const STATUS_OPTIONS = [
    "novos_leads",
    "em_contato",
    "qualificado",
    "negociacao",
    "ganho",
    "perdido",
  ];

  const PRODUCT_OPTIONS = [
    { value: "consorcio-imoveis", label: "Consórcio Imóveis" },
    { value: "home-equity", label: "Home Equity" },
    { value: "consorcio-automovel", label: "Consórcio Automóvel" },
    { value: "consorcio-servico", label: "Consórcio Serviço" },
  ];
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSavingPDF, setIsSavingPDF] = useState(false);
  const [leadQuery, setLeadQuery] = useState("");

  const filteredLeads = useMemo(() => {
    const q = leadQuery.toLowerCase().trim();
    if (!q) return leads;
    return leads.filter((l) =>
      [l.name, l.phone, l.email]
        .filter(Boolean)
        .some((t: string) => t.toLowerCase().includes(q))
    );
  }, [leads, leadQuery]);
  const [pendingPDFConfig, setPendingPDFConfig] = useState<{
    marcaEmpresa: string;
    logoUrl?: string;
  } | null>(null);
  const [leadFlowContext, setLeadFlowContext] = useState<
    "consorcio" | "home-equity" | null
  >(null);
  const [selectedTab, setSelectedTab] = useState<"consorcio" | "home-equity">(
    "consorcio"
  );
  const [dadosTabelaConsorcio, setDadosTabelaConsorcio] = useState<any[]>([]);

  async function handleConsorcioPDFConfirm(
    nomeUsuario: string,
    leadId: string
  ) {
    try {
      const pdfBase64 = await gerarPDFSimulacao({
        tipoSimulacao: tipoConsorcio,
        paramsLanceFixo,
        resultSorteio,
        resultLanceFixo,
        paramsLance,
        dadosTabela: dadosTabelaConsorcio, // vem do estado
        marcaEmpresa: pendingPDFConfig?.marcaEmpresa ?? "Zeus Capital",
        logoUrl: pendingPDFConfig?.logoUrl,
        // 👇 novo flag para retornar base64 (vamos ajustar a função)
        returnBase64: true as any,
      } as any);

      const res = await fetch("/api/leadFiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          base64: pdfBase64, // base64 sem o prefixo data:
          fileName: "Simulacao-Consorcio.pdf",
          mimeType: "application/pdf",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(
          "Erro ao salvar PDF: " + (err?.error ?? "Erro desconhecido")
        );
      } else {
        toast.success("PDF do consórcio vinculado ao lead com sucesso!");
        setIsLeadModalOpen(false);
        setPendingPDFConfig(null);
        setLeadFlowContext(null);
      }
    } catch (error) {
      console.error("Erro ao gerar/salvar PDF do consórcio:", error);
      toast.error("Erro ao gerar/salvar PDF do consórcio.");
    }
  }
  function b64toBlob(b64Data: string, contentType = "", sliceSize = 512) {
    const byteCharacters = atob(b64Data);
    const byteArrays: Uint8Array[] = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);

      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      byteArrays.push(new Uint8Array(byteNumbers));
    }

    // Fix: Cast byteArrays to BlobPart[] to satisfy type requirements
    return new Blob(byteArrays as BlobPart[], { type: contentType });
  }

  async function handleConsorcioPDFDownload(
    nomeUsuario: string,
    leadId: string
  ) {
    try {
      // 1. Gera PDF em base64 (sem salvar no banco)
      const pdfBase64 = await gerarPDFSimulacao({
        tipoSimulacao: tipoConsorcio,
        paramsLanceFixo,
        resultSorteio,
        resultLanceFixo,
        paramsLance,
        dadosTabela: dadosTabelaConsorcio,
        marcaEmpresa: pendingPDFConfig?.marcaEmpresa ?? "Zeus Capital",
        logoUrl: pendingPDFConfig?.logoUrl,
        returnBase64: true as any,
      } as any);

      if (!pdfBase64) {
        throw new Error("Falha ao gerar PDF em base64");
      }

      // 2. Converte base64 em Blob e força download
      const blob = b64toBlob(pdfBase64, "application/pdf");
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `Simulacao-Consorcio-${nomeUsuario}.pdf`;
      a.click();

      URL.revokeObjectURL(url);

      toast.success("PDF do consórcio gerado para download!");
    } catch (error) {
      console.error("Erro ao gerar PDF do consórcio:", error);
      toast.error("Erro ao gerar PDF do consórcio.");
    }
  }

  async function fetchLeads(userEmail: string, userRole: string) {
    try {
      setLoadingLeads(true);
      const res = await fetch(
        `/api/leads?userEmail=${userEmail}&userRole=${userRole}`
      );
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (e) {
      console.error("Erro ao buscar leads:", e);
    } finally {
      setLoadingLeads(false);
    }
  }
  const qtdParcelasSelecionadas =
    Number(
      tipoConsorcio === "lance-fixo"
        ? paramsLanceFixo?.qtdParcelas
        : tipoConsorcio === "sorteio"
        ? paramsSorteio?.qtdParcelas
        : tipoConsorcio === "lance-variavel"
        ? paramsLanceVar?.qtdParcelas
        : 0
    ) || 0;

  const parcelaContemplacaoPct =
    Number(
      tipoConsorcio === "lance-fixo"
        ? paramsLanceFixo?.parcelaContemplacaoPct
        : tipoConsorcio === "sorteio"
        ? paramsSorteio?.parcelaContemplacaoPct
        : 0
    ) || 0;

  const parcelaContemplacao = useMemo(() => {
    const total = qtdParcelasSelecionadas || 1;
    const mes = Math.ceil((parcelaContemplacaoPct / 100) * total);
    return Math.max(1, Math.min(total, mes));
  }, [qtdParcelasSelecionadas, parcelaContemplacaoPct]);

  // Handlers para cada simulador
  function handleLanceFixo() {
    try {
      setResultLanceFixo(simuladorConsorcioLanceFixo(paramsLanceFixo));
    } catch (e) {
      setResultLanceFixo({ erro: "Parâmetros inválidos" });
    }
  }
  function handleSorteio() {
    try {
      setResultSorteio(simuladorConsorcioSorteio(paramsSorteio));
    } catch (e) {
      setResultSorteio({ erro: "Parâmetros inválidos" });
    }
  }
  function handleLanceVar() {
    try {
      setResultLanceVar(simuladorConsorcioLanceVariavel(paramsLanceVar));
    } catch (e) {
      setResultLanceVar({ erro: "Parâmetros inválidos" });
    }
  }
  async function handleHomeEquity() {
    const toastId = toast.loading("🔄 Calculando Home Equity...", {
      autoClose: false,
    });
    setLoadingHomeEquity(true);
    try {
      setParcelasHomeEquity([]);

      const result = calcularParcelasHomeEquity({
        valorImovel: Number(paramsHomeEquity.valorImovel ?? 0),
        valorCredito: Number(paramsHomeEquity.valorCredito ?? 0),
        prazo: Number(paramsHomeEquity.prazo ?? 0),
        tabelaAmortizacao: paramsHomeEquity.tabelaAmortizacao ?? "PRICE",
        taxa: Number(paramsHomeEquity.taxa ?? 0),
        tipoTaxa: paramsHomeEquity.tipoTaxa ?? "Mensal",
        carencia: Number(paramsHomeEquity.carencia ?? 0),
      });

      if (!result || (result as any).erro) {
        setResultHomeEquity({
          erro: (result as any)?.erro || "Erro no cálculo",
        });
        setParcelasHomeEquity([]);
        toast.update(toastId, {
          render: "❌ Erro no cálculo do Home Equity",
          type: "error",
          isLoading: false,
          autoClose: 5000,
        });
      } else {
        setResultHomeEquity(result.resumo);
        setParcelasHomeEquity(result.parcelas || []);
        toast.update(toastId, {
          render: "✅ Home Equity calculado com sucesso!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      }
    } catch (e) {
      setResultHomeEquity({ erro: "Parâmetros inválidos" });
      setParcelasHomeEquity([]);
      toast.update(toastId, {
        render: "❌ Erro ao calcular Home Equity",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setLoadingHomeEquity(false);
    }
  }

  function handleCalculoLance() {
    const safeParams = {
      creditoUnitario: Number(
        resultLanceFixo?.creditoContratado ?? paramsLance.creditoUnitario ?? 0
      ),
      taxaParcela: Number(paramsLance.taxaParcela ?? 0),
      qtdParcelas: Number(paramsLance.qtdParcelas ?? 0),
      lancePagoParcela: Number(paramsLance.lancePagoParcela ?? 0),
      lanceEmbutidoParcela: Number(paramsLance.lanceEmbutidoParcela ?? 0),
    };
    setResultLance(calcularSimulacaoLance(safeParams));
  }

  // Substituir todos os handlers de cálculo para usar a função unificada
  function handleConsorcioUnificado() {
    // Montar os parâmetros a partir do tipo selecionado
    let params: any = {};
    if (tipoConsorcio === "lance-fixo") {
      params = paramsLanceFixo;
    } else if (tipoConsorcio === "sorteio") {
      params = paramsSorteio;
    } else if (tipoConsorcio === "lance-variavel") {
      params = paramsLanceVar;
    }
    // Garantir valores padrão para todos os campos obrigatórios
    const safeParams = {
      creditoUnitario: Number(
        resultLanceFixo?.creditoContratado ??
          params.creditoUnitario ??
          params.credito ??
          0
      ),
      qtdParcelas: Number(params.qtdParcelas ?? 0),
      taxaParcela: Number(params.taxaParcela ?? 0),
      acrescentarSeguro: params.acrescentarSeguro === true,
      juncaoDeCotas: Number(params.juncaoDeCotas ?? 1),
      percentualParcelaReduzida: Number(
        params.percentualParcelaReduzida ?? 100
      ),
      parcelaContemplacao: params.parcelaContemplacao
        ? Number(params.parcelaContemplacao)
        : undefined,
      mesContemplacao: params.mesContemplacao
        ? Number(params.mesContemplacao)
        : undefined,
    };
    setResultSorteio(simuladorConsorcioUnificado(safeParams));
  }

  // Remover cálculo automático de Lance Fixo do handleConsorcioReduzido
  async function handleConsorcioReduzido() {
    const toastId = toast.loading("🔄 Calculando simulação de consórcio...", {
      autoClose: false,
    });
    setLoadingConsorcio(true);
    try {
      let params: any = {};
      if (tipoConsorcio === "lance-fixo") params = paramsLanceFixo;
      else if (tipoConsorcio === "sorteio") params = paramsSorteio;
      else if (tipoConsorcio === "lance-variavel") params = paramsLanceVar;

      const safeParams = {
        creditoUnitario: Number(
          resultLanceFixo?.creditoContratado ??
            params.creditoUnitario ??
            params.credito ??
            0
        ),
        qtdParcelas: Number(params.qtdParcelas ?? 0),
        taxaParcela: Number(params.taxaParcela ?? 0),
        opcaoParcela: Number(
          params.percentualParcelaReduzida ?? params.opcaoParcela ?? 100
        ),
        parcelaContemplacao:
          Number(params.parcelaContemplacao) > 0
            ? Number(params.parcelaContemplacao)
            : 1,
        mesContemplacao: Number(params.mesContemplacao ?? 1),
      };
      const result = calcularParcelasConsorcioReduzido(safeParams);
      console.log(
        "Debug - Resultado da função calcularParcelasConsorcioReduzido:",
        result
      );
      setResultSorteio(result);

      toast.update(toastId, {
        render: "✅ Simulação de consórcio calculada com sucesso!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (e: any) {
      toast.update(toastId, {
        render: "❌ Erro ao calcular simulação de consórcio",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setLoadingConsorcio(false);
    }
  }

  // Handler para calcular Lance Fixo usando calcularLanceCompleto
  async function handleCalculoLanceFixo() {
    const toastId = toast.loading("🔄 Calculando lance fixo...", {
      autoClose: false,
    });
    setLoadingLanceFixo(true);
    try {
      const creditoContratado = Number(paramsLanceFixo?.creditoUnitario ?? 0);
      const taxaAdministrativaPct = Number(paramsLanceFixo?.taxaParcela ?? 0);
      const totalParcelas = Number(paramsLanceFixo?.qtdParcelas ?? 0);
      const lancePagoParcela = Number(paramsLance?.lancePagoParcela ?? 0);
      const lanceEmbutidoParcela = Number(
        paramsLance?.lanceEmbutidoParcela ?? 0
      );
      const valorParcelaOriginal = resultSorteio?.parcelaAntes ?? 0;

      let tipo: "embutido" | "dinheiro" | "misto" = "misto";
      if (lancePagoParcela > 0 && lanceEmbutidoParcela === 0) tipo = "dinheiro";
      else if (lancePagoParcela === 0 && lanceEmbutidoParcela > 0)
        tipo = "embutido";

      const resultado = calcularLanceCompleto({
        tipo,
        creditoContratado,
        taxaAdministrativaPct,
        valorParcelaOriginal,
        totalParcelas,
        parcelasEmbutidas: lanceEmbutidoParcela,
        parcelasDinheiro: lancePagoParcela,
        parcelaContemplacao: Number(paramsLanceFixo?.parcelaContemplacao ?? 1),
        valorEmbutidoNoCredito:
          lanceEmbutidoParcela * (resultSorteio?.parcelaDepois ?? 0),
        valorEmbutidoNoDinheiro:
          lancePagoParcela * (resultSorteio?.parcelaDepois ?? 0),
      });
      console.log("resultado", resultado);

      setResultLanceFixo(resultado);
      toast.update(toastId, {
        render: "✅ Lance fixo calculado com sucesso!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Erro ao calcular lance fixo:", error);
      setResultLanceFixo({ erro: "Erro ao calcular simulação" });
      toast.update(toastId, {
        render: "❌ Erro ao calcular lance fixo",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setLoadingLanceFixo(false);
    }
  }

  // Função para salvar simulação no banco de dados
  async function handleSalvarSimulacao(
    tipo: "sorteio" | "lance-fixo" | "lance-livre"
  ) {
    try {
      let dadosSimulacao: any = {
        creditoUnitario: Number(
          resultLanceFixo?.creditoContratado ??
            paramsLanceFixo?.creditoUnitario ??
            0
        ),
        taxa: Number(paramsLanceFixo?.taxaParcela ?? 0),
        prazoConsorcio: Number(paramsLanceFixo?.qtdParcelas ?? 0),
        opcaoParcela: String(paramsLanceFixo?.percentualParcelaReduzida ?? 100),
        parcelaContemplacao: paramsLanceFixo?.parcelaContemplacao,
        mesContemplacao: paramsLanceFixo?.mesContemplacao,
        acrescentarSeguro: Boolean(paramsLanceFixo?.acrescentarSeguro ?? false),
      };

      // Adicionar campos específicos para Lance Fixo
      if (tipo === "lance-fixo" && resultLanceFixo) {
        dadosSimulacao = {
          ...dadosSimulacao,
          creditoContratado: resultLanceFixo.creditoContratado,
          creditoLiberado: resultLanceFixo.creditoLiberado,
          valorLance: resultLanceFixo.valorLanceTotal,
          parcelaAntes: resultSorteio?.parcelaAntes,
          parcelaApos: resultLanceFixo.novaParcela,
          saldoDevedor: resultLanceFixo.saldoDevedorFinal,
          parcelasRestantes: resultLanceFixo.parcelasRestantes,
          lancePagoParcela: paramsLance?.lancePagoParcela,
          lanceEmbutidoParcela: paramsLance?.lanceEmbutidoParcela,
        };
      }

      const response = await fetch("/api/simulations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dadosSimulacao),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Simulação ${tipo} salva com sucesso!`);
        return result;
      } else {
        const error = await response.json();
        alert(`Erro ao salvar simulação: ${error.error}`);
      }
    } catch (error) {
      console.error("Erro ao salvar simulação:", error);
      alert("Erro ao salvar simulação");
    }
  }

  function renderResult(result: any) {
    if (!result) return null;
    if (result.erro) return <div className="text-red-600">{result.erro}</div>;
    return (
      <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
        {JSON.stringify(result, null, 2)}
      </pre>
    );
  }

  async function handleHomeEquityPDFDownload(nomeUsuario: string) {
    try {
      const pdfBase64 = await gerarPDFHomeEquity({
        paramsHomeEquity,
        parcelasHomeEquity,
        marcaEmpresa: "Zeus Capital",
        logoUrl: "/images/central.png",
        nomeUsuarioLogado: nomeUsuario,
      });

      // Faz download direto no navegador
      const link = document.createElement("a");
      link.href = "data:application/pdf;base64," + pdfBase64;
      link.download = "Simulacao-Home-Equity.pdf";
      link.click();

      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF.");
    }
  }

  // ⬇️ Substitua TUDO da função por este código
  async function handleHomeEquityPDFConfirm(
    nomeUsuario: string,
    leadId: string
  ) {
    try {
      const pdfBase64 = await gerarPDFHomeEquity({
        paramsHomeEquity,
        parcelasHomeEquity,
        marcaEmpresa: "Zeus Capital",
        logoUrl: "/images/central.png",
        nomeUsuarioLogado: nomeUsuario,
      });

      // 1) Envia pro lead
      let uploaded = false;
      try {
        const res = await fetch("/api/leadFiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leadId,
            base64: pdfBase64,
            fileName: "Simulacao-Home-Equity.pdf",
            mimeType: "application/pdf",
          }),
        });
        uploaded = res.ok;
        if (!uploaded) {
          const err = await res.json().catch(() => ({}));
          toast.error(
            "Erro ao salvar no lead: " + (err?.error ?? "desconhecido")
          );
        }
      } catch {
        toast.error("Erro de rede ao salvar PDF no lead.");
      }

      // 2) Baixa no navegador (sempre)
      const blob = b64toBlob(pdfBase64, "application/pdf");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Simulacao-Home-Equity-${nomeUsuario}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      // 3) Feedback e fecha modal
      toast[uploaded ? "success" : "info"](
        uploaded
          ? "PDF vinculado ao lead e baixado!"
          : "PDF baixado. Falhou ao salvar no lead."
      );
      setIsLeadModalOpen(false);
    } catch (error) {
      console.error("Erro ao gerar/salvar PDF:", error);
      toast.error("Erro ao gerar o PDF.");
    }
  }

  function renderConsorcioForm() {
    const parcelaContemplacaoRaw = Number(
      paramsLanceFixo?.parcelaContemplacao ?? 0
    );
    const qtdParcelasForm = Number(paramsLanceFixo?.qtdParcelas ?? 1);
    const parcelaContemplacaoReal =
      parcelaContemplacaoRaw > 0 ? parcelaContemplacaoRaw : qtdParcelasForm;
    const creditoUnitario = Number(paramsLanceFixo?.creditoUnitario ?? 0);
    const parcelaApos = Number(resultLanceFixo?.novaParcela ?? 0);
    const lancePago = Number(paramsLance?.lancePagoParcela ?? 0) * parcelaApos;
    const valorInvestido =
      parcelaApos * (parcelaContemplacaoReal - 1) + lancePago;
    const creditoContemplado =
      resultLanceFixo?.creditoContratado ?? creditoUnitario;

    // O lucro agora é calculado automaticamente na tabela baseado na porcentagem de venda
    const lucroBruto = 0; // Será calculado dinamicamente na tabela
    const percLucroTotal = 0; // Será calculado dinamicamente na tabela
    const percLucroMes = 0; // Será calculado dinamicamente na tabela

    // Função para obter parcelas corretas da tabela
    const getParcelasFromTable = (tabela: any[]) => {
      if (!tabela || tabela.length === 0) {
        return { parcelaAntes: 0, parcelaDepois: 0 };
      }

      // Encontrar o mês de contemplação na tabela
      const mesContemplacao = parcelaContemplacaoReal;

      // Parcela antes da contemplação (mês anterior ao de contemplação)
      const parcelaAntes =
        mesContemplacao > 1
          ? tabela.find((item) => item.mes === mesContemplacao - 1)?.parcela ||
            0
          : tabela[0]?.parcela || 0;

      // Parcela depois da contemplação (mês de contemplação)
      const parcelaDepois =
        tabela.find((item) => item.mes === mesContemplacao)?.parcela || 0;

      return { parcelaAntes, parcelaDepois };
    };

    // Função para gerar dados da tabela de parcelas
    const gerarDadosTabela = () => {
      const qtdParcelas = Number(paramsLanceFixo?.qtdParcelas ?? 0);
      const parcelaAntes = Number(resultSorteio?.parcelaAntes ?? 0);
      const parcelaDepois = Number(resultSorteio?.parcelaDepois ?? 0);
      const parcelaContemplacaoLocal =
        parcelaContemplacaoRaw > 0 ? parcelaContemplacaoRaw : qtdParcelas;

      // Debug: verificar se parcelaAntes está sendo calculado corretamente
      console.log("Debug - resultSorteio:", resultSorteio);
      console.log("Debug - parcelaAntes:", parcelaAntes);
      console.log("Debug - parcelaDepois:", parcelaDepois);
      const lancePagoParcela = Number(paramsLance?.lancePagoParcela ?? 0);
      const lanceEmbutidoParcela = Number(
        paramsLance?.lanceEmbutidoParcela ?? 0
      );
      const acrescentarINCC = paramsLanceFixo?.acrescentarINCC ?? false;
      const acrescentarSeguro = paramsLanceFixo?.acrescentarSeguro ?? false;
      const fatorSeguro = acrescentarSeguro ? 1.0034 : 1;

      // Obter a porcentagem de venda da cota escolhida
      const porcentagemVendaCota =
        tipoConsorcio === "lance-fixo"
          ? (paramsLanceFixo?.vendaDaCota ?? 0) / 100
          : tipoConsorcio === "sorteio"
          ? (paramsSorteio?.juncaoDeCotas ?? 0) / 100
          : tipoConsorcio === "lance-variavel"
          ? (paramsLanceVar?.juncaoDeCotas ?? 0) / 100
          : 0;

      const dados = [];

      // Obter a taxa de parcela (%) do consórcio selecionado
      const taxaParcela =
        tipoConsorcio === "lance-fixo"
          ? Number(paramsLanceFixo?.taxaParcela ?? 0)
          : tipoConsorcio === "sorteio"
          ? Number(paramsSorteio?.taxaParcela ?? 0)
          : tipoConsorcio === "lance-variavel"
          ? Number(paramsLanceVar?.taxaParcela ?? 0)
          : 0;

      for (let mes = 1; mes <= qtdParcelas; mes++) {
        let valorParcela = parcelaAntes; // Parcela antes da contemplação
        let valorInvestidoMes = 0; // Será calculado dentro do loop
        let creditoContempladoMes = 0;
        let lucroBrutoMes = 0;
        let percLucroTotalMes = 0;
        let percLucroMesMes = 0;
        let lancePagoTotal = 0;
        let lanceEmbutidoTotal = 0;

        // Calcular correção INCC se habilitada
        let fatorINCC = 1;
        if (acrescentarINCC && mes >= 13) {
          // A cada 12 meses (a partir do mês 13), aumenta 6%
          const anosDecorridos = Math.floor((mes - 1) / 12);
          fatorINCC = Math.pow(1.06, anosDecorridos);
        }

        // Calcular valor investido sempre (desde o primeiro mês)
        if (mes < parcelaContemplacaoLocal) {
          // Antes da contemplação - soma acumulada das parcelas (incluindo o mês atual)
          valorParcela = parcelaAntes * fatorINCC * fatorSeguro;
          valorInvestidoMes = parcelaAntes * mes * fatorSeguro;
          creditoContempladoMes = 0;
          // lancePagoTotal e lanceEmbutidoTotal já são 0
          lucroBrutoMes = 0;
          percLucroTotalMes = 0;
          percLucroMesMes = 0;
        } else {
          // A partir do mês de contemplação
          valorParcela =
            (resultLanceFixo?.novaParcela ?? parcelaDepois) *
            fatorINCC *
            fatorSeguro; // Parcela após contemplação com INCC e Seguro

          // Calcular valor investido até este mês (soma acumulada das parcelas)
          const parcelasPagasAntes =
            parcelaAntes * (parcelaContemplacaoLocal - 1) * fatorSeguro;
          lancePagoTotal =
            lancePagoParcela * (resultLanceFixo?.novaParcela ?? parcelaDepois);
          lanceEmbutidoTotal =
            lanceEmbutidoParcela *
            (resultLanceFixo?.novaParcela ?? parcelaDepois);
          const parcelasPagasDepois =
            (resultLanceFixo?.novaParcela ?? parcelaDepois) *
            (mes - parcelaContemplacaoLocal + 1) * // +1 para incluir o mês atual
            fatorINCC *
            fatorSeguro;

          // Valor investido = soma acumulada das parcelas pagas até este mês (incluindo o mês atual)
          valorInvestidoMes = parcelasPagasAntes + parcelasPagasDepois;
          creditoContempladoMes =
            (resultLanceFixo?.creditoContratado ?? creditoUnitario) * fatorINCC;
        }

        // Calcular valor de venda da cota hipotético para cada mês
        const creditoContempladoHipotetico =
          (resultLanceFixo?.creditoContratado ?? creditoUnitario) * fatorINCC;
        const valorVendaCotaCalculado =
          creditoContempladoHipotetico * porcentagemVendaCota;

        // Calcular valor do lance real (apenas após a contemplação real)
        const valorDoLance =
          mes >= parcelaContemplacaoLocal && lanceEmbutidoParcela > 0
            ? creditoContempladoMes - (lancePagoTotal + lanceEmbutidoTotal)
            : 0;

        // Valor embutido do crédito ajustado por INCC para o mês
        const valorEmbutidoCreditoMes =
          lanceEmbutidoParcela *
          (resultLanceFixo?.novaParcela ?? parcelaDepois) *
          fatorINCC;

        // Lucro hipotético em todos os meses
        lucroBrutoMes = valorVendaCotaCalculado - valorInvestidoMes;

        percLucroTotalMes =
          valorInvestidoMes > 0 ? lucroBrutoMes / valorInvestidoMes : 0;
        // Taxa mensal hipotética desde o mês 1
        percLucroMesMes =
          mes > 0 ? Math.pow(1 + percLucroTotalMes, 1 / mes) - 1 : 0;

        dados.push({
          mes,
          credito:
            (resultLanceFixo?.creditoContratado ?? creditoUnitario) * fatorINCC,
          parcela: valorParcela,
          valorInvestido: valorInvestidoMes,
          valorDoLance: valorDoLance,
          valorEmbutidoCredito: valorEmbutidoCreditoMes,
          creditoLiberado:
            (resultLanceFixo?.creditoContratado ?? creditoUnitario) *
              fatorINCC -
            valorEmbutidoCreditoMes,
          creditoContemplado: creditoContempladoMes,
          // Mostrar valor de venda hipotético para todos os meses
          valorVendaCota: valorVendaCotaCalculado,
          lucroBruto: lucroBrutoMes,
          percLucroTotal: percLucroTotalMes,
          percLucroMes: percLucroMesMes,
        });
      }

      return dados;
    };

    const dadosTabela = gerarDadosTabela();

    // Função para exportar PDF com configuração personalizada
    function handleExportarPDF(config: {
      marcaEmpresa: string;
      logoUrl?: string;
    }) {
      gerarPDFSimulacao({
        tipoSimulacao: tipoConsorcio,
        paramsLanceFixo,
        resultSorteio,
        resultLanceFixo,
        paramsLance,
        dadosTabela,
        marcaEmpresa: config.marcaEmpresa,
        logoUrl: config.logoUrl,
      });
    }

    return (
      <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Seção Parâmetros */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <List className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Parâmetros
                  </CardTitle>
                </div>
                <div className="flex items-center space-x-2"></div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Segmento
                  </Label>
                  <Select
                    value={segmento}
                    onValueChange={(v) => setSegmento(v as any)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecione o segmento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consorcio-imoveis">
                        Consórcio de Imóveis
                      </SelectItem>
                      <SelectItem value="consorcio-servico">
                        Consórcio de Serviço
                      </SelectItem>
                      <SelectItem value="consorcio-automovel">
                        Consórcio de Automóvel
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Grupo
                  </Label>
                  <Input className="h-10" placeholder="1080" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Crédito Unitário
                </Label>
                <div className="flex space-x-2">
                  <Input
                    className="flex-1 h-10"
                    placeholder="R$ 100.000,00"
                    value={
                      tipoConsorcio === "lance-fixo"
                        ? paramsLanceFixo?.creditoUnitario
                          ? formatCurrencyInput(
                              (paramsLanceFixo.creditoUnitario * 100).toString()
                            )
                          : ""
                        : tipoConsorcio === "sorteio"
                        ? paramsSorteio?.credito
                          ? formatCurrencyInput(
                              (paramsSorteio.credito * 100).toString()
                            )
                          : ""
                        : tipoConsorcio === "lance-variavel"
                        ? paramsLanceVar?.credito
                          ? formatCurrencyInput(
                              (paramsLanceVar.credito * 100).toString()
                            )
                          : ""
                        : ""
                    }
                    onChange={(e) => {
                      // Remove tudo que não é número para obter apenas os dígitos
                      const digitsOnly = e.target.value.replace(/\D/g, "");

                      // Converte dígitos para centavos (cada dígito = 1 centavo)
                      const centavos = parseInt(digitsOnly, 10) || 0;

                      // Converte centavos para reais para salvar no estado
                      const reais = centavos / 100;

                      if (tipoConsorcio === "lance-fixo") {
                        setParamsLanceFixo((p: any) => ({
                          ...p,
                          creditoUnitario: reais,
                        }));
                      } else if (tipoConsorcio === "sorteio") {
                        setParamsSorteio((p: any) => ({
                          ...p,
                          credito: reais,
                        }));
                      } else if (tipoConsorcio === "lance-variavel") {
                        setParamsLanceVar((p: any) => ({
                          ...p,
                          credito: reais,
                        }));
                      }
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Qtd Parcelas
                  </Label>
                  <Input
                    className="h-10"
                    type="number"
                    placeholder="200"
                    value={
                      tipoConsorcio === "lance-fixo"
                        ? paramsLanceFixo?.qtdParcelas ?? ""
                        : tipoConsorcio === "sorteio"
                        ? paramsSorteio?.qtdParcelas ?? ""
                        : tipoConsorcio === "lance-variavel"
                        ? paramsLanceVar?.qtdParcelas ?? ""
                        : ""
                    }
                    onChange={(e) => {
                      const numericValue = parseInt(e.target.value) || 0;
                      if (tipoConsorcio === "lance-fixo") {
                        setParamsLanceFixo((p: any) => ({
                          ...p,
                          qtdParcelas: numericValue,
                        }));
                      } else if (tipoConsorcio === "sorteio") {
                        setParamsSorteio((p: any) => ({
                          ...p,
                          qtdParcelas: numericValue,
                        }));
                      } else if (tipoConsorcio === "lance-variavel") {
                        setParamsLanceVar((p: any) => ({
                          ...p,
                          qtdParcelas: numericValue,
                        }));
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Taxa Parcela (%)
                  </Label>
                  <Input
                    className="h-10"
                    inputMode="numeric"
                    placeholder="0,00%"
                    value={
                      tipoConsorcio === "lance-fixo"
                        ? paramsLanceFixo?.taxaParcela != null
                          ? formatPercentFromNumber(paramsLanceFixo.taxaParcela)
                          : ""
                        : tipoConsorcio === "sorteio"
                        ? paramsSorteio?.taxaParcela != null
                          ? formatPercentFromNumber(paramsSorteio.taxaParcela)
                          : ""
                        : tipoConsorcio === "lance-variavel"
                        ? paramsLanceVar?.taxaParcela != null
                          ? formatPercentFromNumber(paramsLanceVar.taxaParcela)
                          : ""
                        : ""
                    }
                    onChange={(e) => {
                      const pct = parsePercentInput(e.target.value);
                      if (tipoConsorcio === "lance-fixo") {
                        setParamsLanceFixo((p: any) => ({
                          ...p,
                          taxaParcela: pct,
                        }));
                      } else if (tipoConsorcio === "sorteio") {
                        setParamsSorteio((p: any) => ({
                          ...p,
                          taxaParcela: pct,
                        }));
                      } else if (tipoConsorcio === "lance-variavel") {
                        setParamsLanceVar((p: any) => ({
                          ...p,
                          taxaParcela: pct,
                        }));
                      }
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Venda da Cota (%)
                  </Label>
                  <Input
                    className="h-10"
                    inputMode="numeric"
                    placeholder="0,00%"
                    value={
                      tipoConsorcio === "lance-fixo"
                        ? paramsLanceFixo?.vendaDaCota != null
                          ? formatPercentFromNumber(paramsLanceFixo.vendaDaCota)
                          : ""
                        : tipoConsorcio === "sorteio"
                        ? paramsSorteio?.juncaoDeCotas != null
                          ? formatPercentFromNumber(paramsSorteio.juncaoDeCotas)
                          : ""
                        : tipoConsorcio === "lance-variavel"
                        ? paramsLanceVar?.juncaoDeCotas != null
                          ? formatPercentFromNumber(
                              paramsLanceVar.juncaoDeCotas
                            )
                          : ""
                        : ""
                    }
                    onChange={(e) => {
                      const pct = parsePercentInput(e.target.value);
                      if (tipoConsorcio === "lance-fixo") {
                        setParamsLanceFixo((p: any) => ({
                          ...p,
                          vendaDaCota: pct,
                        }));
                      } else if (tipoConsorcio === "sorteio") {
                        setParamsSorteio((p: any) => ({
                          ...p,
                          juncaoDeCotas: pct,
                        }));
                      } else if (tipoConsorcio === "lance-variavel") {
                        setParamsLanceVar((p: any) => ({
                          ...p,
                          juncaoDeCotas: pct,
                        }));
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Opção de parcela
                  </Label>
                  <Select
                    onValueChange={(v) => {
                      if (tipoConsorcio === "lance-fixo") {
                        setParamsLanceFixo((p: any) => ({
                          ...p,
                          percentualParcelaReduzida: Number(v),
                        }));
                      } else if (tipoConsorcio === "sorteio") {
                        setParamsSorteio((p: any) => ({
                          ...p,
                          percentualParcelaReduzida: Number(v),
                        }));
                      }
                    }}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">50%</SelectItem>
                      <SelectItem value="75">75%</SelectItem>
                      <SelectItem value="100">100%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Acrescentar Seguro?
                  </Label>
                  <Select
                    onValueChange={(v) => {
                      if (tipoConsorcio === "lance-fixo") {
                        setParamsLanceFixo((p: any) => ({
                          ...p,
                          acrescentarSeguro: v === "true",
                        }));
                      } else if (tipoConsorcio === "sorteio") {
                        setParamsSorteio((p: any) => ({
                          ...p,
                          acrescentarSeguro: v === "true",
                        }));
                      } else if (tipoConsorcio === "lance-variavel") {
                        setParamsLanceVar((p: any) => ({
                          ...p,
                          acrescentarSeguro: v === "true",
                        }));
                      }
                    }}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Sim</SelectItem>
                      <SelectItem value="false">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Acrescentar INCC?
                  </Label>
                  <Select
                    onValueChange={(v) => {
                      if (tipoConsorcio === "lance-fixo") {
                        setParamsLanceFixo((p: any) => ({
                          ...p,
                          acrescentarINCC: v === "true",
                        }));
                      } else if (tipoConsorcio === "sorteio") {
                        setParamsSorteio((p: any) => ({
                          ...p,
                          acrescentarINCC: v === "true",
                        }));
                      } else if (tipoConsorcio === "lance-variavel") {
                        setParamsLanceVar((p: any) => ({
                          ...p,
                          acrescentarINCC: v === "true",
                        }));
                      }
                    }}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Sim</SelectItem>
                      <SelectItem value="false">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Parcela de Contemplação (mês)
                </Label>
                <Input
                  className="h-10"
                  type="number"
                  min={1}
                  max={qtdParcelasSelecionadas || 1}
                  placeholder="1"
                  value={
                    tipoConsorcio === "lance-fixo"
                      ? paramsLanceFixo?.parcelaContemplacao ?? ""
                      : tipoConsorcio === "sorteio"
                      ? paramsSorteio?.parcelaContemplacao ?? ""
                      : ""
                  }
                  onChange={(e) => {
                    const total = qtdParcelasSelecionadas || 1;
                    const raw = Number(e.target.value) || 1;
                    const v = Math.max(1, Math.min(Math.floor(raw), total));
                    if (tipoConsorcio === "lance-fixo") {
                      setParamsLanceFixo((p: any) => ({
                        ...p,
                        parcelaContemplacao: v,
                      }));
                    } else if (tipoConsorcio === "sorteio") {
                      setParamsSorteio((p: any) => ({
                        ...p,
                        parcelaContemplacao: v,
                      }));
                    }
                  }}
                />
                <div className="text-xs text-gray-500">
                  De 1 até {qtdParcelasSelecionadas || 1}
                </div>
              </div>

              {/* Campos específicos para Lance Variável */}
              {tipoConsorcio === "lance-variavel" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Parcelas Pagas
                    </Label>
                    <Input
                      className="h-10"
                      placeholder="0"
                      value={
                        paramsLanceVar?.parcelasPagas
                          ? paramsLanceVar.parcelasPagas.toString()
                          : ""
                      }
                      onChange={(e) => {
                        const numericValue = parseInt(e.target.value) || 0;
                        setParamsLanceVar((p: any) => ({
                          ...p,
                          parcelasPagas: numericValue,
                        }));
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Parcelas Embutidas
                    </Label>
                    <Input
                      className="h-10"
                      placeholder="0"
                      value={
                        paramsLanceVar?.parcelasEmbutidas
                          ? paramsLanceVar.parcelasEmbutidas.toString()
                          : ""
                      }
                      onChange={(e) => {
                        const numericValue = parseInt(e.target.value) || 0;
                        setParamsLanceVar((p: any) => ({
                          ...p,
                          parcelasEmbutidas: numericValue,
                        }));
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Campo específico para Lance Variável */}
              {tipoConsorcio === "lance-variavel" && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Usar INCC?
                  </Label>
                  <Select
                    onValueChange={(v) =>
                      setParamsLanceVar((p: any) => ({
                        ...p,
                        usarINCC: v === "true",
                      }))
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Sim</SelectItem>
                      <SelectItem value="false">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Ajuste do botão para chamar o handler correto e garantir parâmetros válidos */}
              <div className="pt-2 flex justify-center">
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-base font-semibold"
                  onClick={handleConsorcioReduzido}
                  type="button"
                  disabled={loadingConsorcio}
                >
                  {loadingConsorcio ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Carregando...
                    </span>
                  ) : (
                    "Calcular simulação"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Seção Lance */}
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Wallet className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Lance
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Tipo do Lance
                </Label>
                <div className="flex items-center space-x-2">
                  <Select
                    value={paramsLance?.tipoLance ?? "lance-livre"}
                    onValueChange={(v) =>
                      setParamsLance((p: any) => ({
                        ...p,
                        tipoLance: v,
                      }))
                    }
                  >
                    <SelectTrigger className="flex-1 h-10">
                      <SelectValue placeholder="Selecione o tipo de lance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lance-livre">Lance Livre</SelectItem>
                      <SelectItem value="lance-fixo">Lance Fixo</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-2"
                    type="button"
                    onClick={() => {
                      setParamsLance((p: any) => ({
                        ...p,
                        tipoLance:
                          (p?.tipoLance ?? "lance-livre") === "lance-livre"
                            ? "lance-fixo"
                            : "lance-livre",
                      }));
                    }}
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <Wallet className="h-4 w-4 text-green-600" />
                    <span>Lance Pago em Dinheiro</span>
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="px-2">
                      -
                    </Button>
                    <Input
                      className="flex-1 h-10 text-center"
                      type="number"
                      min={0}
                      max={
                        maxParcelas - (paramsLance?.lanceEmbutidoParcela ?? 0)
                      }
                      value={paramsLance?.lancePagoParcela ?? 0}
                      onChange={(e) => {
                        const novoValor = Number(e.target.value);
                        const outroCampo =
                          paramsLance?.lanceEmbutidoParcela ?? 0;
                        if (novoValor + outroCampo <= maxParcelas) {
                          setParamsLance((p: any) => ({
                            ...p,
                            lancePagoParcela: novoValor,
                          }));
                        }
                      }}
                    />
                    <span className="text-sm text-gray-600">parcelas</span>
                    <span className="text-xs text-gray-500">
                      Máximo: {resultSorteio?.qtdParcelas ?? "-"} parcelas
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span>Lance Embutido na Carta</span>
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="px-2">
                      -
                    </Button>
                    <Input
                      className="flex-1 h-10 text-center"
                      type="number"
                      min={0}
                      max={maxParcelas - (paramsLance?.lancePagoParcela ?? 0)}
                      value={paramsLance?.lanceEmbutidoParcela ?? 0}
                      onChange={(e) => {
                        const novoValor = Number(e.target.value);
                        const outroCampo = paramsLance?.lancePagoParcela ?? 0;
                        if (novoValor + outroCampo <= maxParcelas) {
                          setParamsLance((p: any) => ({
                            ...p,
                            lanceEmbutidoParcela: novoValor,
                          }));
                        }
                      }}
                    />
                    <span className="text-sm text-gray-600">parcelas</span>
                    <span className="text-xs text-gray-500">
                      Máximo: {resultSorteio?.qtdParcelas ?? "-"} parcelas
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-100 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-blue-800">
                    Valor embutido do crédito:{" "}
                    {formatCurrency(
                      lanceEmbutidoParcela * (resultSorteio?.parcelaDepois ?? 0)
                    )}
                  </div>
                </div>
                <div className="bg-green-100 border border-green-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-green-800">
                    Valor em dinheiro:{" "}
                    {formatCurrency(
                      lancePagoParcela * (resultSorteio?.parcelaDepois ?? 0)
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-100 rounded-lg p-3">
                <div className="text-xs text-gray-600">
                  100% embutido no Fixo e 50% do valor ofertado no lance
                  limitado, livre e fidelidade.
                </div>
              </div>

              <Button
                onClick={handleCalculoLanceFixo}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium"
                disabled={loadingLanceFixo}
              >
                {loadingLanceFixo ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Carregando...
                  </span>
                ) : (
                  "Calcular Simulação"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Resultados - Cards de Opções */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Resultados da Simulação
            </h3>
            <PDFConfigModal
              onExport={(config) => {
                const dadosTabela = gerarDadosTabela();
                setDadosTabelaConsorcio(dadosTabela);

                setPendingPDFConfig(config);

                setLeadFlowContext("consorcio");

                setIsLeadModalOpen(true);
                fetchLeads(
                  session.data?.user?.email ?? "",
                  session.data?.user?.role ?? ""
                );
              }}
            >
              <></>
            </PDFConfigModal>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card Sorteio - sempre visível */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">
                        Sorteio
                      </CardTitle>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                      <BarChart3 className="h-3 w-3 text-blue-600" />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Crédito contratado:</span>
                  <span className="font-medium">
                    {formatCurrency(dadosTabela?.[0]?.credito)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxa Administrativa:</span>
                  <span className="font-medium">
                    {formatCurrency(
                      (dadosTabela?.[0]?.credito || 0) *
                        (paramsLanceFixo?.taxaParcela / 100)
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Saldo Devedor Inicial:</span>
                  <span className="font-medium">
                    {formatCurrency(
                      (dadosTabela?.[0]?.credito || 0) +
                        ((dadosTabela?.[0]?.credito || 0) *
                          (paramsLanceFixo?.taxaParcela || 0)) /
                          100
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Parcela antes da contemplação:
                  </span>
                  <span className="font-medium text-blue-600">
                    {formatCurrency(
                      getParcelasFromTable(dadosTabela).parcelaAntes
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Parcela após contemplação:
                  </span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(
                      getParcelasFromTable(dadosTabela).parcelaDepois
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Saldo devedor:</span>
                  <span className="font-medium">
                    {formatCurrency(resultSorteio?.saldoDevedor)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Valor investido até contemplação:
                  </span>
                  <span className="font-medium">
                    {formatCurrency(resultSorteio?.valorPago)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Parcelas Restantes:</span>
                  <span className="font-medium">
                    {dadosTabela &&
                    dadosTabela.length > 0 &&
                    parcelaContemplacaoReal
                      ? Math.max(
                          0,
                          dadosTabela.length - parcelaContemplacaoReal
                        )
                      : "-"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Card Lance Fixo */}
            {paramsLance?.tipoLance === "lance-fixo" && (
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <FileText className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">
                          Lance fixo
                        </CardTitle>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                        <BarChart3 className="h-3 w-3 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Crédito contratado:</span>
                    <span className="font-medium">
                      {formatCurrency(dadosTabela?.[0]?.credito)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Taxa Administrativa:</span>
                    <span className="font-medium">
                      {formatCurrency(
                        paramsLance?.tipoLance === "lance-fixo" &&
                          resultLanceFixo
                          ? resultLanceFixo?.taxaAdministrativa
                          : 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Saldo Devedor Inicial:
                    </span>
                    <span className="font-medium">
                      {formatCurrency(
                        paramsLance?.tipoLance === "lance-fixo" &&
                          resultLanceFixo
                          ? resultLanceFixo?.saldoDevedorInicial
                          : 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Valor Total do Lance:</span>
                    <span className="font-medium">
                      {formatCurrency(
                        paramsLance?.tipoLance === "lance-fixo" &&
                          resultLanceFixo
                          ? resultLanceFixo?.valorLanceTotal
                          : 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Crédito Liberado (no mês):
                    </span>
                    <div className="flex items-center space-x-1">
                      <span className="font-medium text-green-600">
                        {formatCurrency(dadosTabela?.[0]?.creditoLiberado)}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Saldo Devedor Final:</span>
                    <span className="font-medium">
                      {formatCurrency(
                        paramsLance?.tipoLance === "lance-fixo" &&
                          resultLanceFixo
                          ? (resultLanceFixo?.saldoDevedorInicial ?? 0) -
                              (resultLanceFixo?.valorLanceTotal ?? 0)
                          : 0
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Parcela antes da contemplação:
                    </span>
                    <span className="font-medium text-blue-600">
                      {formatCurrency(
                        getParcelasFromTable(dadosTabela).parcelaAntes
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Parcela após contemplação:
                    </span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(
                        getParcelasFromTable(dadosTabela).parcelaDepois
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Parcelas Restantes:</span>
                    <span className="font-medium">
                      {dadosTabela &&
                      dadosTabela.length > 0 &&
                      parcelaContemplacaoReal
                        ? Math.max(
                            0,
                            dadosTabela.length - parcelaContemplacaoReal
                          )
                        : "-"}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700 text-xs"
                    >
                      Pago: {paramsLance?.lancePagoParcela ?? 0}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-red-100 text-red-700 text-xs"
                    >
                      Emb: {paramsLance?.lanceEmbutidoParcela ?? 0}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Card Lance Livre */}
            {paramsLance?.tipoLance === "lance-livre" && (
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <FileText className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">
                          Lance livre
                        </CardTitle>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                        <BarChart3 className="h-3 w-3 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Crédito contratado:</span>
                    <span className="font-medium">
                      {formatCurrency(dadosTabela?.[0]?.credito)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Taxa Administrativa:</span>
                    <span className="font-medium">
                      {formatCurrency(
                        paramsLance?.tipoLance === "lance-livre" &&
                          resultLanceFixo
                          ? resultLanceFixo?.taxaAdministrativa
                          : 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Saldo Devedor Inicial:
                    </span>
                    <span className="font-medium">
                      {formatCurrency(
                        paramsLance?.tipoLance === "lance-livre" &&
                          resultLanceFixo
                          ? resultLanceFixo?.saldoDevedorInicial
                          : 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Valor Total do Lance:</span>
                    <span className="font-medium">
                      {formatCurrency(
                        paramsLance?.tipoLance === "lance-livre" &&
                          resultLanceFixo
                          ? resultLanceFixo?.valorLanceTotal
                          : 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Crédito Liberado:</span>
                    <div className="flex items-center space-x-1">
                      <span className="font-medium text-green-600">
                        {formatCurrency(dadosTabela?.[0]?.creditoLiberado)}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Saldo Devedor Final:</span>
                    <span className="font-medium">
                      {formatCurrency(
                        paramsLance?.tipoLance === "lance-livre" &&
                          resultLanceFixo
                          ? (resultLanceFixo?.saldoDevedorInicial ?? 0) -
                              (resultLanceFixo?.valorLanceTotal ?? 0)
                          : 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Parcela antes da contemplação:
                    </span>
                    <span className="font-medium text-blue-600">
                      {formatCurrency(
                        getParcelasFromTable(dadosTabela).parcelaAntes
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Parcela após contemplação:
                    </span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(
                        getParcelasFromTable(dadosTabela).parcelaDepois
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Parcelas Restantes:</span>
                    <span className="font-medium">
                      {dadosTabela &&
                      dadosTabela.length > 0 &&
                      parcelaContemplacaoReal
                        ? Math.max(
                            0,
                            dadosTabela.length - parcelaContemplacaoReal
                          )
                        : "-"}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700 text-xs"
                    >
                      Pago: {paramsLance?.lancePagoParcela ?? 0}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-red-100 text-red-700 text-xs"
                    >
                      Emb: {paramsLance?.lanceEmbutidoParcela ?? 0}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Tabela de Simulação */}
        {resultSorteio && dadosTabela.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Tabela de Simulação</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>Total de parcelas: {dadosTabela.length}</span>
                  <span>•</span>
                  <span>
                    Página {paginaAtual} de{" "}
                    {Math.ceil(dadosTabela.length / itensPorPagina)}
                  </span>
                </div>
                <Button
                  onClick={() => {
                    const dadosTabela = gerarDadosTabela();
                    setDadosTabelaConsorcio(dadosTabela);
                    setPendingPDFConfig({
                      marcaEmpresa: "Zeus Capital",
                      logoUrl: "/images/zeus-capital-logo.png",
                    });
                    setLeadFlowContext("consorcio");
                    setIsLeadModalOpen(true);
                    fetchLeads(
                      session.data?.user?.email ?? "",
                      session.data?.user?.role ?? ""
                    );
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>Exportar PDF</span>
                </Button>
              </div>
            </div>

            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-3 py-2 text-left font-medium text-gray-700">
                        Mês
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-gray-700">
                        Crédito
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-gray-700">
                        Parcela
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-gray-700">
                        Valor Investido
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-gray-700">
                        Valor embutido do crédito
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-gray-700">
                        Crédito Liberado
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-gray-700">
                        Valor de Venda da Cota
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-gray-700">
                        Lucro
                      </th>
                      <th className="px-3 py-2 text-right font-medium text-gray-700">
                        % Lucro ao Mês
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dadosTabela
                      .slice(
                        (paginaAtual - 1) * itensPorPagina,
                        paginaAtual * itensPorPagina
                      )
                      .map((item, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="px-3 py-2 text-center font-medium">
                            {item.mes === parcelaContemplacaoReal ? (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                {item.mes}*
                              </span>
                            ) : (
                              item.mes
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {formatCurrency(item.credito)}
                          </td>
                          <td className="px-3 py-2 text-right font-medium">
                            {item.mes >= parcelaContemplacaoReal ? (
                              <span className="text-green-600">
                                {formatCurrency(item.parcela)}
                              </span>
                            ) : (
                              <span className="text-blue-600">
                                {formatCurrency(item.parcela)}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {formatCurrency(item.valorInvestido)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {formatCurrency(
                              (paramsLance?.lanceEmbutidoParcela ?? 0) *
                                (resultSorteio?.parcelaDepois ?? 0) *
                                (item.mes >= 13 &&
                                (paramsLanceFixo?.acrescentarINCC ?? false)
                                  ? Math.pow(
                                      1.06,
                                      Math.floor((item.mes - 1) / 12)
                                    )
                                  : 1)
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {formatCurrency(item.creditoLiberado)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {item.mes >= parcelaContemplacao ? (
                              <span className="font-medium text-blue-600">
                                {formatCurrency(item.valorVendaCota)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {item.lucroBruto > 0 ? (
                              <span className="text-green-600 font-medium">
                                {formatCurrency(item.lucroBruto)}
                              </span>
                            ) : (
                              <span className="text-gray-500">
                                {formatCurrency(item.lucroBruto)}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {item.percLucroMes > 0 ? (
                              <span className="text-green-600 font-medium">
                                {(item.percLucroMes * 100).toFixed(2)}%
                              </span>
                            ) : (
                              <span className="text-gray-500">
                                {(item.percLucroMes * 100).toFixed(2)}%
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {dadosTabela.length > itensPorPagina && (
                <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                  <div className="text-sm text-gray-600">
                    Mostrando {(paginaAtual - 1) * itensPorPagina + 1} a{" "}
                    {Math.min(paginaAtual * itensPorPagina, dadosTabela.length)}{" "}
                    de {dadosTabela.length} parcelas
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPaginaAtual(Math.max(1, paginaAtual - 1))
                      }
                      disabled={paginaAtual === 1}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm text-gray-600">
                      {paginaAtual} de{" "}
                      {Math.ceil(dadosTabela.length / itensPorPagina)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPaginaAtual(
                          Math.min(
                            Math.ceil(dadosTabela.length / itensPorPagina),
                            paginaAtual + 1
                          )
                        )
                      }
                      disabled={
                        paginaAtual ===
                        Math.ceil(dadosTabela.length / itensPorPagina)
                      }
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Legenda */}
            <div className="mt-4 text-xs text-gray-600">
              <p>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  *
                </span>{" "}
                Mês de contemplação
              </p>
              <p>
                <span className="text-blue-600">
                  Parcela antes da contemplação
                </span>{" "}
                •{" "}
                <span className="text-green-600">
                  Parcela após contemplação
                </span>
              </p>
              {paramsLanceFixo?.acrescentarINCC && (
                <p>
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                    +6%
                  </span>{" "}
                  Correção INCC aplicada a cada 12 meses (a partir do mês 13)
                </p>
              )}
            </div>
          </div>
        )}
        {/* */}
        {/* Use as fórmulas fornecidas pelo usuário, considerando Entrada = 0. */}
      </>
    );
  }

  // Função utilitária para formatar moeda
  function formatCurrency(value: number | undefined) {
    if (typeof value !== "number" || isNaN(value)) return "-";
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  // Função para formatar valor em Reais enquanto digita (contador de centavos)
  function formatCurrencyInput(value: string): string {
    // Remove tudo que não é número
    const numericValue = value.replace(/\D/g, "");

    if (numericValue === "") return "";

    // Converte para centavos (cada dígito = 1 centavo)
    const centavos = parseInt(numericValue, 10);

    // Converte centavos para reais
    const reais = centavos / 100;

    // Formata como moeda brasileira
    return reais.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  // Função para extrair valor numérico de string formatada (contador de centavos)
  function extractNumericValue(formattedValue: string): number {
    // Remove R$, espaços e pontos, mantém apenas vírgulas e números
    const cleanValue = formattedValue.replace(/[R$\s.]/g, "").replace(",", ".");
    const reais = parseFloat(cleanValue) || 0;

    // Converte reais para centavos (multiplica por 100)
    return reais * 100;
  }
  const maxParcelas = resultSorteio?.qtdParcelas ?? 0;

  const saldoDevedor = resultSorteio?.saldoDevedor ?? 0;
  const qtdParcelas = paramsLanceFixo?.qtdParcelas ?? 0;
  // Valor da parcela após contemplação: deve ser SEMPRE o valor de Sorteio
  const parcelaAposContemplacao =
    resultLanceFixo?.novaParcela ?? resultSorteio?.parcelaDepois;
  const lancePagoParcela = Number(paramsLance?.lancePagoParcela ?? 0);
  const lanceEmbutidoParcela = Number(paramsLance?.lanceEmbutidoParcela ?? 0);
  // Soma total do lance: (Lance Pago em Dinheiro + Lance Embutido na Carta) * Parcela após contemplação do Sorteio
  const parcelaAposContemplacaoSorteio =
    resultLanceFixo?.novaParcela ?? resultSorteio?.parcelaDepois ?? 0;
  const somaTotalLance =
    (lancePagoParcela + lanceEmbutidoParcela) * parcelaAposContemplacaoSorteio;
  const valorTotalLance = somaTotalLance;

  useEffect(() => {
    const safeParams = {
      creditoUnitario: Number(
        resultLanceFixo?.creditoContratado ?? paramsLance.creditoUnitario ?? 0
      ),
      taxaParcela: Number(paramsLance.taxaParcela ?? 0),
      qtdParcelas: Number(paramsLance.qtdParcelas ?? 0),
      lancePagoParcela: Number(paramsLance.lancePagoParcela ?? 0),
      lanceEmbutidoParcela: Number(paramsLance.lanceEmbutidoParcela ?? 0),
    };
    setResultLance(calcularSimulacaoLance(safeParams));
  }, [paramsLance, resultLanceFixo]);

  // Resetar página quando os parâmetros mudarem
  useEffect(() => {
    setPaginaAtual(1);
  }, [paramsLanceFixo, resultSorteio]);

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold mb-6">Simuladores Financeiros</h2>
      <Tabs
        value={selectedTab}
        onValueChange={(val) => setSelectedTab(val as any)}
      >
        <TabsList className="grid w-full grid-cols-2 bg-white border border-gray-200">
          <TabsTrigger value="consorcio">Consórcio</TabsTrigger>
          <TabsTrigger value="home-equity">Home Equity</TabsTrigger>
        </TabsList>

        {/* Consórcio */}
        <TabsContent value="consorcio" className="space-y-6">
          <div className="space-y-6">{renderConsorcioForm()}</div>
        </TabsContent>

        {/* Home Equity */}
        <TabsContent value="home-equity" className="space-y-6">
          <div className="space-y-6">
            {/* Seção Cálculo */}
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Cálculo
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Coluna Esquerda */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Cálculo
                      </Label>
                      <Select
                        value={paramsHomeEquity?.tabelaAmortizacao || "PRICE"}
                        onValueChange={(v) =>
                          setParamsHomeEquity((p: any) => ({
                            ...p,
                            tabelaAmortizacao: v as "PRICE" | "SAC",
                          }))
                        }
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PRICE">Price</SelectItem>
                          <SelectItem value="SAC">SAC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Valor Imóvel
                      </Label>
                      <Input
                        className="h-10"
                        type="text"
                        placeholder="R$ 0,00"
                        value={valorImovelFormatado}
                        onChange={(e) => {
                          const formattedValue = formatCurrencyInput(
                            e.target.value
                          );
                          const novoValorImovel =
                            extractNumericValue(formattedValue) / 100;
                          setValorImovelFormatado(formattedValue);

                          // Verificar se o valor do crédito atual excede 60% do novo valor do imóvel
                          const valorCreditoAtual =
                            extractNumericValue(valorCreditoFormatado) / 100;
                          if (
                            novoValorImovel > 0 &&
                            valorCreditoAtual > novoValorImovel * 0.6
                          ) {
                            // Ajustar automaticamente o valor do crédito para 60% do imóvel
                            const novoValorCredito = novoValorImovel * 0.6;
                            const novoValorCreditoFormatado =
                              formatCurrencyInput(
                                (novoValorCredito * 100).toString()
                              );
                            setValorCreditoFormatado(novoValorCreditoFormatado);
                            setParamsHomeEquity((p: any) => ({
                              ...p,
                              valorImovel: novoValorImovel,
                              valorCredito: novoValorCredito,
                            }));
                            toast.info(
                              "ℹ️ Valor do crédito ajustado automaticamente para 60% do imóvel",
                              {
                                autoClose: 4000,
                              }
                            );
                          } else {
                            setParamsHomeEquity((p: any) => ({
                              ...p,
                              valorImovel: novoValorImovel,
                            }));
                          }
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Taxa Juros
                      </Label>
                      <Input
                        className="h-10"
                        type="number"
                        placeholder="0,00"
                        step="0.01"
                        value={paramsHomeEquity?.taxa ?? ""}
                        onChange={(e) =>
                          setParamsHomeEquity((p: any) => ({
                            ...p,
                            taxa: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                  </div>

                  {/* Coluna Direita */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Carência
                      </Label>
                      <Select
                        value={paramsHomeEquity?.carencia?.toString() || "0"}
                        onValueChange={(v) =>
                          setParamsHomeEquity((p: any) => ({
                            ...p,
                            carencia: Number(v),
                          }))
                        }
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Sem carência</SelectItem>
                          <SelectItem value="1">1 mês</SelectItem>
                          <SelectItem value="2">2 meses</SelectItem>
                          <SelectItem value="3">3 meses</SelectItem>
                          <SelectItem value="4">4 meses</SelectItem>
                          <SelectItem value="5">5 meses</SelectItem>
                          <SelectItem value="6">6 meses</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      {/* Cabeçalho do campo */}
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-gray-700">
                          Valor Crédito
                        </Label>

                        {valorImovelFormatado && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              Máx:{" "}
                              {formatCurrency(
                                (extractNumericValue(valorImovelFormatado) /
                                  100) *
                                  0.6
                              )}{" "}
                              (60%)
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => {
                                const valorImovelNumerico =
                                  extractNumericValue(valorImovelFormatado) /
                                  100;
                                const valorCreditoMaximo =
                                  valorImovelNumerico * 0.6;
                                const valorCreditoFormatado =
                                  formatCurrencyInput(
                                    (valorCreditoMaximo * 100).toString()
                                  );
                                setValorCreditoFormatado(valorCreditoFormatado);
                                setParamsHomeEquity((p: any) => ({
                                  ...p,
                                  valorCredito: valorCreditoMaximo,
                                }));
                                toast.success(
                                  "✅ Valor do crédito definido como 60% do imóvel",
                                  {
                                    autoClose: 2000,
                                  }
                                );
                              }}
                            >
                              Usar 60%
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Input */}
                      <Input
                        className="h-10"
                        type="text"
                        placeholder="R$ 0,00"
                        value={valorCreditoFormatado}
                        onChange={(e) => {
                          const formattedValue = formatCurrencyInput(
                            e.target.value
                          );
                          const valorCreditoNumerico =
                            extractNumericValue(formattedValue) / 100;
                          const valorImovelNumerico =
                            extractNumericValue(valorImovelFormatado) / 100;

                          if (
                            valorImovelNumerico > 0 &&
                            valorCreditoNumerico > valorImovelNumerico * 0.6
                          ) {
                            toast.error(
                              "❌ O valor do crédito não pode ser superior a 60% do imóvel",
                              {
                                autoClose: 5000,
                              }
                            );
                            return;
                          }

                          setValorCreditoFormatado(formattedValue);
                          setParamsHomeEquity((p: any) => ({
                            ...p,
                            valorCredito: valorCreditoNumerico,
                          }));
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Qtd parcelas
                      </Label>
                      <Input
                        className="h-10"
                        type="number"
                        placeholder="240"
                        max={240}
                        value={paramsHomeEquity?.prazo ?? ""}
                        onChange={(e) => {
                          const rawValue = Number(e.target.value || 0);
                          const clamped = Math.max(0, Math.min(240, rawValue));
                          setParamsHomeEquity((p: any) => ({
                            ...p,
                            prazo: clamped,
                          }));
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex justify-between mt-6">
                  <Button
                    variant="outline"
                    className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                    onClick={() => {
                      setValorImovelFormatado("");
                      setValorCreditoFormatado("");
                      setParamsHomeEquity({});
                      setResultHomeEquity(null);
                      setParcelasHomeEquity([]);
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Nova Simulação
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleHomeEquity}
                    disabled={loadingHomeEquity}
                  >
                    {loadingHomeEquity ? (
                      <span className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Carregando...
                      </span>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Simular Operação
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Seção Simulação */}
            {resultHomeEquity && (
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader className="border-b border-gray-100 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Simulação
                    </CardTitle>
                    <Button
                      onClick={() => {
                        setIsLeadModalOpen(true);
                        // você pode passar userEmail/userRole do contexto ou props
                        fetchLeads(
                          session.data?.user?.email ?? "",
                          session.data?.user?.role ?? ""
                        );
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Gerar PDF</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Tabela de Amortização */}
                  {parcelasHomeEquity.length > 0 && (
                    <div className="mt-6">
                      <div className="bg-white border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-xs">
                            <thead>
                              <tr className="bg-gray-50 border-b">
                                <th className="px-3 py-2 text-left font-medium text-gray-700">
                                  Parcela
                                </th>
                                <th className="px-3 py-2 text-right font-medium text-gray-700">
                                  Saldo devedor
                                </th>
                                <th className="px-3 py-2 text-right font-medium text-gray-700">
                                  Amortização
                                </th>
                                <th className="px-3 py-2 text-right font-medium text-gray-700">
                                  Juros
                                </th>
                                <th className="px-3 py-2 text-right font-medium text-gray-700">
                                  Seguro MIP
                                </th>
                                <th className="px-3 py-2 text-right font-medium text-gray-700">
                                  Seguro DFI
                                </th>
                                <th className="px-3 py-2 text-right font-medium text-gray-700">
                                  Valor da Parcela
                                </th>
                                <th className="px-3 py-2 text-center font-medium text-gray-700">
                                  Indexador
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {parcelasHomeEquity.map((item, index) => (
                                <tr
                                  key={index}
                                  className="border-b hover:bg-gray-50"
                                >
                                  <td className="px-3 py-2 text-center font-medium">
                                    {item.parcela}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    {formatCurrency(item.saldoDevedorHome)}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    {formatCurrency(item.amortizacao)}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    {formatCurrency(item.juros)}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    {formatCurrency(item.seguroMIP)}
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    {formatCurrency(item.seguroDFI)}
                                  </td>
                                  <td className="px-3 py-2 text-right font-medium text-green-600">
                                    {formatCurrency(item.valorParcela)}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <span className="text-xs text-gray-600">
                                      +IPCA
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal para Home Equity PDF */}
      {/* <HomeEquityPDFModal
        isOpen={isHomeEquityModalOpen}
        onClose={() => setIsHomeEquityModalOpen(false)}
        onConfirm={handleHomeEquityPDFConfirm}
      /> */}

      {isLeadModalOpen && (
        <div className="fixed inset-0 z-50">
          {/* overlay com blur/gradiente */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          <div className="relative z-10 flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-slate-50 to-white px-6 py-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                      Vincular PDF a um Lead
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Escolha um lead existente ou crie um novo. Você pode
                      baixar o PDF ou salvar o arquivo diretamente no lead.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsLeadModalOpen(false)}
                    className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
                    aria-label="Fechar"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="space-y-6 px-6 py-5">
                {/* Busca + Select de Leads */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Selecionar Lead
                  </label>

                  <div className="mb-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="Buscar por nome, email ou telefone…"
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none ring-0 transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                      value={leadQuery}
                      onChange={(e) => setLeadQuery(e.target.value)}
                    />
                    <Button
                      onClick={() => setIsCreatingLead(true)}
                      variant="outline"
                      className="shrink-0"
                    >
                      Criar novo lead
                    </Button>
                  </div>

                  <div className="relative">
                    {loadingLeads ? (
                      <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Carregando leads...
                      </div>
                    ) : (
                      <select
                        value={selectedLead || ""}
                        onChange={(e) => setSelectedLead(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                      >
                        <option value="">Selecione um lead</option>
                        {filteredLeads.map((lead) => (
                          <option key={lead.id} value={lead.id}>
                            {lead.name} — {lead.phone}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Form de criação de Lead */}
                {isCreatingLead && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                    <h3 className="mb-3 text-sm font-semibold text-slate-700">
                      Novo Lead
                    </h3>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {/* Nome */}
                      <div className="col-span-1 sm:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                          Nome *
                        </label>
                        <input
                          type="text"
                          placeholder="Ex.: Maria Silva"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                          value={newLead.name}
                          onChange={(e) =>
                            setNewLead({ ...newLead, name: e.target.value })
                          }
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                          Email
                        </label>
                        <input
                          type="email"
                          placeholder="maria@email.com"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                          value={newLead.email || ""}
                          onChange={(e) =>
                            setNewLead({ ...newLead, email: e.target.value })
                          }
                        />
                      </div>

                      {/* Telefone */}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                          Telefone *
                        </label>
                        <input
                          type="text"
                          placeholder="(11) 9 9999-9999"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                          value={newLead.phone}
                          onChange={(e) =>
                            setNewLead({ ...newLead, phone: e.target.value })
                          }
                        />
                      </div>

                      {/* Profissão */}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                          Profissão
                        </label>
                        <input
                          type="text"
                          placeholder="Ex.: Engenheira"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                          value={newLead.ocupation || ""}
                          onChange={(e) =>
                            setNewLead({
                              ...newLead,
                              ocupation: e.target.value,
                            })
                          }
                        />
                      </div>

                      {/* Produto */}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                          Produto
                        </label>
                        <select
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                          value={newLead.product || "consorcio-imoveis"}
                          onChange={(e) =>
                            setNewLead({ ...newLead, product: e.target.value })
                          }
                        >
                          {PRODUCT_OPTIONS.map((p) => (
                            <option key={p.value} value={p.value}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Status */}
                      {/* <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                          Status
                        </label>
                        <select
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                          value={newLead.status || "novos_leads"}
                          onChange={(e) =>
                            setNewLead({ ...newLead, status: e.target.value })
                          }
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div> */}

                      {/* Valor Potencial */}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                          Valor Potencial
                        </label>
                        <div className="flex items-center rounded-lg border border-slate-200 px-3 py-2">
                          <span className="mr-2 select-none text-xs text-slate-500">
                            R$
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="0,00"
                            className="w-full text-sm outline-none"
                            value={newLead.potentialValue || ""}
                            onChange={(e) =>
                              setNewLead({
                                ...newLead,
                                potentialValue: e.target.value,
                              })
                            }
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400">
                          Campo livre (texto). Ex.: 120000 ou 120.000,00
                        </p>
                      </div>

                      {/* Observações (textarea, ocupa 2 colunas) */}
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                          Observações
                        </label>
                        <textarea
                          rows={4}
                          placeholder="Anotações, contexto do lead, interesses, etc."
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                          value={newLead.observations || ""}
                          onChange={(e) =>
                            setNewLead({
                              ...newLead,
                              observations: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsCreatingLead(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        className="bg-green-600 text-white"
                        onClick={async () => {
                          if (!newLead.name || !newLead.phone) {
                            alert("Preencha pelo menos Nome e Telefone");
                            return;
                          }
                          const res = await fetch("/api/leads", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              ...newLead,
                              // mantenha a compatibilidade com seu backend
                              userEmail: session?.data?.user?.email,
                            }),
                          });

                          if (res.ok) {
                            const created = await res.json();
                            setSelectedLead(created.id);
                            setLeads((prev) => [created, ...prev]);
                            setIsCreatingLead(false);
                          } else {
                            const error = await res.json();
                            alert(error.error || "Erro ao criar lead");
                          }
                        }}
                      >
                        Salvar Lead
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-4 sm:flex-row">
                <div className="text-xs text-slate-500">
                  Dica: “Gerar PDF” baixa o arquivo. “Salvar no Lead” anexa no
                  CRM.
                </div>

                <div className="flex items-center gap-2">
                  {/* Gerar PDF (download) */}
                  <Button
                    className="bg-purple-600 text-white"
                    onClick={async () => {
                      const lead = leads.find((l) => l.id === selectedLead);
                      const nomeLead =
                        lead?.name || `${session.data?.user?.name}`;
                      console.log(leadFlowContext);
                      if (selectedTab === "home-equity") {
                        await handleHomeEquityPDFDownload(nomeLead);
                      } else {
                        await handleConsorcioPDFDownload(
                          nomeLead,
                          selectedLead || ""
                        );
                      }
                    }}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Gerando…
                      </span>
                    ) : (
                      "Gerar PDF"
                    )}
                  </Button>

                  <Button
                    onClick={() => setIsLeadModalOpen(false)}
                    variant="outline"
                  >
                    Cancelar
                  </Button>

                  {/* Salvar no lead (vincula no banco) */}
                  <Button
                    className="bg-blue-600 text-white"
                    onClick={async () => {
                      if (!selectedLead) return alert("Selecione um lead");
                      const lead = leads.find((l) => l.id === selectedLead);
                      const nomeLead =
                        lead?.name || `${session.data?.user?.name}`;
                      try {
                        setIsSavingPDF(true);
                        if (selectedTab === "home-equity") {
                          await handleHomeEquityPDFConfirm(
                            nomeLead,
                            selectedLead
                          );
                        } else {
                          await handleConsorcioPDFConfirm(
                            nomeLead,
                            selectedLead
                          );
                        }
                      } finally {
                        setIsSavingPDF(false);
                      }
                    }}
                    disabled={!selectedLead || isSavingPDF}
                  >
                    {isSavingPDF ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Salvando…
                      </span>
                    ) : (
                      "Salvar no Lead"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
