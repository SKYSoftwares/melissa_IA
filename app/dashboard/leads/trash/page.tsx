"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trash2,
  RotateCcw,
  Search,
  Filter,
  Phone,
  Mail,
  MessageCircle,
  Eye,
  Calendar,
  User,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeletedLead {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  ocupation: string;
  potentialValue: string;
  observations: string;
  status: string;
  product: string | null;
  createdAt: string;
  deletedAt: string;
  createdBy: string | null;
  creator: {
    name: string;
    email: string;
    position: string;
  } | null;
}

export default function LeadsTrashPage() {
  const { data: session } = useSession();
  const [deletedLeads, setDeletedLeads] = useState<DeletedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<DeletedLead | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Buscar leads deletados
  const fetchDeletedLeads = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/leads/trash?userEmail=${session?.user?.email}&userRole=${session?.user?.role}`
      );

      if (response.ok) {
        const leads = await response.json();
        setDeletedLeads(leads);
      } else {
        console.error("Erro ao buscar leads deletados");
      }
    } catch (error) {
      console.error("Erro ao buscar leads deletados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.email) {
      fetchDeletedLeads();
    }
  }, [session?.user?.email]);

  // Restaurar lead
  const handleRestoreLead = async (leadId: string, leadName: string) => {
    if (!confirm(`Tem certeza que deseja restaurar o lead "${leadName}"?`)) {
      return;
    }

    try {
      setRestoring(leadId);
      const response = await fetch("/api/leads/trash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });

      if (response.ok) {
        // Remover da lista local
        setDeletedLeads((prevLeads) =>
          prevLeads.filter((lead) => lead.id !== leadId)
        );
        alert("Lead restaurado com sucesso!");
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao restaurar lead");
      }
    } catch (error) {
      console.error("Erro ao restaurar lead:", error);
      alert("Erro ao restaurar lead");
    } finally {
      setRestoring(null);
    }
  };

  // Deletar permanentemente
  const handlePermanentDelete = async (leadId: string, leadName: string) => {
    if (
      !confirm(
        `ATENÇÃO: Esta ação é irreversível!\n\nTem certeza que deseja deletar permanentemente o lead "${leadName}"?\n\nTodos os dados relacionados serão perdidos para sempre.`
      )
    ) {
      return;
    }

    try {
      setDeleting(leadId);
      const response = await fetch(`/api/leads/trash?id=${leadId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remover da lista local
        setDeletedLeads((prevLeads) =>
          prevLeads.filter((lead) => lead.id !== leadId)
        );
        alert("Lead deletado permanentemente!");
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao deletar lead");
      }
    } catch (error) {
      console.error("Erro ao deletar lead:", error);
      alert("Erro ao deletar lead");
    } finally {
      setDeleting(null);
    }
  };

  // Filtrar leads
  const filteredLeads = deletedLeads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Obter status únicos para filtro
  const uniqueStatuses = [...new Set(deletedLeads.map((lead) => lead.status))];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR");
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      novos_leads: "bg-blue-500",
      qualificados: "bg-yellow-500",
      propostas_enviadas: "bg-orange-500",
      negociacao: "bg-purple-500",
      fechados: "bg-green-500",
      perdidos: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      novos_leads: "Novos Leads",
      qualificados: "Qualificados",
      propostas_enviadas: "Propostas Enviadas",
      negociacao: "Negociação",
      fechados: "Fechados",
      perdidos: "Perdidos",
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Carregando lixeira...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Trash2 className="h-8 w-8 text-red-600 mr-3" />
            Lixeira de Leads
          </h1>
          <p className="text-gray-600 mt-2">
            Leads que foram movidos para a lixeira ({deletedLeads.length} total)
          </p>
        </div>
        <Button
          onClick={fetchDeletedLeads}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Atualizar</span>
        </Button>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome, email ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {uniqueStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {getStatusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de leads deletados */}
      {filteredLeads.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Trash2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {deletedLeads.length === 0
                ? "Lixeira vazia"
                : "Nenhum lead encontrado"}
            </h3>
            <p className="text-gray-600">
              {deletedLeads.length === 0
                ? "Não há leads na lixeira no momento."
                : "Tente ajustar os filtros de busca."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredLeads.map((lead) => (
            <Card key={lead.id} className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-red-100 text-red-600">
                        {lead.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {lead.name}
                        </h3>
                        <Badge
                          className={`${getStatusColor(
                            lead.status
                          )} text-white text-xs`}
                        >
                          {getStatusLabel(lead.status)}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        {lead.email && (
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4" />
                            <span>{lead.email}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span>{lead.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>{lead.ocupation}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>Deletado em: {formatDate(lead.deletedAt)}</span>
                        </div>
                        {lead.creator && (
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>Criado por: {lead.creator.name}</span>
                          </div>
                        )}
                      </div>

                      {lead.observations && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {lead.observations}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedLead(lead);
                        setShowDetailsModal(true);
                      }}
                      className="flex items-center space-x-1"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Ver</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestoreLead(lead.id, lead.name)}
                      disabled={restoring === lead.id}
                      className="flex items-center space-x-1 text-green-600 hover:text-green-700"
                    >
                      {restoring === lead.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                      <span>Restaurar</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePermanentDelete(lead.id, lead.name)}
                      disabled={deleting === lead.id}
                      className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                    >
                      {deleting === lead.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      <span>Deletar</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de detalhes */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Detalhes do Lead</span>
            </DialogTitle>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Nome
                  </label>
                  <p className="text-sm text-gray-900">{selectedLead.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedLead.email || "Não informado"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Telefone
                  </label>
                  <p className="text-sm text-gray-900">{selectedLead.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Ocupação
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedLead.ocupation}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Valor Potencial
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedLead.potentialValue}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <Badge
                    className={`${getStatusColor(
                      selectedLead.status
                    )} text-white`}
                  >
                    {getStatusLabel(selectedLead.status)}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Criado em
                  </label>
                  <p className="text-sm text-gray-900">
                    {formatDate(selectedLead.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Deletado em
                  </label>
                  <p className="text-sm text-gray-900">
                    {formatDate(selectedLead.deletedAt)}
                  </p>
                </div>
              </div>

              {selectedLead.observations && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Observações
                  </label>
                  <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded-md">
                    {selectedLead.observations}
                  </p>
                </div>
              )}

              {selectedLead.creator && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Criado por
                  </label>
                  <p className="text-sm text-gray-900">
                    {selectedLead.creator.name} ({selectedLead.creator.position}
                    )
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Fechar
                </Button>
                <Button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleRestoreLead(selectedLead.id, selectedLead.name);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restaurar Lead
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
