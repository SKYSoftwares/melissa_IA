"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "next-auth/react";
import {
  User,
  Building2,
  FileText,
  CheckCircle,
  Upload,
  Trash2,
  Plus,
  ArrowRight,
  ArrowLeft,
  Home,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Briefcase,
  DollarSign,
  FileImage,
  File,
  Receipt,
  CreditCard,
  Heart,
  Info,
  AlertCircle,
  Send,
  Save,
  Users,
  Camera,
  ClipboardList,
  Building,
  Landmark,
  FileCheck,
  FileX,
  FilePlus,
  FileMinus,
} from "lucide-react";
import { UploadSecao } from "@/components/uploadSessao";
type Documento = File & {
  url?: string; // para arquivos vindos do Firebase
  originalName?: string; // nome original salvo no backend
  id?: string; // id no banco, se existir
};

const proponenteCampos = {
  cpf: "",
  telefone: "",
  email: "",
  nascimento: "",
  ocupacao: "",
  renda: "",
  nomeEmpresa: "",
  cnpj: "",
  // Dados habitacionais
  endereco: "",
  bairro: "",
  cep: "",
  cidadeUf: "",
  // Documentos pessoais
  identificacao: [] as File[],
  comprovanteResidencia: [] as File[],
  certidaoEstadoCivil: [] as File[],
  holerite: [] as File[],
  extrato: [] as File[],
  declaracaoIR: [] as File[],
  reciboIR: [] as File[],
  contratoAluguel: [] as File[],
  escrituraPacto: [] as File[],
  outrosDocumentos: [] as File[],
};

const imovelCampos = {
  endereco: "",
  bairro: "",
  valorEstimado: "",
  valorCredito: "",
  cep: "",
  tipoImovel: "",
  donos: [] as string[],
  matricula: [] as Documento[],
  iptu: [] as Documento[],
  habiteSe: [] as Documento[],
  alvaraConstrucao: [] as Documento[],
  fotos: [] as Documento[],
  outros: [] as Documento[],
};

export default function NovaPropostaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const user = session?.user;
  const leadId = searchParams.get("leadId");
  const [lead, setLead] = useState<any>(null);

  const fetchLead = async () => {
    const response = await fetch(`/api/leads/${leadId}`);
    const data = await response.json();
    console.log(data);
    setLead(data);
  };

  useEffect(() => {
    if (leadId) {
      fetchLead();
    }
  }, [leadId]);

  type BackendFile = {
    id: string;
    url: string;
    originalName?: string;
    name?: string;
    size?: number;
    type?: string;
  };

  type UploadFile = File | BackendFile;

  interface UploadSecaoProps {
    idx: number;
    titulo: string;
    descricao: string;
    icone: React.ReactNode;
    bg: string;
    field: string;
    files: UploadFile[];
    handleChange: (idx: number, field: string, newFiles: UploadFile[]) => void;
  }

  type DocumentoProponente = {
    identificacao: UploadFile[];
    comprovanteResidencia: UploadFile[];
    certidaoEstadoCivil: UploadFile[];
    holerite: UploadFile[];
    extrato: UploadFile[];
    declaracaoIR: UploadFile[];
    reciboIR: UploadFile[];
    contratoAluguel: UploadFile[];
    escrituraPacto: UploadFile[];
    outrosDocumentos: UploadFile[];
  };

  function agruparArquivosPorTipo(
    arquivos: (UploadFile & { documentType?: string; proponenteId?: string })[]
  ): DocumentoProponente[] {
    // agrupa por proponenteId (ou joga no índice 0 se não tiver)
    const agrupadoPorProponente: Record<string, DocumentoProponente> = {};

    arquivos.forEach((file) => {
      const propKey = file.proponenteId || "0"; // se não tiver, joga no grupo 0
      if (!agrupadoPorProponente[propKey]) {
        agrupadoPorProponente[propKey] = {
          identificacao: [],
          comprovanteResidencia: [],
          certidaoEstadoCivil: [],
          holerite: [],
          extrato: [],
          declaracaoIR: [],
          reciboIR: [],
          contratoAluguel: [],
          escrituraPacto: [],
          outrosDocumentos: [],
        };
      }

      const tipo = file.documentType as keyof DocumentoProponente | undefined;

      // só aceita se o tipo existe no DocumentoProponente
      if (tipo && tipo in agrupadoPorProponente[propKey]) {
        // só empurra para outrosDocumentos se for EXATAMENTE "outrosDocumentos"
        if (tipo === "outrosDocumentos") {
          agrupadoPorProponente[propKey].outrosDocumentos.push(file);
        } else {
          (agrupadoPorProponente[propKey][tipo] as UploadFile[]).push(file);
        }
      }
      // caso contrário: ignora o arquivo
    });

    return Object.values(agrupadoPorProponente);
  }

  const [tab, setTab] = useState("proponente");
  const [proponentes, setProponentes] = useState([{ ...proponenteCampos }]);
  const [arquivos, setArquivos] = useState([]);

  const [pendencias, setPendencias] = useState<string[]>([]);
  const arquivosAgrupados: DocumentoProponente[] =
    agruparArquivosPorTipo(arquivos);

  const [imoveis, setImoveis] = useState([{ ...imovelCampos }]);
  const [pendenciasImovel, setPendenciasImovel] = useState<string[]>([]);
  const [defesa, setDefesa] = useState("");
  const [defesaErro, setDefesaErro] = useState("");
  const [checklist, setChecklist] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Atualizar pendências automaticamente quando dados mudarem
  useEffect(() => {
    if (tab === "proponente") {
      const allPend = proponentes.flatMap(validarProponente);
      setPendencias(allPend);
    } else if (tab === "imovel") {
      const allPend = imoveis.flatMap(validarImovel);
      setPendenciasImovel(allPend);
    }
  }, [proponentes, imoveis, tab]);

  // Validação básica de campos obrigatórios
  function validarProponente(p: any) {
    const pend: string[] = [];
    if (!p.cpf) pend.push("CPF");
    if (!p.telefone) pend.push("Telefone");
    if (!p.email) pend.push("E-mail");
    if (!p.nascimento) pend.push("Data de nascimento");
    if (!p.ocupacao) pend.push("Ocupação profissional");
    if (!p.renda) pend.push("Renda mensal comprovada");
    if (!p.nomeEmpresa) pend.push("Nome da empresa");
    if (!p.endereco) pend.push("Endereço");
    if (!p.bairro) pend.push("Bairro");
    if (!p.cep) pend.push("CEP");
    if (!p.cidadeUf) pend.push("Cidade/UF");
    return pend;
  }

  function handleProponenteChange(idx: number, field: string, value: any) {
    setProponentes((prev) =>
      prev.map((p, i) => {
        if (i !== idx) return p;
        // Campos que são arrays de arquivos
        const camposArquivo = [
          "identificacao",
          "comprovanteResidencia",
          "certidaoEstadoCivil",
          "holerite",
          "extrato",
          "declaracaoIR",
          "reciboIR",
          "contratoAluguel",
          "escrituraPacto",
          "outrosDocumentos",
        ];
        if (camposArquivo.includes(field)) {
          return {
            ...p,
            [field]: Array.isArray(value) ? value : value ? [value] : [],
          };
        }
        // Campos simples (string, data, etc)
        return { ...p, [field]: value };
      })
    );
  }

  function handleAddProponente() {
    setProponentes((prev) => [...prev, { ...proponenteCampos }]);
  }

  function handleRemoveProponente(idx: number) {
    setProponentes((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleNext() {
    // Valida todos os proponentes
    const allPend = proponentes.flatMap(validarProponente);
    setPendencias(allPend);
    if (allPend.length === 0) setTab("imovel");
  }

  function validarImovel(im: any) {
    const pend: string[] = [];
    if (!im.endereco) pend.push("Endereço do imóvel");
    if (!im.bairro) pend.push("Bairro do imóvel");
    if (!im.valorEstimado) pend.push("Valor estimado do imóvel");
    if (!im.valorCredito) pend.push("Valor de crédito solicitado");
    if (!im.cep) pend.push("CEP do imóvel");
    if (!im.tipoImovel) pend.push("Tipo do imóvel");
    if (!im.donos || im.donos.length === 0) pend.push("Donos do imóvel");
    if (!im.matricula || im.matricula.length === 0)
      pend.push("Matrícula do imóvel");
    if (!im.iptu || im.iptu.length === 0) pend.push("IPTU");
    if (!im.fotos || im.fotos.length < 3) pend.push("Mínimo 3 fotos do imóvel");
    return pend;
  }

  function handleImovelChange(idx: number, field: string, value: any) {
    setImoveis((prev) =>
      prev.map((im, i) =>
        i === idx
          ? {
              ...im,
              // Campos que são arrays de arquivos
              [field]: [
                "matricula",
                "iptu",
                "habiteSe",
                "alvaraConstrucao",
                "fotos",
                "outros",
              ].includes(field)
                ? Array.isArray(value)
                  ? value
                  : value
                  ? [value]
                  : []
                : value, // Campos simples como string
            }
          : im
      )
    );
  }
  function handleImovelFotosChange(idx: number, files: File[] | null) {
    setImoveis((prev) =>
      prev.map((im, i) =>
        i === idx ? { ...im, fotos: addFiles(im.fotos || [], files || []) } : im
      )
    );
  }
  function handleAddImovel() {
    setImoveis((prev) => [...prev, { ...imovelCampos }]);
  }
  function handleRemoveImovel(idx: number) {
    setImoveis((prev) => prev.filter((_, i) => i !== idx));
  }
  function handleNextImovel() {
    const allPend = imoveis.flatMap(validarImovel);
    setPendenciasImovel(allPend);
    if (allPend.length === 0) setTab("defesa");
  }

  function handleNextDefesa() {
    if (!defesa.trim()) {
      setDefesaErro("Campo obrigatório");
      return;
    }
    setDefesaErro("");
    setTab("finalizacao");
  }

  // utilitário para converter File → base64
  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  const { proposalId } = useParams<{ proposalId: string }>();
  const [proposal, setProposal] = useState<any>(null);

  useEffect(() => {
    if (proposalId) {
      fetch(`/api/proposals/${proposalId}`)
        .then((res) => res.json())
        .then((data) => {
          // 🔄 Converte phone → telefone, dataNascimento → nascimento nos proponentes
          const proponentesConvertidos = (data.proponentes || []).map(
            (p: any) => ({
              ...p,
              telefone: p.phone,
              phone: undefined,
              renda: p.rendaMensal,
              nascimento: p.dataNascimento,
            })
          );

          // 🔄 Converte imóveis: address → endereco, neighborhood → bairro, etc.
          const imoveisConvertidos = (data.imoveis || []).map((i: any) => {
            // filtra arquivos deste imóvel
            const arquivosImovel = (data.arquivos || []).filter((f: any) =>
              f.documentType?.startsWith("imovel_")
            );

            return {
              ...i,
              endereco: i.address,
              bairro: i.neighborhood,
              valorCredito: i.creditValue,
              valorEstimado: i.value,
              cep: i.zipCode,
              tipoImovel: i.type,
              donos: (i.owners || []).map((o: any) => o.name),

              // cada grupo de documentos
              matricula: arquivosImovel.filter(
                (a: any) => a.documentType === "imovel_matricula"
              ),
              iptu: arquivosImovel.filter(
                (a: any) => a.documentType === "imovel_iptu"
              ),
              habiteSe: arquivosImovel.filter(
                (a: any) => a.documentType === "imovel_habiteSe"
              ),
              alvaraConstrucao: arquivosImovel.filter(
                (a: any) => a.documentType === "imovel_alvaraConstrucao"
              ),
              fotos: arquivosImovel.filter(
                (a: any) => a.documentType === "imovel_fotos"
              ),
              outros: arquivosImovel.filter(
                (a: any) => a.documentType === "imovel_outros"
              ),
            };
          });

          setProposal(data);
          setProponentes(
            proponentesConvertidos.length > 0
              ? proponentesConvertidos
              : [{ ...proponenteCampos }]
          );
          setImoveis(
            imoveisConvertidos.length > 0
              ? imoveisConvertidos
              : [{ ...imovelCampos }]
          );
          setDefesa(data.description || "");
          setArquivos(data.arquivos || []);
        });
    }
  }, [proposalId]);
  function isBackendFile(file: UploadFile): file is BackendFile {
    return (file as BackendFile).url !== undefined;
  }
  async function buildPayload() {
    const serializeFiles = async (files?: UploadFile[]) => {
      if (!files || !Array.isArray(files)) return [];
      return Promise.all(
        files.map(async (file) => {
          if (isBackendFile(file)) {
            return {
              id: (file as any).id,
              name: file.originalName || file.name || "arquivo",
              size: file.size ?? 0,
              type: file.type ?? "application/octet-stream",
              url: file.url,
            };
          } else {
            return {
              name: file.name,
              size: file.size,
              type: file.type,
              base64: await fileToBase64(file),
            };
          }
        })
      );
    };

    return {
      leadId,
      proponentes: await Promise.all(
        proponentes.map(async (p) => ({
          cpf: p.cpf,
          telefone: p.telefone,
          email: p.email,
          nascimento: p.nascimento,
          ocupacao: p.ocupacao,
          renda: p.renda,
          nomeEmpresa: p.nomeEmpresa,
          cnpj: p.cnpj,
          endereco: p.endereco,
          bairro: p.bairro,
          cep: p.cep,
          cidadeUf: p.cidadeUf,

          identificacao: await serializeFiles(p.identificacao),
          comprovanteResidencia: await serializeFiles(p.comprovanteResidencia),
          certidaoEstadoCivil: await serializeFiles(p.certidaoEstadoCivil),
          holerite: await serializeFiles(p.holerite),
          extrato: await serializeFiles(p.extrato),
          declaracaoIR: await serializeFiles(p.declaracaoIR),
          reciboIR: await serializeFiles(p.reciboIR),
          contratoAluguel: await serializeFiles(p.contratoAluguel),
          escrituraPacto: await serializeFiles(p.escrituraPacto),
          outrosDocumentos: await serializeFiles(p.outrosDocumentos),
        }))
      ),

      imoveis: await Promise.all(
        imoveis.map(async (i) => ({
          endereco: i.endereco,
          bairro: i.bairro,
          valorEstimado: i.valorEstimado,
          valorCredito: i.valorCredito,
          cep: i.cep,
          tipoImovel: i.tipoImovel,
          donos: i.donos,

          matricula: await serializeFiles(i.matricula),
          iptu: await serializeFiles(i.iptu),
          habiteSe: await serializeFiles(i.habiteSe),
          alvaraConstrucao: await serializeFiles(i.alvaraConstrucao),
          fotos: await serializeFiles(i.fotos),
          outros: await serializeFiles(i.outros),
        }))
      ),

      defesa,
      userEmail: user?.email || "",
    };
  }

  function gerarChecklistAtual() {
    const pend: string[] = [];
    proponentes.forEach((p, i) =>
      pend.push(...validarProponente(p).map((f) => `Proponente ${i + 1}: ${f}`))
    );
    imoveis.forEach((im, i) =>
      pend.push(...validarImovel(im).map((f) => `Imóvel ${i + 1}: ${f}`))
    );
    if (!defesa.trim()) pend.push("Defesa Comercial não preenchida");
    return pend;
  }

  // Função utilitária para adicionar arquivos sem duplicar
  function addFiles(prevFiles: File[], newFiles: FileList | File[]): File[] {
    const filesArray = Array.from(newFiles);
    // Evita duplicatas pelo nome e tamanho
    const all = [...prevFiles, ...filesArray];
    const unique = all.filter(
      (file, idx, arr) =>
        arr.findIndex((f) => f.name === file.name && f.size === file.size) ===
        idx
    );
    return unique;
  }

  // Função utilitária para remover arquivo por índice
  function removeFile(files: File[], idx: number): File[] {
    return files.filter((_, i) => i !== idx);
  }

  // Função para formatar CPF
  function formatarCPF(value: string): string {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6)
      return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9)
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(
        6
      )}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(
      6,
      9
    )}-${numbers.slice(9, 11)}`;
  }

  // Função para formatar telefone
  function formatarTelefone(value: string): string {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 6)
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10)
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(
        6
      )}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(
      7,
      11
    )}`;
  }

  // Função para formatar CEP
  function formatarCEP(value: string): string {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  }

  // Função para formatar CNPJ
  function formatarCNPJ(value: string): string {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 5)
      return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    if (numbers.length <= 8)
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(
        5
      )}`;
    if (numbers.length <= 12)
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(
        5,
        8
      )}/${numbers.slice(8)}`;
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(
      5,
      8
    )}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
  }

  // Função para formatar valores monetários
  function formatarMoeda(value: string): string {
    // Remove tudo exceto números
    const numbers = value.replace(/\D/g, "");

    if (numbers === "") return "";

    // Converte para número (tratando como centavos)
    const number = parseInt(numbers);
    if (isNaN(number)) return "";

    // Formata como moeda brasileira com centavos
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(number / 100);
  }

  // Função para converter valor formatado de volta para número
  function converterMoedaParaNumero(value: string): number {
    const numbers = value.replace(/\D/g, "");
    return numbers ? parseInt(numbers) / 100 : 0;
  }

  async function handleEnviarProposta() {
    setEnviando(true);
    setFeedback(null);

    try {
      if (proponentes.length === 0 || imoveis.length === 0) {
        setFeedback(
          "É necessário preencher pelo menos um proponente e um imóvel"
        );
        return;
      }

      const payload = await buildPayload();

      // Se já existe proposalId → edita (PATCH), senão cria (POST)
      const url = proposalId
        ? `/api/proposals/edit/${proposalId}`
        : "/api/proposals";
      const method = proposalId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        setFeedback(
          proposalId
            ? "Proposta atualizada com sucesso!"
            : "Proposta enviada com sucesso!"
        );

        setTimeout(() => {
          router.push("/dashboard/propostas");
        }, 2000);
      } else {
        const err = await response.json();
        setFeedback(err.error || "Erro ao salvar proposta");
      }
    } catch (e) {
      console.error("Erro ao enviar proposta:", e);
      setFeedback("Erro inesperado ao salvar proposta");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Nova Proposta</h1>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FileText className="w-4 h-4" />
          <span>
            Lead vinculado:{" "}
            <span className="font-semibold text-blue-600">
              {proposal?.lead?.name || proposalId}
            </span>
          </span>
        </div>
      </div>

      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileText className="w-6 h-6 text-blue-600" />
            Formulário de Proposta
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8 bg-gray-100 p-1 rounded-lg">
              <TabsTrigger
                value="proponente"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Proponente</span>
              </TabsTrigger>
              <TabsTrigger
                value="imovel"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Imóvel</span>
              </TabsTrigger>
              <TabsTrigger
                value="defesa"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Defesa</span>
              </TabsTrigger>
              <TabsTrigger
                value="finalizacao"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <ClipboardList className="w-4 h-4" />
                <span className="hidden sm:inline">Documentos</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="proponente">
              {proponentes.map((p, idx) => (
                <div
                  key={idx}
                  className="mb-8 bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
                >
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          Proponente {idx + 1}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Informações pessoais e profissionais
                        </p>
                      </div>
                    </div>
                    {proponentes.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveProponente(idx)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remover
                      </Button>
                    )}
                  </div>

                  {/* Dados Pessoais */}
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-6">
                      <User className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-lg text-gray-900">
                        Dados Pessoais
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>CPF *</Label>
                        <Input
                          value={p.cpf}
                          placeholder="000.000.000-00"
                          maxLength={14}
                          onChange={(e) => {
                            const formatted = formatarCPF(e.target.value);
                            if (formatted.length <= 14) {
                              handleProponenteChange(idx, "cpf", formatted);
                            }
                          }}
                          required
                        />
                      </div>
                      <div>
                        <Label>Telefone *</Label>
                        <Input
                          value={p.telefone}
                          placeholder="(99) 99999-9999"
                          maxLength={15}
                          onChange={(e) => {
                            const formatted = formatarTelefone(e.target.value);
                            if (formatted.length <= 15) {
                              handleProponenteChange(
                                idx,
                                "telefone",
                                formatted
                              );
                            }
                          }}
                          required
                        />
                      </div>
                      <div>
                        <Label>E-mail *</Label>
                        <Input
                          value={p.email}
                          onChange={(e) =>
                            handleProponenteChange(idx, "email", e.target.value)
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label>Data de nascimento *</Label>
                        <Input
                          type="date"
                          value={p.nascimento}
                          onChange={(e) =>
                            handleProponenteChange(
                              idx,
                              "nascimento",
                              e.target.value
                            )
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label>Ocupação profissional *</Label>
                        <Input
                          value={p.ocupacao}
                          onChange={(e) =>
                            handleProponenteChange(
                              idx,
                              "ocupacao",
                              e.target.value
                            )
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label>Renda mensal comprovada *</Label>
                        <Input
                          value={p.renda}
                          placeholder="R$ 0,00"
                          onChange={(e) => {
                            const formatted = formatarMoeda(e.target.value);
                            handleProponenteChange(idx, "renda", formatted);
                          }}
                          required
                        />
                      </div>
                      <div>
                        <Label>Nome da empresa *</Label>
                        <Input
                          value={p.nomeEmpresa}
                          onChange={(e) =>
                            handleProponenteChange(
                              idx,
                              "nomeEmpresa",
                              e.target.value
                            )
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label>CNPJ</Label>
                        <Input
                          value={p.cnpj}
                          placeholder="00.000.000/0000-00"
                          maxLength={18}
                          onChange={(e) => {
                            const formatted = formatarCNPJ(e.target.value);
                            if (formatted.length <= 18) {
                              handleProponenteChange(idx, "cnpj", formatted);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dados Habitacionais */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-6">
                      <Home className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-lg text-gray-900">
                        Dados Habitacionais
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Endereço *</Label>
                        <Input
                          value={p.endereco}
                          onChange={(e) =>
                            handleProponenteChange(
                              idx,
                              "endereco",
                              e.target.value
                            )
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label>Bairro *</Label>
                        <Input
                          value={p.bairro}
                          placeholder="Ex: Centro, Vila Madalena"
                          onChange={(e) =>
                            handleProponenteChange(
                              idx,
                              "bairro",
                              e.target.value
                            )
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label>CEP *</Label>
                        <Input
                          value={p.cep}
                          placeholder="00000-000"
                          maxLength={9}
                          onChange={(e) => {
                            const formatted = formatarCEP(e.target.value);
                            if (formatted.length <= 9) {
                              handleProponenteChange(idx, "cep", formatted);
                            }
                          }}
                          required
                        />
                      </div>
                      <div>
                        <Label>Cidade/UF *</Label>
                        <Input
                          value={p.cidadeUf}
                          placeholder="Ex: São Paulo/SP"
                          onChange={(e) =>
                            handleProponenteChange(
                              idx,
                              "cidadeUf",
                              e.target.value
                            )
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Button
                  variant="outline"
                  className="w-full h-12 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                  onClick={handleAddProponente}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Adicionar Proponente
                </Button>
              </div>

              <div className="flex justify-between items-center mt-8 pt-6 border-t">
                <div className="flex-1">
                  {pendencias.length > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                      <AlertCircle className="w-4 h-4" />
                      <span>
                        <strong>Pendências:</strong> {pendencias.join(", ")}
                      </span>
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleNext}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                  disabled={pendencias.length > 0}
                >
                  Próximo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="imovel">
              {imoveis.map((im, idx) => (
                <div
                  key={idx}
                  className="mb-8 bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
                >
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Home className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          Imóvel {idx + 1}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Documentação e informações do imóvel
                        </p>
                      </div>
                    </div>
                    {imoveis.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveImovel(idx)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remover
                      </Button>
                    )}
                  </div>

                  {/* Dados do imóvel */}
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-6">
                      <Building2 className="w-5 h-5 text-green-600" />
                      <h4 className="font-semibold text-lg text-gray-900">
                        Dados do Imóvel
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>CEP *</Label>
                        <Input
                          value={im.cep}
                          placeholder="00000-000"
                          maxLength={9}
                          onChange={(e) => {
                            const formatted = formatarCEP(e.target.value);
                            if (formatted.length <= 9) {
                              handleImovelChange(idx, "cep", formatted);
                            }
                          }}
                          required
                        />
                      </div>
                      <div>
                        <Label>Tipo imóvel *</Label>
                        <Select
                          value={im.tipoImovel}
                          onValueChange={(v) =>
                            handleImovelChange(idx, "tipoImovel", v)
                          }
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="apartamento_residencial">
                              Apartamento Residencial
                            </SelectItem>
                            <SelectItem value="casa">Casa</SelectItem>
                            <SelectItem value="comercial">Comercial</SelectItem>
                            <SelectItem value="terreno">Terreno</SelectItem>
                            <SelectItem value="rural">Rural</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Endereço *</Label>
                        <Input
                          value={im.endereco}
                          onChange={(e) =>
                            handleImovelChange(idx, "endereco", e.target.value)
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label>Bairro *</Label>
                        <Input
                          value={im.bairro}
                          placeholder="Ex: Centro, Vila Madalena"
                          onChange={(e) =>
                            handleImovelChange(idx, "bairro", e.target.value)
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label>Valor imóvel *</Label>
                        <Input
                          value={im.valorEstimado}
                          placeholder="R$ 0,00"
                          onChange={(e) => {
                            const formatted = formatarMoeda(e.target.value);
                            handleImovelChange(idx, "valorEstimado", formatted);
                          }}
                          required
                        />
                      </div>
                      <div>
                        <Label>Valor de crédito solicitado *</Label>
                        <Input
                          value={im.valorCredito}
                          placeholder="R$ 0,00"
                          onChange={(e) => {
                            const formatted = formatarMoeda(e.target.value);
                            handleImovelChange(idx, "valorCredito", formatted);
                          }}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Donos do imóvel */}
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-6">
                      <Users className="w-5 h-5 text-green-600" />
                      <h4 className="font-semibold text-lg text-gray-900">
                        Donos do Imóvel
                      </h4>
                    </div>
                    <div className="space-y-3">
                      {im?.donos?.map((dono, donoIdx) => (
                        <div
                          key={donoIdx}
                          className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border"
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="flex-1 font-medium">{dono}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const newDonos = im.donos.filter(
                                (_, i) => i !== donoIdx
                              );
                              handleImovelChange(idx, "donos", newDonos);
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Input
                          id={`novo-dono-${idx}`}
                          placeholder="Digite o nome do dono do imóvel"
                          className="flex-1"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const input = e.target as HTMLInputElement;
                              const novoDono = input.value.trim();
                              if (novoDono) {
                                handleImovelChange(idx, "donos", [
                                  ...im.donos,
                                  novoDono,
                                ]);
                                input.value = "";
                              }
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const input = document.getElementById(
                              `novo-dono-${idx}`
                            ) as HTMLInputElement;
                            const novoDono = input?.value.trim();
                            if (novoDono) {
                              handleImovelChange(idx, "donos", [
                                ...im.donos,
                                novoDono,
                              ]);
                              input.value = "";
                            }
                          }}
                          className="px-4 border-blue-300 hover:border-blue-400 hover:bg-blue-50 text-blue-600"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Documentos do imóvel */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-6">
                      <FileText className="w-5 h-5 text-green-600" />
                      <h4 className="font-semibold text-lg text-gray-900">
                        Documentos do Imóvel
                      </h4>
                    </div>

                    {/* Matrícula */}
                    <div className="mb-4 p-4 border rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileCheck className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h5 className="font-medium">Matrícula</h5>
                            <p className="text-sm text-gray-600">
                              Matrícula atualizada do imóvel
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {im?.matricula?.length > 0 && (
                            <div className="flex flex-col gap-2">
                              {im.matricula.map((doc, docIdx) => (
                                <div
                                  key={docIdx}
                                  className="flex items-center justify-between text-sm text-green-700"
                                >
                                  <div className="flex items-center gap-2">
                                    <span>✓</span>
                                    {"url" in doc ? (
                                      <a
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline text-blue-600"
                                      >
                                        {doc.originalName || doc.name}
                                      </a>
                                    ) : (
                                      <span>{doc.name}</span>
                                    )}
                                  </div>

                                  {/* Botão remover */}
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      setImoveis((prev) =>
                                        prev.map((imovel, i) =>
                                          i === idx
                                            ? {
                                                ...imovel,
                                                matricula:
                                                  imovel.matricula.filter(
                                                    (_, j) => j !== docIdx
                                                  ),
                                              }
                                            : imovel
                                        )
                                      );
                                    }}
                                  >
                                    ×
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              document
                                .getElementById(`matricula-${idx}`)
                                ?.click()
                            }
                            className="flex items-center gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            Anexar
                          </Button>
                          <input
                            id={`matricula-${idx}`}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file)
                                handleImovelChange(idx, "matricula", [file]);
                              e.target.value = "";
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* IPTU */}
                    <div className="mb-4 p-4 border rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Receipt className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h5 className="font-medium">IPTU</h5>
                            <p className="text-sm text-gray-600">
                              Capa do IPTU que mostre endereço e área do imóvel
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {im?.iptu?.length > 0 && (
                            <div className="flex flex-col gap-2">
                              {im.iptu.map((doc, docIdx) => (
                                <div
                                  key={docIdx}
                                  className="flex items-center justify-between text-sm text-green-700"
                                >
                                  <div className="flex items-center gap-2">
                                    <span>✓</span>
                                    {"url" in doc ? (
                                      <a
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline text-blue-600"
                                      >
                                        {doc.originalName || doc.name}
                                      </a>
                                    ) : (
                                      <span>{doc.name}</span>
                                    )}
                                  </div>

                                  {/* Botão remover */}
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      setImoveis((prev) =>
                                        prev.map((imovel, i) =>
                                          i === idx
                                            ? {
                                                ...imovel,
                                                iptu: imovel.iptu.filter(
                                                  (_, j) => j !== docIdx
                                                ),
                                              }
                                            : imovel
                                        )
                                      );
                                    }}
                                  >
                                    ×
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              document.getElementById(`iptu-${idx}`)?.click()
                            }
                            className="flex items-center gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            Anexar
                          </Button>
                          <input
                            id={`iptu-${idx}`}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImovelChange(idx, "iptu", [file]);
                              e.target.value = "";
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Habite-se */}
                    <div className="mb-4 p-4 border rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Building className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h5 className="font-medium">Habite-se</h5>
                            <p className="text-sm text-gray-600">
                              Comprovante de construção do imóvel segundo as
                              regras do município
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {im?.habiteSe?.length > 0 && (
                            <div className="flex flex-col gap-2">
                              {im.habiteSe.map((doc, docIdx) => (
                                <div
                                  key={docIdx}
                                  className="flex items-center justify-between text-sm text-green-700"
                                >
                                  <div className="flex items-center gap-2">
                                    <span>✓</span>
                                    {"url" in doc ? (
                                      <a
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline text-blue-600"
                                      >
                                        {doc.originalName || doc.name}
                                      </a>
                                    ) : (
                                      <span>{doc.name}</span>
                                    )}
                                  </div>

                                  {/* Botão remover */}
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      setImoveis((prev) =>
                                        prev.map((imovel, i) =>
                                          i === idx
                                            ? {
                                                ...imovel,
                                                habiteSe:
                                                  imovel.habiteSe.filter(
                                                    (_, j) => j !== docIdx
                                                  ),
                                              }
                                            : imovel
                                        )
                                      );
                                    }}
                                  >
                                    ×
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              document
                                .getElementById(`habite-se-${idx}`)
                                ?.click()
                            }
                            className="flex items-center gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            Anexar
                          </Button>
                          <input
                            id={`habite-se-${idx}`}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file)
                                handleImovelChange(idx, "habiteSe", [file]);
                              e.target.value = "";
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Alvará de construção */}
                    <div className="mb-4 p-4 border rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Landmark className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <h5 className="font-medium">
                              Alvará de construção
                            </h5>
                            <p className="text-sm text-gray-600">
                              Atestado de conformidade da obra de acordo com a
                              legislação
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {im?.alvaraConstrucao?.length > 0 && (
                            <div className="flex flex-col gap-2">
                              {im.alvaraConstrucao.map((doc, docIdx) => (
                                <div
                                  key={docIdx}
                                  className="flex items-center justify-between text-sm text-green-700"
                                >
                                  <div className="flex items-center gap-2">
                                    <span>✓</span>
                                    {"url" in doc ? (
                                      <a
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline text-blue-600"
                                      >
                                        {doc.originalName || doc.name}
                                      </a>
                                    ) : (
                                      <span>{doc.name}</span>
                                    )}
                                  </div>

                                  {/* Botão remover */}
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      setImoveis((prev) =>
                                        prev.map((imovel, i) =>
                                          i === idx
                                            ? {
                                                ...imovel,
                                                alvaraConstrucao:
                                                  imovel.alvaraConstrucao.filter(
                                                    (_, j) => j !== docIdx
                                                  ),
                                              }
                                            : imovel
                                        )
                                      );
                                    }}
                                  >
                                    ×
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              document.getElementById(`alvara-${idx}`)?.click()
                            }
                            className="flex items-center gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            Anexar
                          </Button>
                          <input
                            id={`alvara-${idx}`}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file)
                                handleImovelChange(idx, "alvaraConstrucao", [
                                  file,
                                ]);
                              e.target.value = "";
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Fotos */}
                    <div className="mb-4 p-4 border rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                            <Camera className="w-5 h-5 text-pink-600" />
                          </div>
                          <div>
                            <h5 className="font-medium">Fotos</h5>
                            <p className="text-sm text-gray-600">
                              Fotos do imóvel
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {im?.fotos?.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-green-700">
                              <span>✓</span>
                              <span>{im.fotos.length} foto(s)</span>
                            </div>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              document.getElementById(`fotos-${idx}`)?.click()
                            }
                            className="flex items-center gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            Anexar
                          </Button>
                          <input
                            id={`fotos-${idx}`}
                            type="file"
                            accept=".jpg,.jpeg,.png"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              const files = e.target.files;
                              if (files) {
                                const fileArray = Array.from(files);
                                handleImovelFotosChange(idx, fileArray);
                              }
                              e.target.value = "";
                            }}
                          />
                        </div>
                      </div>

                      {/* Lista das fotos adicionadas */}
                      {im.fotos && im.fotos.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                          {im.fotos.map((foto, fotoIdx) => (
                            <div key={fotoIdx} className="relative group">
                              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 text-sm text-gray-600">
                                <div className="text-center">
                                  <FileImage className="w-6 h-6 mx-auto mb-1 text-pink-600" />
                                  <p className="truncate px-2">{foto.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {(foto.size / 1024 / 1024).toFixed(1)}MB
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  const newFotos = removeFile(
                                    im.fotos,
                                    fotoIdx
                                  );
                                  setImoveis((prev) =>
                                    prev.map((imovel, i) =>
                                      i === idx
                                        ? { ...imovel, fotos: newFotos }
                                        : imovel
                                    )
                                  );
                                }}
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Outros documentos */}
                    <div className="mb-4 p-4 border rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <ClipboardList className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <h5 className="font-medium">Outros documentos</h5>
                            <p className="text-sm text-gray-600">
                              Condomínio, Certidão de débitos tributários, Termo
                              de quitação...
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {im?.outros?.length > 0 && (
                            <div className="flex flex-col gap-2">
                              {im.outros.map((doc, docIdx) => (
                                <div
                                  key={docIdx}
                                  className="flex items-center justify-between text-sm text-green-700"
                                >
                                  <div className="flex items-center gap-2">
                                    <span>✓</span>
                                    {"url" in doc ? (
                                      <a
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline text-blue-600"
                                      >
                                        {doc.originalName || doc.name}
                                      </a>
                                    ) : (
                                      <span>{doc.name}</span>
                                    )}
                                  </div>

                                  {/* Botão remover */}
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      setImoveis((prev) =>
                                        prev.map((imovel, i) =>
                                          i === idx
                                            ? {
                                                ...imovel,
                                                outros: imovel.outros.filter(
                                                  (_, j) => j !== docIdx
                                                ),
                                              }
                                            : imovel
                                        )
                                      );
                                    }}
                                  >
                                    ×
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              document.getElementById(`outros-${idx}`)?.click()
                            }
                            className="flex items-center gap-2"
                          >
                            <Upload className="w-4 h-4" />
                            Anexar
                          </Button>
                          <input
                            id={`outros-${idx}`}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              const files = e.target.files;
                              if (files) {
                                const fileArray = Array.from(files);
                                const newFiles = addFiles(im.outros, fileArray);
                                handleImovelChange(idx, "outros", newFiles);
                              }
                              e.target.value = "";
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Informações de arquivo */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 p-3 bg-blue-50 rounded-lg">
                      <Info className="w-4 h-4 text-blue-600" />
                      <span>
                        Arquivos suportados: .pdf, .png, .jpeg. Máx 10Mb.
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              <div className="mt-8 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Button
                  variant="outline"
                  className="w-full h-12 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                  onClick={handleAddImovel}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Adicionar Imóvel
                </Button>
              </div>

              <div className="flex justify-between items-center mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => setTab("proponente")}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>
                <div className="flex-1">
                  {pendenciasImovel.length > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                      <AlertCircle className="w-4 h-4" />
                      <span>
                        <strong>Pendências:</strong>{" "}
                        {pendenciasImovel.join(", ")}
                      </span>
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleNextImovel}
                  className="bg-green-600 hover:bg-green-700 text-white px-6"
                  disabled={pendenciasImovel.length > 0}
                >
                  Próximo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="defesa">
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      Defesa Comercial
                    </h3>
                    <p className="text-sm text-gray-600">
                      Justificativa e estratégia da proposta
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Defesa Comercial *
                  </Label>
                  <Textarea
                    value={defesa}
                    onChange={(e) => {
                      if (e.target.value.length <= 1500)
                        setDefesa(e.target.value);
                    }}
                    rows={8}
                    placeholder="Descreva o racional da proposta, perfil do cliente, finalidade do crédito, urgências, justificativas, estratégia da operação..."
                    className="resize-none"
                    required
                  />
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-xs text-gray-500">
                      {defesa.length}/1500 caracteres
                    </div>
                    {defesaErro && (
                      <div className="flex items-center gap-1 text-red-600 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        {defesaErro}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <strong>Dicas para uma boa defesa:</strong>
                      <ul className="mt-2 space-y-1 list-disc list-inside">
                        <li>Qual o perfil e histórico do cliente?</li>
                        <li>Qual a finalidade do crédito?</li>
                        <li>Existe alguma urgência?</li>
                        <li>Justificativa dos valores solicitados</li>
                        <li>Estratégia da operação</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => setTab("imovel")}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>
                <Button
                  onClick={handleNextDefesa}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6"
                >
                  Próximo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="finalizacao">
              {arquivosAgrupados.map((p, idx) => (
                <div
                  key={idx}
                  className="mb-8 bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <ClipboardList className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        Documentos Pessoais
                      </h3>
                      <p className="text-sm text-gray-600">
                        Envio de documentação dos proponentes
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-6">
                      <User className="w-5 h-5 text-orange-600" />
                      <h4 className="font-semibold text-lg text-gray-900">
                        {proponentes[idx]?.nomeEmpresa ||
                          `Proponente ${idx + 1}`}
                      </h4>
                    </div>

                    {/* Identificação */}
                    <UploadSecao
                      idx={idx}
                      titulo="Identificação"
                      descricao="RG, CPF ou CNH"
                      icone={<User className="w-5 h-5 text-blue-600" />}
                      bg="bg-blue-100"
                      field="identificacao"
                      files={p.identificacao}
                      handleChange={handleProponenteChange}
                    />

                    {/* Comprovante de Residência */}
                    <UploadSecao
                      idx={idx}
                      titulo="Comprovante de Residência"
                      descricao="Conta de água ou de luz atualizada"
                      icone={<Home className="w-5 h-5 text-green-600" />}
                      bg="bg-green-100"
                      field="comprovanteResidencia"
                      files={p.comprovanteResidencia}
                      handleChange={handleProponenteChange}
                    />

                    {/* Certidão de Estado Civil */}
                    <UploadSecao
                      idx={idx}
                      titulo="Certidão de Estado Civil"
                      descricao="Certidão de nascimento ou casamento atualizada"
                      icone={<FileCheck className="w-5 h-5 text-purple-600" />}
                      bg="bg-purple-100"
                      field="certidaoEstadoCivil"
                      files={p.certidaoEstadoCivil}
                      handleChange={handleProponenteChange}
                    />

                    {/* Holerite */}
                    <UploadSecao
                      idx={idx}
                      titulo="Holerite ou Contracheque"
                      descricao="Holerites ou contracheques dos últimos 3 meses"
                      icone={<DollarSign className="w-5 h-5 text-yellow-600" />}
                      bg="bg-yellow-100"
                      field="holerite"
                      files={p.holerite}
                      handleChange={handleProponenteChange}
                    />

                    {/* Extrato */}
                    <UploadSecao
                      idx={idx}
                      titulo="Extrato"
                      descricao="Extrato bancário"
                      icone={<CreditCard className="w-5 h-5 text-indigo-600" />}
                      bg="bg-indigo-100"
                      field="extrato"
                      files={p.extrato}
                      handleChange={handleProponenteChange}
                    />

                    {/* Declaração IR */}
                    <UploadSecao
                      idx={idx}
                      titulo="Declaração de Imposto de Renda (IRPF)"
                      descricao="Declaração do imposto de renda atualizada e completa"
                      icone={<FileText className="w-5 h-5 text-red-600" />}
                      bg="bg-red-100"
                      field="declaracaoIR"
                      files={p.declaracaoIR}
                      handleChange={handleProponenteChange}
                    />

                    {/* Recibo IR */}
                    <UploadSecao
                      idx={idx}
                      titulo="Recibo do IRPF"
                      descricao="Recibo completo (2 páginas)"
                      icone={<Receipt className="w-5 h-5 text-red-600" />}
                      bg="bg-red-100"
                      field="reciboIR"
                      files={p.reciboIR}
                      handleChange={handleProponenteChange}
                    />

                    {/* Contrato de Aluguel */}
                    <UploadSecao
                      idx={idx}
                      titulo="Contrato de Aluguel"
                      descricao="Documento que comprova renda extra por imóvel alugado"
                      icone={<Building2 className="w-5 h-5 text-teal-600" />}
                      bg="bg-teal-100"
                      field="contratoAluguel"
                      files={p.contratoAluguel}
                      handleChange={handleProponenteChange}
                    />

                    {/* Escritura de Pacto Antenupcial */}
                    <UploadSecao
                      idx={idx}
                      titulo="Escritura de Pacto Antenupcial"
                      descricao="Documento que declara o regime de comunhão de bens"
                      icone={<Heart className="w-5 h-5 text-pink-600" />}
                      bg="bg-pink-100"
                      field="escrituraPacto"
                      files={p.escrituraPacto}
                      handleChange={handleProponenteChange}
                    />

                    {/* Outros documentos */}
                    <UploadSecao
                      idx={idx}
                      titulo="Outros Documentos"
                      descricao="Outros documentos importantes ao proponente"
                      icone={
                        <ClipboardList className="w-5 h-5 text-gray-600" />
                      }
                      bg="bg-gray-100"
                      field="outrosDocumentos"
                      files={p.outrosDocumentos}
                      handleChange={handleProponenteChange}
                    />

                    {/* Info */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 p-3 bg-blue-50 rounded-lg">
                      <Info className="w-4 h-4 text-blue-600" />
                      <span>
                        Arquivos suportados: .pdf, .png, .jpeg. Máx 10Mb.
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => setTab("defesa")}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>
                <div className="flex-1">
                  {feedback && (
                    <div
                      className={`flex items-center gap-2 p-3 rounded-lg ${
                        feedback.includes("sucesso")
                          ? "bg-green-50 border border-green-200 text-green-700"
                          : "bg-red-50 border border-red-200 text-red-700"
                      }`}
                    >
                      {feedback.includes("sucesso") ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      {feedback}
                    </div>
                  )}
                </div>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-2"
                  disabled={enviando}
                  onClick={handleEnviarProposta}
                >
                  {enviando ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar para Análise
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
