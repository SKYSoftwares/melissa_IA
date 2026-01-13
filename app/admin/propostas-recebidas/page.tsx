"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Download,
  Search,
  Filter,
  Calendar,
  Phone,
  Mail,
  Eye,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ProposalCreator {
  id: string;
  name: string;
  email: string;
  position?: string | null;
  avatarUrl?: string | null;
}

interface Proposal {
  id: string;
  title: string;
  client: string;
  company: string;
  value: string;
  stage: string;
  arquivoUrl: string;
  createdAt: string;
  phone: string;
  email: string;
  description?: string;
  createdBy?: string | null; // <- adicionado
  creator?: ProposalCreator | null; // <- adicionado
  // abaixo podem existir dependendo do include do backend:
  proponentes?: any[];
  imoveis?: any[];
  arquivos?: any[];
}

export default function PropostasRecebidasPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);

  // helper para iniciais
  const initials = (name?: string | null) =>
    (name || "?")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  // Carregar todas as propostas (admin vê tudo)
  const fetchProposals = async () => {
    try {
      const response = await fetch("/api/proposals?admin=true");
      if (response.ok) {
        const data = await response.json();
        setProposals(data);
      }
    } catch (error) {
      console.error("Erro ao carregar propostas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  // Se abrir o modal e a proposta tiver apenas createdBy (sem creator), buscar o criador
  useEffect(() => {
    if (
      showModal &&
      selectedProposal &&
      !selectedProposal.creator &&
      selectedProposal.createdBy
    ) {
      fetch(`/api/team/${selectedProposal.createdBy}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((team) => {
          if (team) {
            setSelectedProposal((prev) =>
              prev ? { ...prev, creator: team } : prev
            );
          }
        })
        .catch(() => {});
    }
  }, [showModal, selectedProposal]);

  // Filtrar propostas por termo de busca
  const filteredProposals = proposals.filter(
    (proposal) =>
      proposal.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDownload = (arquivoUrl: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = arquivoUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setShowModal(true);
  };

  function getTipoArquivo(nome: string) {
    const n: string = nome.toLowerCase();
    if (n.includes("rg") || n.includes("cnh") || n.includes("cpf"))
      return "RG/CPF/CNH";
    if (n.includes("endereco")) return "Comprovante de Endereço";
    if (n.includes("ir")) return "Imposto de Renda";
    if (n.includes("extrato")) return "Extrato Bancário";
    if (n.includes("matricula")) return "Matrícula do Imóvel";
    if (n.includes("iptu")) return "IPTU";
    if (n.includes("certidao")) return "Certidão";
    if (n.includes("foto")) return "Foto do Imóvel";
    if (
      n.includes(".jpg") ||
      n.includes(".jpeg") ||
      n.includes(".png") ||
      n.includes(".gif") ||
      n.includes(".webp")
    )
      return "Imagem/Print";
    if (n.includes(".pdf")) return "PDF";
    if (n.includes(".doc") || n.includes(".docx")) return "Word";
    if (n.includes(".xls") || n.includes(".xlsx")) return "Excel";
    return "Arquivo Anexado";
  }

  function isImagem(nome: string) {
    const n: string = nome.toLowerCase();
    return (
      n.includes(".jpg") ||
      n.includes(".jpeg") ||
      n.includes(".png") ||
      n.includes(".gif") ||
      n.includes(".webp") ||
      n.includes("foto")
    );
  }

  function getProponentFieldName(fileName: string): string {
    const fieldMap: { [key: string]: string } = {
      identificacao: "🆔 Documento de Identificação (RG/CPF/CNH)",
      comprovanteResidencia: "🏠 Comprovante de Residência",
      certidaoEstadoCivil: "💍 Certidão de Estado Civil",
      holerite: "💰 Holerite/Comprovante de Renda",
      extrato: "🏦 Extrato Bancário",
      declaracaoIR: "📊 Declaração de Imposto de Renda",
      reciboIR: "🧾 Recibo de Imposto de Renda",
      contratoAluguel: "📋 Contrato de Aluguel",
      escrituraPacto: "📜 Escritura/Pacto Antenupcial",
      outrosDocumentos: "📄 Outros Documentos",
    };

    for (const [field, name] of Object.entries(fieldMap)) {
      if (fileName.includes(field)) {
        return name;
      }
    }
    return "📄 Documento do Proponente";
  }
  // crie as funcoes handleSendEmail e handlePhoneCall
  const handleSendEmail = (email: string, client: string, title: string) => {
    if (email) {
      window.open(`mailto:${email}?subject=${title}&body=${client}`, "_self");
    }
  };
  const handlePhoneCall = (phone: string, client: string) => {
    if (phone) {
      window.open(`tel:${phone}`, "_self");
    }
  };

  function getImovelFieldName(fileName: string): string {
    const fieldMap: { [key: string]: string } = {
      matricula: "📋 Matrícula do Imóvel",
      iptu: "🏛️ IPTU",
      habiteSe: "✅ Habite-se",
      alvaraConstrucao: "🏗️ Alvará de Construção",
      fotos: "📸 Fotos do Imóvel",
      outros: "📄 Outros Documentos do Imóvel",
    };

    for (const [field, name] of Object.entries(fieldMap)) {
      if (fileName.includes(field)) {
        return name;
      }
    }
    return "📄 Documento do Imóvel";
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-8 pt-6 bg-gray-50 min-h-screen">
        <div className="text-center">
          <p>Carregando propostas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Propostas Recebidas
          </h2>
          <p className="text-muted-foreground">
            Visualize todas as propostas do sistema
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar propostas..."
              className="pl-8 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Propostas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proposals.length}</div>
            <p className="text-xs text-muted-foreground">Total no sistema</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                proposals.filter((p) => {
                  const proposalDate = new Date(p.createdAt);
                  const now = new Date();
                  return (
                    proposalDate.getMonth() === now.getMonth() &&
                    proposalDate.getFullYear() === now.getFullYear()
                  );
                }).length
              }
            </div>
            <p className="text-xs text-muted-foreground">Propostas recebidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R{"$ "}
              {proposals
                .reduce((total, p) => {
                  const value =
                    parseFloat(
                      p.value.replace(/[^\d,]/g, "").replace(",", ".")
                    ) || 0;
                  return total + value;
                }, 0)
                .toLocaleString("pt-BR")}
            </div>
            <p className="text-xs text-muted-foreground">Soma dos valores</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Propostas */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Propostas</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProposals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchTerm
                  ? "Nenhuma proposta encontrada para sua busca."
                  : "Nenhuma proposta encontrada."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {initials(proposal.client)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{proposal.client}</h3>
                      <p className="text-sm text-gray-600">
                        {proposal.company}
                      </p>
                      <p className="text-sm text-gray-500">{proposal.title}</p>

                      {/* <<< Criado por no card >>> */}
                      {proposal.creator && (
                        <div className="mt-1 flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage
                              src={
                                proposal.creator.avatarUrl || "/placeholder.svg"
                              }
                            />
                            <AvatarFallback className="text-[10px]">
                              {initials(proposal.creator.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[12px] text-gray-600">
                            Criado por{" "}
                            <span className="font-medium text-gray-800">
                              {proposal.creator.name}
                            </span>
                            {proposal.creator.position
                              ? ` • ${proposal.creator.position}`
                              : ""}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {proposal.stage}
                        </Badge>
                        <span className="text-sm font-medium text-green-600">
                          {proposal.value}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        Enviada em {formatDate(proposal.createdAt)}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        // esses botoes devem ser funcionais para ligar e enviar
                        email
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() =>
                            handlePhoneCall(proposal.phone, proposal.client)
                          }
                        >
                          <Phone className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() =>
                            handleSendEmail(
                              proposal.email,
                              proposal.client,
                              proposal.title
                            )
                          }
                        >
                          <Mail className="h-4 w-4 text-green-600" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(proposal)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Proposta</DialogTitle>
            <DialogDescription>
              Todos os campos preenchidos e arquivos anexados
            </DialogDescription>
          </DialogHeader>
          {selectedProposal && (
            <div className="space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Dados Gerais */}
              <section className="bg-gray-50 rounded-lg border p-4">
                <h3 className="font-bold text-lg mb-3 text-blue-900">
                  Dados Gerais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <div>
                    <span className="font-semibold">Título:</span>{" "}
                    {selectedProposal.title}
                  </div>
                  <div>
                    <span className="font-semibold">Cliente:</span>{" "}
                    {selectedProposal.client}
                  </div>
                  <div>
                    <span className="font-semibold">Empresa:</span>{" "}
                    {selectedProposal.company}
                  </div>
                  <div>
                    <span className="font-semibold">Valor:</span> R{"$ "}
                    {selectedProposal.value}
                  </div>
                  <div>
                    <span className="font-semibold">Status:</span>{" "}
                    {selectedProposal.stage}
                  </div>
                  <div>
                    <span className="font-semibold">Telefone:</span>{" "}
                    {selectedProposal.phone}
                  </div>
                  <div>
                    <span className="font-semibold">Email:</span>{" "}
                    {selectedProposal.email}
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-semibold">Descrição:</span>{" "}
                    {selectedProposal.description || "—"}
                  </div>
                  <div>
                    <span className="font-semibold">Data de envio:</span>{" "}
                    {formatDate(selectedProposal.createdAt)}
                  </div>

                  {/* <<< Criado por no modal >>> */}
                  <div className="md:col-span-2 flex items-center gap-2">
                    <span className="font-semibold">Criado por:</span>
                    {selectedProposal.creator ? (
                      <span className="inline-flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={
                              selectedProposal.creator.avatarUrl ||
                              "/placeholder.svg"
                            }
                          />
                          <AvatarFallback className="text-[10px]">
                            {initials(selectedProposal.creator.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-gray-800 font-medium">
                          {selectedProposal.creator.name}
                        </span>
                        {selectedProposal.creator.position && (
                          <span className="text-gray-500">
                            • {selectedProposal.creator.position}
                          </span>
                        )}
                        {selectedProposal.creator.email && (
                          <span className="text-gray-500">
                            • {selectedProposal.creator.email}
                          </span>
                        )}
                      </span>
                    ) : selectedProposal.createdBy ? (
                      <span className="text-gray-500">Buscando criador…</span>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </div>
                </div>
              </section>

              {/* Proponentes */}
              <section className="bg-gray-50 rounded-lg border p-4">
                <h3 className="font-bold text-lg mb-3 text-blue-900">
                  Proponentes
                </h3>
                {selectedProposal.proponentes?.length ? (
                  selectedProposal.proponentes.map((p: any, i: number) => (
                    <div key={i} className="mb-3 p-3 rounded border bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                        <div>
                          <span className="font-semibold">Nome:</span> {p.name}
                        </div>
                        <div>
                          <span className="font-semibold">CPF:</span> {p.cpf}
                        </div>
                        <div>
                          <span className="font-semibold">Email:</span>{" "}
                          {p.email}
                        </div>
                        <div>
                          <span className="font-semibold">Telefone:</span>{" "}
                          {p.phone}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">
                    Nenhum proponente cadastrado.
                  </div>
                )}
              </section>

              {/* Imóveis */}
              <section className="bg-gray-50 rounded-lg border p-4">
                <h3 className="font-bold text-lg mb-3 text-blue-900">
                  Imóveis
                </h3>
                {selectedProposal.imoveis?.length ? (
                  selectedProposal.imoveis.map((im: any, i: number) => (
                    <div key={i} className="mb-3 p-3 rounded border bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                        <div>
                          <span className="font-semibold">Endereço:</span>{" "}
                          {im.address}
                        </div>
                        <div>
                          <span className="font-semibold">Valor:</span> R{"$ "}
                          {im.value}
                        </div>
                        <div className="md:col-span-2">
                          <span className="font-semibold">Descrição:</span>{" "}
                          {im.description}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">Nenhum imóvel cadastrado.</div>
                )}
              </section>

              {/* Arquivos Anexados */}
              <section className="bg-gray-50 rounded-lg border p-4">
                <h3 className="font-bold text-lg mb-3 text-blue-900">
                  Arquivos Anexados
                </h3>

                {selectedProposal.arquivos?.length ? (
                  <div className="space-y-4">
                    {/* Arquivos de Proponentes */}
                    {selectedProposal.arquivos.filter(
                      (a: any) => !a.name.startsWith("imovel_")
                    ).length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 text-green-700">
                          📋 Documentos dos Proponentes
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                          {selectedProposal.arquivos
                            .filter((a: any) => !a.name.startsWith("imovel_"))
                            .map((a: any, i: number) => {
                              const fieldName = getProponentFieldName(a.name);
                              const isImg = isImagem(a.name);
                              const tipoArquivo = getTipoArquivo(a.name);
                              return (
                                <div
                                  key={i}
                                  className={`flex items-center gap-3 p-2 rounded border ${
                                    isImg
                                      ? "bg-blue-50 border-blue-200"
                                      : "bg-white border-gray-200"
                                  }`}
                                >
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                      isImg ? "bg-blue-100" : "bg-green-100"
                                    }`}
                                  >
                                    <span
                                      className={`text-sm ${
                                        isImg
                                          ? "text-blue-600"
                                          : "text-green-600"
                                      }`}
                                    >
                                      {isImg ? "🖼️" : "📄"}
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">
                                      {fieldName}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => {
                                          const link =
                                            document.createElement("a");
                                          const fileUrl = a.id
                                            ? `/api/files/${a.id}`
                                            : a.url.startsWith("/uploads/") ||
                                              a.url.startsWith("http")
                                            ? a.url
                                            : `/uploads/${a.url}`;
                                          link.href = fileUrl;
                                          link.download =
                                            a.originalName || a.name;
                                          link.target = "_blank";
                                          document.body.appendChild(link);
                                          link.click();
                                          document.body.removeChild(link);
                                        }}
                                        className="text-blue-600 underline text-xs break-all hover:text-blue-800 bg-transparent border-none p-0 text-left cursor-pointer"
                                      >
                                        {a.name.replace(/^[^_]*_/, "")}
                                      </button>
                                      <span
                                        className={`text-xs px-2 py-1 rounded ${
                                          isImg
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-gray-100 text-gray-700"
                                        }`}
                                      >
                                        {tipoArquivo}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Arquivos de Imóveis */}
                    {selectedProposal.arquivos.filter((a: any) =>
                      a.name.startsWith("imovel_")
                    ).length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 text-blue-700">
                          🏠 Documentos dos Imóveis
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                          {selectedProposal.arquivos
                            .filter((a: any) => a.name.startsWith("imovel_"))
                            .map((a: any, i: number) => {
                              const fieldName = getImovelFieldName(a.name);
                              const isImg =
                                isImagem(a.name) || a.name.includes("fotos");
                              const tipoArquivo = getTipoArquivo(a.name);
                              return (
                                <div
                                  key={i}
                                  className={`flex items-center gap-3 p-2 rounded border ${
                                    isImg
                                      ? "bg-blue-50 border-blue-200"
                                      : "bg-white border-gray-200"
                                  }`}
                                >
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center bg-blue-100`}
                                  >
                                    <span className="text-blue-600 text-sm">
                                      {isImg ? "🖼️" : "📄"}
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">
                                      {fieldName}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => {
                                          const link =
                                            document.createElement("a");
                                          const fileUrl = a.id
                                            ? `/api/files/${a.id}`
                                            : a.url.startsWith("/uploads/") ||
                                              a.url.startsWith("http")
                                            ? a.url
                                            : `/uploads/${a.url}`;
                                          link.href = fileUrl;
                                          link.download =
                                            a.originalName || a.name;
                                          link.target = "_blank";
                                          document.body.appendChild(link);
                                          link.click();
                                          document.body.removeChild(link);
                                        }}
                                        className="text-blue-600 underline text-xs break-all hover:text-blue-800 bg-transparent border-none p-0 text-left cursor-pointer"
                                      >
                                        {a.name.replace(/^imovel_[^_]*_/, "")}
                                      </button>
                                      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                                        {tipoArquivo}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500">Nenhum arquivo anexado.</div>
                )}
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
