"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatarMoedaBR } from "@/lib/utils";
import { Eye, Phone, Mail } from "lucide-react";

function getTipoArquivo(nome: string) {
  const n = nome.toLowerCase();
  if (n.includes("rg") || n.includes("cnh") || n.includes("cpf"))
    return "RG/CPF/CNH";
  if (n.includes("endereco")) return "Comprovante de Endereço";
  if (n.includes("ir")) return "Imposto de Renda";
  if (n.includes("extrato")) return "Extrato Bancário";
  if (n.includes("matricula")) return "Matrícula do Imóvel";
  if (n.includes("iptu")) return "IPTU";
  if (n.includes("certidao")) return "Certidão";
  if (n.includes("foto")) return "Foto do Imóvel";
  return "Outro";
}

export default function PropostasEnviadasPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const [propostas, setPropostas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!user?.email || !user?.role) return;
    async function fetchPropostas() {
      if (!user?.email || !user?.role) return;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/proposals?userEmail=${encodeURIComponent(
            user.email
          )}&userRole=${encodeURIComponent(user.role)}&enviadasApenas=true`
        );
        if (res.ok) {
          const data = await res.json();
          setPropostas(data);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchPropostas();
  }, [user]);

  if (!user || (user.role && user.role.toLowerCase() === "administrador"))
    return null;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Propostas Enviadas</h2>
      <div className="mb-4 text-gray-700 text-lg font-medium">
        {loading
          ? "Carregando..."
          : `Total: ${propostas.length} proposta${
              propostas.length === 1 ? "" : "s"
            } cadastrada${propostas.length === 1 ? "" : "s"}`}
      </div>
      {loading ? (
        <div>Carregando...</div>
      ) : propostas.length === 0 ? (
        <div>Nenhuma proposta cadastrada para este consultor.</div>
      ) : (
        <div className="space-y-4">
          {propostas.map((p) => (
            <Card
              key={p.id}
              className="border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback>{p.client?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      {p.client}
                    </CardTitle>
                    <p className="text-xs text-gray-500">{p.company}</p>
                    <p className="text-xs text-gray-400">{p.title}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {p.stage}
                      </Badge>
                      <span className="text-sm font-medium text-green-600">
                        {formatarMoedaBR(p.value)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-gray-600">{p.email}</div>
                  <div className="text-xs text-gray-600">{p.phone}</div>
                  <div className="text-xs text-gray-400 mt-2">
                    Enviada em:{" "}
                    {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedProposal(p);
                    setShowModal(true);
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" /> Visualizar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
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
                    <span className="font-semibold">Valor:</span> R${" "}
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
                    {selectedProposal.description}
                  </div>
                  <div>
                    <span className="font-semibold">Data de envio:</span>{" "}
                    {new Date(selectedProposal.createdAt).toLocaleString(
                      "pt-BR"
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
                        {p.razaoSocial && (
                          <div className="md:col-span-2">
                            <span className="font-semibold">Razão Social:</span>{" "}
                            {p.razaoSocial}
                          </div>
                        )}
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
                          <span className="font-semibold">Valor:</span> R${" "}
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
                  <ul className="space-y-2">
                    {selectedProposal.arquivos.map((a: any, i: number) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="font-medium min-w-[180px]">
                          {getTipoArquivo(a.name)}:
                        </span>
                        <button
                          onClick={() => {
                            const link = document.createElement('a');
                            // Usar nova API se arquivo tem ID, senão usar método antigo
                            const fileUrl = a.id 
                              ? `/api/files/${a.id}`
                              : a.url.startsWith('/uploads/') || a.url.startsWith('http') 
                                ? a.url 
                                : `/uploads/${a.url}`;
                            link.href = fileUrl;
                            link.download = a.originalName || a.name;
                            link.target = '_blank';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="text-blue-700 underline break-all hover:text-blue-900 cursor-pointer bg-transparent border-none p-0 text-left"
                        >
                          {a.name}
                        </button>
                      </li>
                    ))}
                  </ul>
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
