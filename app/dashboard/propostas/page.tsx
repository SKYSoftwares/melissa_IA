"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Plus,
  Filter,
  Search,
  Calendar,
  Phone,
  Mail,
  Edit,
  Upload,
  X,
  Loader2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
const pipelineColumns = [
  {
    id: "pendente_envio",
    title: "Proposta Enviada",
    color: "bg-red-500",
    count: 0,
  },
  {
    id: "proposta",
    title: "Análise de Crédito",
    color: "bg-blue-500",
    count: 8,
  },
  { id: "aprovacao", title: "Vistoria", color: "bg-orange-500", count: 4 },
  { id: "negociacao", title: "Jurídico", color: "bg-yellow-500", count: 6 },
  { id: "documentacao", title: "Aprovação", color: "bg-purple-500", count: 3 },
  {
    id: "assinatura",
    title: "Contrato Assinado",
    color: "bg-pink-500",
    count: 2,
  },
  { id: "fechado", title: "Cancelado", color: "bg-green-500", count: 5 },
];

// Função utilitária para formatar moeda brasileira
function formatarMoedaBR(valor: string) {
  // Remove tudo que não for número
  let v = valor.replace(/\D/g, "");
  if (!v) return "";

  // Converte para número (tratando como centavos)
  const number = parseInt(v);
  if (isNaN(number)) return "";

  // Formata como moeda brasileira com centavos
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number / 100);
}

export default function PropostasPage() {
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [showNewProposal, setShowNewProposal] = useState(false);
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [proposals, setProposals] = useState<any[]>([]);
  console.log(proposals);
  const [dbProposals, setDbProposals] = useState<any[]>([]);
  console.log(dbProposals);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Estados para nova proposta
  const [showWhatsAppScheduleModal, setShowWhatsAppScheduleModal] =
    useState(false);
  const [whatsAppScheduleData, setWhatsAppScheduleData] = useState({
    text: "",
    date: "",
    time: "",
  });

  const [availableLeads, setAvailableLeads] = useState<any[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [newProposalData, setNewProposalData] = useState({
    title: "",
    value: "",
    priority: "medium",
    description: "",
  });
  const [creatingProposal, setCreatingProposal] = useState(false);

  // [1] ESTADOS PARA FOLLOW UP
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpData, setFollowUpData] = useState({
    observation: "",
    type: "ligacao",
    date: new Date().toISOString().slice(0, 16),
    dateNextContact: "",
  });
  const [pendingStageChange, setPendingStageChange] = useState<{
    proposal: any;
    targetStage: string;
  } | null>(null);
  const [followUpHistory, setFollowUpHistory] = useState<any[]>([]);
  const router = useRouter();
  // [5] ESTADOS PARA AGENDAMENTO
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    type: "reuniao" as "reuniao" | "ligacao" | "apresentacao",
  });

  // [6] ESTADOS PARA DETALHES COMPLETOS
  const [showFullDetailsModal, setShowFullDetailsModal] = useState(false);
  const [fullDetailsData, setFullDetailsData] = useState<any>(null);
  const [loadingFullDetails, setLoadingFullDetails] = useState(false);

  // [7] ESTADOS PARA EDIÇÃO
  const [isEditingProposal, setIsEditingProposal] = useState(false);
  const [isEditingLead, setIsEditingLead] = useState(false);
  const [editingProposal, setEditingProposal] = useState<any>(null);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [savingProposal, setSavingProposal] = useState(false);
  const [savingLead, setSavingLead] = useState(false);

  const { data: session } = useSession();
  const user = session?.user;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-4 border-l-red-500";
      case "medium":
        return "border-l-4 border-l-yellow-500";
      case "low":
        return "border-l-4 border-l-green-500";
      default:
        return "border-l-4 border-l-gray-300";
    }
  };

  const getTagColor = (tag: string) => {
    const colors = {
      Quente: "bg-red-100 text-red-800",
      Morno: "bg-yellow-100 text-yellow-800",
      Frio: "bg-blue-100 text-blue-800",
      Premium: "bg-purple-100 text-purple-800",
      Auto: "bg-green-100 text-green-800",
      Moto: "bg-orange-100 text-orange-800",
      Imóvel: "bg-indigo-100 text-indigo-800",
    };
    return colors[tag as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const handleDragStart = (e: React.DragEvent, proposal: any) => {
    setDraggedItem(proposal);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  // [2] ATUALIZAR handleDrop PARA ABRIR MODAL DE FOLLOW UP
  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    if (draggedItem && draggedItem.stage !== targetStage) {
      const isDbProposal = dbProposals.some(
        (proposal) => proposal.id === draggedItem.id
      );
      if (isDbProposal) {
        if (targetStage === "pendente_envio") {
          // Para 'pendente_envio', abrir modal de cadastro de proposta completa
          setPendingStageChange({ proposal: draggedItem, targetStage });
          setShowFollowUpModal(true);
          setDraggedItem(null);
          return;
        } else {
          // Para outras fases, abrir modal de follow up
          setPendingStageChange({ proposal: draggedItem, targetStage });
          setShowFollowUpModal(true);
          setDraggedItem(null);
          return;
        }
      } else {
        // Para propostas estáticas, mover diretamente
        setProposals((prevProposals: any) =>
          prevProposals.map((proposal: any) =>
            proposal.id === draggedItem.id
              ? { ...proposal, stage: targetStage }
              : proposal
          )
        );
      }
      console.log(`Movendo ${draggedItem.title} para ${targetStage}`);
    }
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  // Função para buscar leads disponíveis
  const fetchAvailableLeads = async () => {
    try {
      const response = await fetch("/api/leads?onlyAvailable=true");
      if (response.ok) {
        const data = await response.json();
        setAvailableLeads(data);
      }
    } catch (error) {
      console.error("Erro ao buscar leads disponíveis:", error);
    }
  };

  // Carregar propostas do banco de dados
  const fetchProposals = async () => {
    if (!user) return;
    try {
      const response = await fetch(
        `/api/proposals?userEmail=${encodeURIComponent(
          user.email ?? ""
        )}&userRole=${encodeURIComponent(user.role ?? "")}`
      );
      if (response.ok) {
        const data = await response.json();
        setDbProposals(data);
      }
    } catch (error) {
      console.error("Erro ao carregar propostas:", error);
    }
  };

  // Funções de edição
  const startEditingProposal = () => {
    if (fullDetailsData?.proposal) {
      setEditingProposal({ ...fullDetailsData.proposal });
      setIsEditingProposal(true);
    }
  };

  const startEditingLead = () => {
    if (fullDetailsData?.lead) {
      setEditingLead({ ...fullDetailsData.lead });
      setIsEditingLead(true);
    }
  };

  const saveProposalChanges = async () => {
    if (!editingProposal) return;

    setSavingProposal(true);
    try {
      const response = await fetch("/api/proposals/edit", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proposalId: editingProposal.id,
          ...editingProposal,
        }),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setFullDetailsData((prev: any) => ({
          ...prev,
          proposal: updatedData.proposal,
        }));
        setIsEditingProposal(false);
        setEditingProposal(null);
        // Atualizar a lista de propostas
        fetchProposals();
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao salvar proposta");
      }
    } catch (error) {
      console.error("Erro ao salvar proposta:", error);
      alert("Erro ao salvar proposta");
    } finally {
      setSavingProposal(false);
    }
  };

  const saveLeadChanges = async () => {
    if (!editingLead) return;

    setSavingLead(true);
    try {
      const response = await fetch("/api/leads/edit", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leadId: editingLead.id,
          ...editingLead,
        }),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setFullDetailsData((prev: any) => ({
          ...prev,
          lead: updatedData.lead,
        }));
        setIsEditingLead(false);
        setEditingLead(null);
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao salvar lead");
      }
    } catch (error) {
      console.error("Erro ao salvar lead:", error);
      alert("Erro ao salvar lead");
    } finally {
      setSavingLead(false);
    }
  };

  const cancelEditingProposal = () => {
    setIsEditingProposal(false);
    setEditingProposal(null);
  };

  const cancelEditingLead = () => {
    setIsEditingLead(false);
    setEditingLead(null);
  };

  // Função para criar proposta e mover lead automaticamente
  const handleCreateProposal = async () => {
    if (!selectedLeadId) {
      alert("Selecione um cliente para criar a proposta");
      return;
    }

    setCreatingProposal(true);

    try {
      // Buscar dados do lead selecionado
      const selectedLead = availableLeads.find(
        (lead) => lead.id === selectedLeadId
      );
      if (!selectedLead) {
        throw new Error("Lead não encontrado");
      }

      // Criar proposta
      const proposalData = {
        title:
          newProposalData.title ||
          `${
            selectedLead.product === "home_equity"
              ? "Home Equity"
              : selectedLead.product === "consorcio"
              ? "Consórcio"
              : "Proposta"
          } - ${selectedLead.name}`,
        client: selectedLead.name,
        company: selectedLead.ocupation || "Não informado",
        value:
          newProposalData.value ||
          selectedLead.potentialValue ||
          "Não informado",
        stage: "pendente_envio",
        priority: newProposalData.priority,
        description:
          newProposalData.description ||
          `Proposta criada para ${selectedLead.name}`,
        phone: selectedLead.phone,
        email: selectedLead.email,
        leadId: selectedLeadId,
      };

      const response = await fetch("/api/proposals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(proposalData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar proposta");
      }

      const newProposal = await response.json();

      // Mover lead para fase "proposta" automaticamente
      await fetch("/api/leads", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedLeadId,
          status: "proposta",
        }),
      });

      // Atualizar estados locais
      setDbProposals((prev) => [newProposal, ...prev]);
      setAvailableLeads((prev) =>
        prev.filter((lead) => lead.id !== selectedLeadId)
      );

      // Limpar formulário
      setSelectedLeadId("");
      setNewProposalData({
        title: "",
        value: "",
        priority: "medium",
        description: "",
      });
      setShowNewProposal(false);

      alert(
        'Proposta criada com sucesso! O cliente foi movido para a fase "Proposta" no pipeline de Leads.'
      );
    } catch (error) {
      console.error("Erro ao criar proposta:", error);
      alert(`Erro ao criar proposta: ${error}`);
    } finally {
      setCreatingProposal(false);
    }
  };

  // [3] FUNÇÃO PARA SALVAR FOLLOW UP E ATUALIZAR PROPOSTA
  const handleSaveFollowUp = async () => {
    if (!pendingStageChange) return;
    if (!followUpData.observation.trim()) {
      alert("Observação é obrigatória!");
      return;
    }
    setShowFollowUpModal(false);
    setLoading(true);
    try {
      // Salvar follow up vinculado ao leadId da proposta
      await fetch(
        `/api/leads/${pendingStageChange?.proposal.leadId}/followups`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: pendingStageChange.proposal.leadId,
            followUp: {
              observation: followUpData.observation,
              type: followUpData.type,
              date: followUpData.date,
              dateNextContact: followUpData.dateNextContact,
              userEmail: user?.email,
            },
          }),
        }
      );
      // Atualizar estágio da proposta
      await fetch("/api/proposals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: pendingStageChange.proposal.id,
          stage: pendingStageChange.targetStage,
        }),
      });
      setDbProposals((prevDbProposals) =>
        prevDbProposals.map((proposal) =>
          proposal.id === pendingStageChange.proposal.id
            ? { ...proposal, stage: pendingStageChange.targetStage }
            : proposal
        )
      );
      setFollowUpData({
        observation: "",
        type: "ligacao",
        date: new Date().toISOString().slice(0, 16),
        dateNextContact: "",
      });
      setPendingStageChange(null);
    } catch (error) {
      alert("Erro ao salvar follow-up ou atualizar proposta!");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar propostas ao montar o componente
  useEffect(() => {
    fetchProposals();
  }, [user]);

  // Recarregar leads disponíveis quando propostas mudarem
  useEffect(() => {
    fetchAvailableLeads();
  }, [dbProposals]);
  async function refreshFollowups() {
    fetch(`/api/leads/${pendingStageChange?.proposal.leadId}/followups`)
      .then((res) => res.json())
      .then((data) => setFollowUpHistory(Array.isArray(data) ? data : []))
      .catch(() => setFollowUpHistory([]));
  }
  // [4] BUSCAR HISTÓRICO DE FOLLOW UPS AO ABRIR MODAL
  useEffect(() => {
    if (showFollowUpModal && pendingStageChange) {
      fetch(`/api/leads/${pendingStageChange.proposal.leadId}/followups`)
        .then((res) => res.json())
        .then((data) => setFollowUpHistory(Array.isArray(data) ? data : []))
        .catch(() => setFollowUpHistory([]));
    }
  }, [showFollowUpModal, pendingStageChange]);

  // [7] FUNÇÃO PARA BUSCAR DETALHES COMPLETOS
  const handleViewFullDetails = async (proposal: any) => {
    setLoadingFullDetails(true);
    setShowFullDetailsModal(true);

    try {
      let leadDetails = null;
      let proposalDetails = proposal;

      // Se a proposta já tem dados do lead, usar eles
      if (proposal.lead) {
        leadDetails = proposal.lead;
      }

      // Tentar buscar follow-ups do lead se tivermos o leadId
      if (proposal.leadId || proposal.lead?.id) {
        try {
          const followupsResponse = await fetch(
            `/api/leads/${proposal.leadId || proposal.lead.id}/followups`
          );
          if (followupsResponse.ok) {
            const followups = await followupsResponse.json();
            if (leadDetails) {
              leadDetails.followups = followups;
            } else {
              // Se não temos dados do lead, criar um objeto básico com followups
              leadDetails = {
                id: proposal.leadId || proposal.lead?.id,
                followups: followups,
              };
            }
          }
        } catch (error) {
          console.log("Não foi possível carregar follow-ups:", error);
        }
      }

      // Se a proposta é do banco de dados e não tem todos os relacionamentos,
      // ela já deve vir com proponentes, imoveis e arquivos do GET inicial
      setFullDetailsData({
        proposal: proposalDetails,
        lead: leadDetails,
        originalProposal: proposal,
      });
    } catch (error) {
      console.error("Erro ao buscar detalhes completos:", error);
      // Usar dados já disponíveis se houver erro
      setFullDetailsData({
        proposal: proposal,
        lead: proposal.lead || null,
        originalProposal: proposal,
      });
    } finally {
      setLoadingFullDetails(false);
    }
  };

  // [6] FUNÇÕES PARA AÇÕES DOS BOTÕES
  const handlePhoneCall = (phone: string, clientName: string) => {
    if (phone) {
      // Remove caracteres especiais do telefone para o link tel:
      const cleanPhone = phone.replace(/[^\d+]/g, "");
      window.open(`tel:${cleanPhone}`, "_self");

      // Registrar a tentativa de ligação como follow-up automaticamente
      if (selectedProposal?.leadId) {
        fetch(`/api/leads/${selectedProposal.leadId}/followups`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            observation: `Ligação realizada para ${clientName} - ${phone}`,
            type: "ligacao",
            date: new Date().toISOString(),
            dateNextContact: "",
            userEmail: user?.email,
          }),
        }).catch(console.error);
      }
    } else {
      alert("Número de telefone não disponível");
    }
  };

  const handleSendEmail = (
    email: string,
    clientName: string,
    proposalTitle: string
  ) => {
    if (email) {
      const subject = encodeURIComponent(`Proposta: ${proposalTitle}`);
      const body = encodeURIComponent(
        `Olá ${clientName},\n\nEspero que esteja bem!\n\nEstou entrando em contato sobre sua proposta "${proposalTitle}".\n\nGostaria de agendar uma conversa para apresentar os detalhes e tirar suas dúvidas.\n\nFico à disposição.\n\nAtenciosamente,\n${
          user?.name || "Equipe"
        }`
      );

      window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_self");

      // Registrar o envio de email como follow-up
      if (selectedProposal?.leadId) {
        fetch(`/api/leads/${selectedProposal.leadId}/followups`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            observation: `E-mail enviado para ${clientName} - ${email}`,
            type: "email",
            date: new Date().toISOString(),
            dateNextContact: "",
            userEmail: user?.email,
          }),
        }).catch(console.error);
      }
    } else {
      alert("E-mail não disponível");
    }
  };

  const handleScheduleMeeting = (proposal: any) => {
    setScheduleData({
      title: `Reunião - ${proposal.title}`,
      description: `Reunião com ${proposal.client} sobre a proposta ${proposal.title}`,
      date: "",
      time: "",
      type: "reuniao",
    });
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = async () => {
    if (!scheduleData.date || !scheduleData.time || !scheduleData.title) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const eventDateTime = new Date(
        `${scheduleData.date}T${scheduleData.time}`
      );

      // Criar evento no Google Calendar
      const response = await fetch("/api/google/create-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: scheduleData.title,
          description: scheduleData.description,
          start: eventDateTime.toISOString(),
          end: new Date(eventDateTime.getTime() + 60 * 60 * 1000).toISOString(), // 1 hora de duração
          attendees: selectedProposal?.email ? [selectedProposal.email] : [],
          userEmail: user?.email,
        }),
      });

      if (response.ok) {
        const event = await response.json();

        // Registrar agendamento como follow-up
        if (selectedProposal?.leadId) {
          await fetch(`/api/leads/${selectedProposal.leadId}/followups`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              observation: `${
                scheduleData.type === "reuniao"
                  ? "Reunião"
                  : scheduleData.type === "ligacao"
                  ? "Ligação"
                  : "Apresentação"
              } agendada: ${
                scheduleData.title
              } para ${eventDateTime.toLocaleString()}`,
              type: scheduleData.type,
              date: new Date().toISOString(),
              dateNextContact: eventDateTime.toISOString(),
              userEmail: user?.email,
            }),
          });
        }

        alert("Evento criado com sucesso no Google Calendar!");
        setShowScheduleModal(false);
        setScheduleData({
          title: "",
          description: "",
          date: "",
          time: "",
          type: "reuniao",
        });
      } else {
        const error = await response.json();
        alert(`Erro ao criar evento: ${error.error || "Erro desconhecido"}`);
      }
    } catch (error) {
      console.error("Erro ao agendar:", error);
      alert("Erro ao criar agendamento. Tente novamente.");
    }
  };
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetch("/api/proposals/summary")
      .then((res) => res.json())
      .then((data) => setSummary(data.totals))
      .catch(() => setSummary(null));
  }, []);
  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-gray-50 min-h-screen">
      {/* 📊 Resumo Financeiro */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500">💼 Em Negociação</p>
            <p className="text-xl font-bold text-blue-600">
              R$ {summary.negociacao.toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500">❌ Canceladas</p>
            <p className="text-xl font-bold text-red-600">
              R$ {summary.canceladas.toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500">📑 Em Processo</p>
            <p className="text-xl font-bold text-orange-600">
              R$ {summary.processo.toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500">✅ Contrato Assinado</p>
            <p className="text-xl font-bold text-green-600">
              R$ {summary.assinadas.toLocaleString("pt-BR")}
            </p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Pipeline de Propostas
          </h2>
          <p className="text-muted-foreground">
            Gerencie o fluxo das suas propostas
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar propostas..." className="pl-8 w-64" />
          </div>
        </div>
      </div>
      <div className="flex justify-end mb-6">
        <Link href="/dashboard/propostas/nova">
          <Button className="bg-black text-white hover:bg-gray-900 font-semibold px-6 py-2 text-base">
            + Nova Proposta
          </Button>
        </Link>
      </div>

      {/* Pipeline Kanban - Destaque Principal */}
      <div
        className="flex gap-6 overflow-x-auto pb-6"
        style={{ minHeight: "calc(100vh - 200px)" }}
      >
        {pipelineColumns.map((column) => (
          <div
            key={column.id}
            className="flex-shrink-0 w-80"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <Card className="h-full shadow-lg border-0">
              <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-4 h-4 rounded-full ${column.color}`}
                    ></div>
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      {column.title}
                    </CardTitle>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-white text-gray-700 font-medium"
                  >
                    {proposals.filter((p) => p.stage === column.id).length +
                      dbProposals.filter((p) => p.stage === column.id).length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 p-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {/* Propostas do banco de dados */}
                {dbProposals
                  .filter((proposal) => proposal.stage === column.id)
                  .map((proposal) => (
                    <div
                      key={`db-${proposal.id}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, proposal)}
                      onDragEnd={handleDragEnd}
                      className={`p-3 bg-white border rounded-lg shadow-sm hover:shadow-md transition-all cursor-move border-l-4 border-l-blue-500 ${
                        draggedItem?.id === proposal.id
                          ? "opacity-50 rotate-2 scale-105"
                          : ""
                      }`}
                      onClick={() =>
                        setSelectedProposal({
                          ...proposal,
                          avatar: "/placeholder.svg?height=32&width=32",
                          tags: ["Automática"],
                          dueDate: new Date().toISOString().split("T")[0],
                        })
                      }
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                              {proposal.client
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium text-sm">
                              {proposal.client}
                            </h4>
                            <p className="text-xs text-gray-500 truncate max-w-[120px]">
                              {proposal.company}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-sm text-green-600">
                          {formatarMoedaBR(proposal.value)}
                        </span>
                      </div>

                      {/* Dentro do card de proposta do banco, logo após o bloco de valor/data */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex flex-wrap gap-1">
                          <Badge
                            variant="outline"
                            className="text-xs bg-blue-100 text-blue-800 border-0 py-0 px-1.5"
                          >
                            Automática
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date().toLocaleDateString("pt-BR")}
                        </span>
                      </div>

                      {/* +++ ADICIONE ESTE BLOCO +++ */}
                      {proposal.creator && (
                        <div className="mt-2 flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage
                              src={
                                proposal.creator.avatarUrl || "/placeholder.svg"
                              }
                            />
                            <AvatarFallback className="text-[10px]">
                              {(proposal.creator.name || "?")
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[11px] text-gray-600">
                            Criado por{" "}
                            <span className="font-medium text-gray-700">
                              {proposal.creator.name}
                            </span>
                            {proposal.creator.position
                              ? ` • ${proposal.creator.position}`
                              : ""}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePhoneCall(proposal.phone, proposal.client);
                            }}
                            title="Ligar"
                          >
                            <Phone className="h-3 w-3 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendEmail(
                                proposal.email,
                                proposal.client,
                                proposal.title || "Proposta"
                              );
                            }}
                            title="Enviar E-mail"
                          >
                            <Mail className="h-3 w-3 text-green-600" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewFullDetails(proposal);
                          }}
                          title="Ver Detalhes Completos"
                        >
                          <Edit className="h-3 w-3 text-gray-600" />
                        </Button>
                      </div>
                    </div>
                  ))}

                {/* Propostas estáticas existentes */}
                {proposals
                  .filter((proposal) => proposal.stage === column.id)
                  .map((proposal) => (
                    <div
                      key={proposal.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, proposal)}
                      onDragEnd={handleDragEnd}
                      className={`p-3 bg-white border rounded-lg shadow-sm hover:shadow-md transition-all cursor-move ${getPriorityColor(
                        proposal.priority
                      )} ${
                        draggedItem?.id === proposal.id
                          ? "opacity-50 rotate-2 scale-105"
                          : ""
                      }`}
                      onClick={() => setSelectedProposal(proposal)}
                    >
                      {/* Dentro do card de proposta do banco, logo após o bloco de valor/data */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex flex-wrap gap-1">
                          <Badge
                            variant="outline"
                            className="text-xs bg-blue-100 text-blue-800 border-0 py-0 px-1.5"
                          >
                            Automática
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date().toLocaleDateString("pt-BR")}
                        </span>
                      </div>

                      {/* +++ ADICIONE ESTE BLOCO +++ */}
                      {proposal.creator && (
                        <div className="mt-2 flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage
                              src={
                                proposal.creator.avatarUrl || "/placeholder.svg"
                              }
                            />
                            <AvatarFallback className="text-[10px]">
                              {(proposal.creator.name || "?")
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[11px] text-gray-600">
                            Criado por{" "}
                            <span className="font-medium text-gray-700">
                              {proposal.creator.name}
                            </span>
                            {proposal.creator.position
                              ? ` • ${proposal.creator.position}`
                              : ""}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center mb-2">
                        <div className="flex flex-wrap gap-1">
                          {proposal.tags.map((tag: any) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className={`text-xs ${getTagColor(
                                tag
                              )} border-0 py-0 px-1.5`}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(proposal.dueDate).toLocaleDateString(
                            "pt-BR"
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePhoneCall(proposal.phone, proposal.client);
                            }}
                            title="Ligar"
                          >
                            <Phone className="h-3 w-3 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendEmail(
                                proposal.email,
                                proposal.client,
                                proposal.title
                              );
                            }}
                            title="Enviar E-mail"
                          >
                            <Mail className="h-3 w-3 text-green-600" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewFullDetails(proposal);
                          }}
                          title="Ver Detalhes Completos"
                        >
                          <Edit className="h-3 w-3 text-gray-600" />
                        </Button>
                      </div>
                    </div>
                  ))}

                <Button
                  variant="ghost"
                  className="w-full border-2 border-dashed border-gray-300 h-10 text-gray-500 hover:border-gray-400 hover:bg-gray-50 rounded-lg text-sm"
                  onClick={() => setShowNewProposal(true)}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Adicionar
                </Button>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Modal de Detalhes da Proposta */}
      {selectedProposal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedProposal.title}</CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedProposal(null)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={selectedProposal.avatar || "/placeholder.svg"}
                  />
                  <AvatarFallback>
                    {selectedProposal.client
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">
                    {selectedProposal.client}
                  </h3>
                  <p className="text-muted-foreground">
                    {selectedProposal.company}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={getTagColor(selectedProposal.tags[0])}>
                      {selectedProposal.tags[0]}
                    </Badge>
                    <span className="text-2xl font-bold text-green-600">
                      {formatarMoedaBR(selectedProposal.value)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">E-mail</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedProposal.email}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Telefone</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedProposal.phone}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Data de Vencimento
                  </label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedProposal.dueDate).toLocaleDateString(
                      "pt-BR"
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Prioridade</label>
                  <p className="text-sm text-muted-foreground capitalize">
                    {selectedProposal.priority}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Descrição</label>
                <p className="text-sm text-muted-foreground">
                  {selectedProposal.description}
                </p>
              </div>

              <div className="flex space-x-2">
                <Button
                  className="flex-1"
                  onClick={() => setShowWhatsAppScheduleModal(true)}
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Agendar mensagem
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    router.push(
                      `/dashboard/propostas/edit/${selectedProposal.id}`
                    )
                  }
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Editar proposta
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Nova Proposta */}
      {showNewProposal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Nova Proposta</CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => setShowNewProposal(false)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client-select">Selecione o Cliente *</Label>
                <Select
                  value={selectedLeadId}
                  onValueChange={setSelectedLeadId}
                  disabled={availableLeads.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um cliente para criar a proposta" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLeads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.name} ({lead.ocupation || "Não informado"}) -{" "}
                        {lead.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableLeads.length === 0 && (
                  <p className="text-sm text-orange-600 mt-2">
                    Todos os clientes já possuem propostas ou estão na lixeira.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="proposal-title">
                    Título da Proposta (Opcional)
                  </Label>
                  <Input
                    id="proposal-title"
                    placeholder="Ex: Proposta Home Equity"
                    value={newProposalData.title}
                    onChange={(e) =>
                      setNewProposalData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proposal-value">Valor (Opcional)</Label>
                  <Input
                    id="proposal-value"
                    placeholder="R$ 100.000,00"
                    value={newProposalData.value}
                    onChange={(e) => {
                      const formatted = formatarMoedaBR(e.target.value);
                      setNewProposalData((prev) => ({
                        ...prev,
                        value: formatted,
                      }));
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select
                    value={newProposalData.priority}
                    onValueChange={(value) =>
                      setNewProposalData((prev) => ({
                        ...prev,
                        priority: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="low">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status Atual do Cliente</Label>
                  <Input
                    value={
                      selectedLeadId
                        ? availableLeads.find((l) => l.id === selectedLeadId)
                            ?.status || ""
                        : ""
                    }
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="proposal-description">
                  Descrição (Opcional)
                </Label>
                <Textarea
                  id="proposal-description"
                  placeholder="Descreva os detalhes da proposta..."
                  rows={3}
                  value={newProposalData.description}
                  onChange={(e) =>
                    setNewProposalData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>⚠️ Importante:</strong> Ao criar esta proposta, o
                  cliente será automaticamente movido para a fase "Proposta" no
                  pipeline de Leads e Contatos.
                </p>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => setShowNewProposal(false)}
                  variant="outline"
                  disabled={creatingProposal}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateProposal}
                  disabled={!selectedLeadId || creatingProposal}
                >
                  {creatingProposal ? "Criando..." : "Criar Proposta"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {showWhatsAppScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Agendar mensagem no WhatsApp</CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => setShowWhatsAppScheduleModal(false)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Mensagem *</Label>
                <Textarea
                  value={whatsAppScheduleData.text}
                  onChange={(e) =>
                    setWhatsAppScheduleData({
                      ...whatsAppScheduleData,
                      text: e.target.value,
                    })
                  }
                  rows={3}
                  placeholder="Digite a mensagem a ser enviada..."
                />
              </div>
              <div>
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={whatsAppScheduleData.date}
                  onChange={(e) =>
                    setWhatsAppScheduleData({
                      ...whatsAppScheduleData,
                      date: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>Hora *</Label>
                <Input
                  type="time"
                  value={whatsAppScheduleData.time}
                  onChange={(e) =>
                    setWhatsAppScheduleData({
                      ...whatsAppScheduleData,
                      time: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowWhatsAppScheduleModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={async () => {
                    if (
                      !whatsAppScheduleData.text ||
                      !whatsAppScheduleData.date ||
                      !whatsAppScheduleData.time
                    ) {
                      alert("Preencha todos os campos!");
                      return;
                    }

                    const scheduledAt = new Date(
                      `${whatsAppScheduleData.date}T${whatsAppScheduleData.time}`
                    ).toISOString();

                    await fetch("/api/whatsapp/schedule-message", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        contactId: selectedProposal.leadId, // ou selectedProposal.id dependendo do backend
                        sessionName: "default", // ajuste conforme seu fluxo
                        type: "text",
                        text: whatsAppScheduleData.text,
                        scheduledAt,
                      }),
                    });

                    alert("Mensagem agendada com sucesso!");
                    setShowWhatsAppScheduleModal(false);
                    setWhatsAppScheduleData({ text: "", date: "", time: "" });
                  }}
                >
                  Agendar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Modal de Follow Up */}
      {showFollowUpModal && pendingStageChange && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Registrar Follow Up</CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowFollowUpModal(false);
                    setPendingStageChange(null);
                  }}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingStageChange.targetStage === "pendente_envio" && (
                <>
                  <p className="text-sm text-gray-700">
                    Para cadastrar a proposta completa para o cliente{" "}
                    <strong>{pendingStageChange.proposal.client}</strong>,
                    clique no botão abaixo.
                  </p>
                  <Button
                    className="w-full"
                    onClick={() => {
                      setShowFollowUpModal(false);
                      setPendingStageChange(null);
                      window.location.href = `/dashboard/propostas/nova?leadId=${pendingStageChange.proposal.leadId}`;
                    }}
                  >
                    Cadastrar Proposta Completa
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setShowFollowUpModal(false);
                      setPendingStageChange(null);
                    }}
                  >
                    Cancelar
                  </Button>
                </>
              )}
              {pendingStageChange.targetStage !== "pendente_envio" && (
                <>
                  <div>
                    <Label>Observação *</Label>
                    <Textarea
                      value={followUpData.observation}
                      onChange={(e) =>
                        setFollowUpData({
                          ...followUpData,
                          observation: e.target.value,
                        })
                      }
                      required
                      rows={3}
                      placeholder="Descreva o contato, avanço ou motivo da mudança de fase..."
                    />
                  </div>
                  <div>
                    <Label>Tipo de Contato</Label>
                    <Select
                      value={followUpData.type}
                      onValueChange={(v) =>
                        setFollowUpData({ ...followUpData, type: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ligacao">Ligação</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="email">E-mail</SelectItem>
                        <SelectItem value="reuniao">Reunião</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Data de Contato</Label>
                    <Input
                      type="datetime-local"
                      value={followUpData.date}
                      onChange={(e) =>
                        setFollowUpData({
                          ...followUpData,
                          date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Data do Próximo Contato</Label>
                    <Input
                      type="datetime-local"
                      value={followUpData.dateNextContact}
                      onChange={(e) =>
                        setFollowUpData({
                          ...followUpData,
                          dateNextContact: e.target.value,
                        })
                      }
                    />
                  </div>
                  {/* Histórico de Follow-ups */}
                  <div>
                    <Label>Histórico de Follow-ups</Label>
                    <div className="max-h-40 overflow-y-auto border rounded p-2 bg-gray-50">
                      {followUpHistory.length === 0 && (
                        <div className="text-xs text-gray-400">
                          Nenhum follow-up registrado.
                        </div>
                      )}
                      {followUpHistory.map((f) => (
                        <div
                          key={f.id}
                          className="mb-2 pb-2 border-b last:border-b-0"
                        >
                          <div className="text-xs text-gray-600">
                            {new Date(f.date).toLocaleString()} (
                            {f.tipeOfContact})
                          </div>

                          {editingId === f.id ? (
                            <div>
                              <Textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                rows={3}
                              />
                              <div className="flex gap-2 mt-1">
                                <Button
                                  size="sm"
                                  onClick={async () => {
                                    await fetch(`/api/followups/${f.id}`, {
                                      method: "PUT",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        observations: editText,
                                      }),
                                    });
                                    setEditingId(null);
                                    refreshFollowups(); // recarrega histórico
                                  }}
                                >
                                  Salvar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingId(null)}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center">
                              <div className="text-sm">{f.observations}</div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingId(f.id);
                                  setEditText(f.observations);
                                }}
                              >
                                Editar
                              </Button>
                            </div>
                          )}

                          {f.dateNextContact && (
                            <div className="text-xs text-blue-600 mt-1">
                              Próximo contato:{" "}
                              {new Date(f.dateNextContact).toLocaleString()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* 🔥 Botão de criar novo follow-up */}
                    <div className="mt-2 flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => {
                          setFollowUpData({
                            observation: "",
                            type: "ligacao",
                            date: new Date().toISOString().slice(0, 16),
                            dateNextContact: "",
                          });
                          setShowFollowUpModal(true); // reusa o modal já existente
                          setPendingStageChange({
                            proposal: selectedProposal, // ou a proposta atual
                            targetStage: selectedProposal?.stage || "proposta",
                          });
                        }}
                      >
                        + Criar Follow-up
                      </Button>
                    </div>
                  </div>

                  <div className="flex space-x-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowFollowUpModal(false);
                        setPendingStageChange(null);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveFollowUp} disabled={loading}>
                      Salvar e Mover
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Agendamento */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Agendar Reunião</CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowScheduleModal(false);
                    setScheduleData({
                      title: "",
                      description: "",
                      date: "",
                      time: "",
                      type: "reuniao",
                    });
                  }}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Título da Reunião *</Label>
                <Input
                  value={scheduleData.title}
                  onChange={(e) =>
                    setScheduleData({ ...scheduleData, title: e.target.value })
                  }
                  placeholder="Ex: Reunião de Negócios"
                  required
                />
              </div>
              <div>
                <Label>Descrição (Opcional)</Label>
                <Textarea
                  value={scheduleData.description}
                  onChange={(e) =>
                    setScheduleData({
                      ...scheduleData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Detalhes da reunião, participantes, etc."
                  rows={3}
                />
              </div>
              <div>
                <Label>Data da Reunião *</Label>
                <Input
                  type="date"
                  value={scheduleData.date}
                  onChange={(e) =>
                    setScheduleData({ ...scheduleData, date: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label>Horário da Reunião *</Label>
                <Input
                  type="time"
                  value={scheduleData.time}
                  onChange={(e) =>
                    setScheduleData({ ...scheduleData, time: e.target.value })
                  }
                  required
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowScheduleModal(false);
                    setScheduleData({
                      title: "",
                      description: "",
                      date: "",
                      time: "",
                      type: "reuniao",
                    });
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSaveSchedule} disabled={loading}>
                  Agendar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Detalhes Completos */}
      {showFullDetailsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Detalhes Completos - Proposta & Lead</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startEditingProposal}
                    disabled={isEditingProposal || isEditingLead}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar Proposta
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startEditingLead}
                    disabled={isEditingProposal || isEditingLead}
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar Lead
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowFullDetailsModal(false);
                      setFullDetailsData(null);
                      setIsEditingProposal(false);
                      setIsEditingLead(false);
                      setEditingProposal(null);
                      setEditingLead(null);
                    }}
                  >
                    ×
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingFullDetails ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">
                      Carregando detalhes completos...
                    </p>
                  </div>
                </div>
              ) : fullDetailsData ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Seção da Proposta */}
                  <div className="space-y-4">
                    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-blue-800 flex items-center">
                          📋 Dados da Proposta
                        </h3>
                        {isEditingProposal && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={cancelEditingProposal}
                              className="text-gray-600"
                            >
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              onClick={saveProposalChanges}
                              disabled={savingProposal}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              {savingProposal ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  Salvando...
                                </>
                              ) : (
                                "Salvar"
                              )}
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <label className="font-medium text-gray-700">
                            Título:
                          </label>
                          {isEditingProposal ? (
                            <Input
                              value={editingProposal?.title || ""}
                              onChange={(e) =>
                                setEditingProposal((prev: any) => ({
                                  ...prev,
                                  title: e.target.value,
                                }))
                              }
                              className="mt-1"
                            />
                          ) : (
                            <p className="text-gray-600">
                              {fullDetailsData.proposal?.title}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="font-medium text-gray-700">
                            Cliente:
                          </label>
                          {isEditingProposal ? (
                            <Input
                              value={editingProposal?.client || ""}
                              onChange={(e) =>
                                setEditingProposal((prev: any) => ({
                                  ...prev,
                                  client: e.target.value,
                                }))
                              }
                              className="mt-1"
                            />
                          ) : (
                            <p className="text-gray-600">
                              {fullDetailsData.proposal?.client}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="font-medium text-gray-700">
                            Empresa:
                          </label>
                          {isEditingProposal ? (
                            <Input
                              value={editingProposal?.company || ""}
                              onChange={(e) =>
                                setEditingProposal((prev: any) => ({
                                  ...prev,
                                  company: e.target.value,
                                }))
                              }
                              className="mt-1"
                            />
                          ) : (
                            <p className="text-gray-600">
                              {fullDetailsData.proposal?.company}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="font-medium text-gray-700">
                            Valor:
                          </label>
                          {isEditingProposal ? (
                            <Input
                              value={editingProposal?.value || ""}
                              onChange={(e) =>
                                setEditingProposal((prev: any) => ({
                                  ...prev,
                                  value: e.target.value,
                                }))
                              }
                              className="mt-1"
                              placeholder="R$ 0,00"
                            />
                          ) : (
                            <p className="text-gray-600 font-semibold text-green-600">
                              {formatarMoedaBR(
                                fullDetailsData.proposal?.value || "0"
                              )}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="font-medium text-gray-700">
                            Estágio:
                          </label>
                          {isEditingProposal ? (
                            <Select
                              value={editingProposal?.stage || ""}
                              onValueChange={(value) =>
                                setEditingProposal((prev: any) => ({
                                  ...prev,
                                  stage: value,
                                }))
                              }
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Selecione o estágio" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pendente_envio">
                                  Pendente Envio
                                </SelectItem>
                                <SelectItem value="proposta">
                                  Análise de Crédito
                                </SelectItem>
                                <SelectItem value="aprovacao">
                                  Vistoria
                                </SelectItem>
                                <SelectItem value="negociacao">
                                  Jurídico
                                </SelectItem>
                                <SelectItem value="documentacao">
                                  Aprovação
                                </SelectItem>
                                <SelectItem value="fechado">Fechado</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-gray-600 capitalize">
                              {fullDetailsData.proposal?.stage}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="font-medium text-gray-700">
                            Prioridade:
                          </label>
                          {isEditingProposal ? (
                            <Select
                              value={editingProposal?.priority || ""}
                              onValueChange={(value) =>
                                setEditingProposal((prev: any) => ({
                                  ...prev,
                                  priority: value,
                                }))
                              }
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Selecione a prioridade" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Baixa</SelectItem>
                                <SelectItem value="medium">Média</SelectItem>
                                <SelectItem value="high">Alta</SelectItem>
                                <SelectItem value="urgent">Urgente</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-gray-600 capitalize">
                              {fullDetailsData.proposal?.priority}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="font-medium text-gray-700">
                            Data de Vencimento:
                          </label>
                          {isEditingProposal ? (
                            <Input
                              type="date"
                              value={
                                editingProposal?.dueDate
                                  ? new Date(editingProposal.dueDate)
                                      .toISOString()
                                      .split("T")[0]
                                  : ""
                              }
                              onChange={(e) =>
                                setEditingProposal((prev: any) => ({
                                  ...prev,
                                  dueDate: e.target.value,
                                }))
                              }
                              className="mt-1"
                            />
                          ) : (
                            <p className="text-gray-600">
                              {fullDetailsData.proposal?.dueDate
                                ? new Date(
                                    fullDetailsData.proposal.dueDate
                                  ).toLocaleDateString("pt-BR")
                                : "Não definida"}
                            </p>
                          )}
                        </div>
                        <div className="col-span-2">
                          <label className="font-medium text-gray-700">
                            Descrição:
                          </label>
                          {isEditingProposal ? (
                            <Textarea
                              value={editingProposal?.description || ""}
                              onChange={(e) =>
                                setEditingProposal((prev: any) => ({
                                  ...prev,
                                  description: e.target.value,
                                }))
                              }
                              className="mt-1"
                              rows={3}
                              placeholder="Descrição da proposta..."
                            />
                          ) : (
                            <p className="text-gray-600">
                              {fullDetailsData.proposal?.description ||
                                "Sem descrição"}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="font-medium text-gray-700">
                            Telefone:
                          </label>
                          {isEditingProposal ? (
                            <Input
                              value={editingProposal?.phone || ""}
                              onChange={(e) =>
                                setEditingProposal((prev: any) => ({
                                  ...prev,
                                  phone: e.target.value,
                                }))
                              }
                              className="mt-1"
                              placeholder="(11) 99999-9999"
                            />
                          ) : (
                            <p className="text-gray-600">
                              {fullDetailsData.proposal?.phone}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="font-medium text-gray-700">
                            E-mail:
                          </label>
                          {isEditingProposal ? (
                            <Input
                              type="email"
                              value={editingProposal?.email || ""}
                              onChange={(e) =>
                                setEditingProposal((prev: any) => ({
                                  ...prev,
                                  email: e.target.value,
                                }))
                              }
                              className="mt-1"
                              placeholder="cliente@email.com"
                            />
                          ) : (
                            <p className="text-gray-600">
                              {fullDetailsData.proposal?.email}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="font-medium text-gray-700">
                            Criado em:
                          </label>
                          <p className="text-gray-600">
                            {fullDetailsData.proposal?.createdAt
                              ? new Date(
                                  fullDetailsData.proposal.createdAt
                                ).toLocaleString("pt-BR")
                              : "Não disponível"}
                          </p>
                        </div>
                        <div>
                          <label className="font-medium text-gray-700">
                            Atualizado em:
                          </label>
                          <p className="text-gray-600">
                            {fullDetailsData.proposal?.updatedAt
                              ? new Date(
                                  fullDetailsData.proposal.updatedAt
                                ).toLocaleString("pt-BR")
                              : "Nunca"}
                          </p>
                        </div>
                      </div>

                      {/* Dados de Simulação de Consórcio */}
                      {(fullDetailsData.proposal?.creditoUnitario ||
                        fullDetailsData.proposal?.taxa) && (
                        <div className="mt-4 pt-4 border-t border-blue-200">
                          <h4 className="font-medium text-blue-700 mb-2">
                            📊 Simulação de Consórcio
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {fullDetailsData.proposal?.creditoUnitario && (
                              <div>
                                <label className="font-medium text-gray-700">
                                  Crédito Unitário:
                                </label>
                                <p className="text-gray-600">
                                  R${" "}
                                  {fullDetailsData.proposal.creditoUnitario.toLocaleString()}
                                </p>
                              </div>
                            )}
                            {fullDetailsData.proposal?.taxa && (
                              <div>
                                <label className="font-medium text-gray-700">
                                  Taxa:
                                </label>
                                <p className="text-gray-600">
                                  {fullDetailsData.proposal.taxa}%
                                </p>
                              </div>
                            )}
                            {fullDetailsData.proposal?.prazoConsorcio && (
                              <div>
                                <label className="font-medium text-gray-700">
                                  Prazo:
                                </label>
                                <p className="text-gray-600">
                                  {fullDetailsData.proposal.prazoConsorcio}{" "}
                                  meses
                                </p>
                              </div>
                            )}
                            {fullDetailsData.proposal?.opcaoParcela && (
                              <div>
                                <label className="font-medium text-gray-700">
                                  Opção Parcela:
                                </label>
                                <p className="text-gray-600">
                                  {fullDetailsData.proposal.opcaoParcela}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Arquivos da Proposta */}
                    {fullDetailsData.proposal?.arquivos &&
                      fullDetailsData.proposal.arquivos.length > 0 && (
                        <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                          <h4 className="font-medium text-purple-800 mb-2 flex items-center justify-between">
                            <span>📎 Arquivos da Proposta</span>

                            {/* Botão para baixar tudo em ZIP */}
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isLoading}
                              onClick={async () => {
                                try {
                                  setIsLoading(true);

                                  const arquivos =
                                    fullDetailsData.proposal.arquivos.map(
                                      (a: any) => ({
                                        url: a.url,
                                        name: a.originalName || a.name,
                                        documentType: a.documentType,
                                      })
                                    );

                                  const defesa =
                                    fullDetailsData.proposal.description || "";

                                  const response = await fetch(
                                    "/api/download/all",
                                    {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        arquivos,
                                        defesa,
                                      }),
                                    }
                                  );

                                  if (!response.ok) {
                                    console.error("Erro ao baixar ZIP");
                                    return;
                                  }

                                  const blob = await response.blob();
                                  const link = document.createElement("a");
                                  link.href = URL.createObjectURL(blob);
                                  link.download = "proposta-completa.zip";
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                } catch (err) {
                                  console.error("Erro ao gerar ZIP:", err);
                                } finally {
                                  setIsLoading(false);
                                }
                              }}
                            >
                              {isLoading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Gerando ZIP...
                                </>
                              ) : (
                                "📦 Baixar Tudo (ZIP)"
                              )}
                            </Button>
                          </h4>
                          <div className="space-y-2">
                            {fullDetailsData.proposal.arquivos.map(
                              (arquivo: any) => (
                                <div
                                  key={arquivo.id}
                                  className="flex items-center justify-between bg-white p-2 rounded border"
                                >
                                  <span className="text-sm">
                                    {arquivo.name}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      window.location.href = `/api/download/new?url=${encodeURIComponent(
                                        arquivo.url
                                      )}&name=${encodeURIComponent(
                                        arquivo.originalName ||
                                          arquivo.name ||
                                          "arquivo"
                                      )}`;
                                    }}
                                  >
                                    Baixar
                                  </Button>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Seção do Lead */}
                  <div className="space-y-4">
                    {fullDetailsData.lead && (
                      <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-green-800 flex items-center">
                            👤 Dados do Lead
                          </h3>
                          {isEditingLead && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={cancelEditingLead}
                                className="text-gray-600"
                              >
                                Cancelar
                              </Button>
                              <Button
                                size="sm"
                                onClick={saveLeadChanges}
                                disabled={savingLead}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {savingLead ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                    Salvando...
                                  </>
                                ) : (
                                  "Salvar"
                                )}
                              </Button>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <label className="font-medium text-gray-700">
                              Nome:
                            </label>
                            {isEditingLead ? (
                              <Input
                                value={editingLead?.name || ""}
                                onChange={(e) =>
                                  setEditingLead((prev: any) => ({
                                    ...prev,
                                    name: e.target.value,
                                  }))
                                }
                                className="mt-1"
                              />
                            ) : (
                              <p className="text-gray-600">
                                {fullDetailsData.lead.name}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="font-medium text-gray-700">
                              E-mail:
                            </label>
                            {isEditingLead ? (
                              <Input
                                type="email"
                                value={editingLead?.email || ""}
                                onChange={(e) =>
                                  setEditingLead((prev: any) => ({
                                    ...prev,
                                    email: e.target.value,
                                  }))
                                }
                                className="mt-1"
                                placeholder="lead@email.com"
                              />
                            ) : (
                              <p className="text-gray-600">
                                {fullDetailsData.lead.email}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="font-medium text-gray-700">
                              Telefone:
                            </label>
                            {isEditingLead ? (
                              <Input
                                value={editingLead?.phone || ""}
                                onChange={(e) =>
                                  setEditingLead((prev: any) => ({
                                    ...prev,
                                    phone: e.target.value,
                                  }))
                                }
                                className="mt-1"
                                placeholder="(11) 99999-9999"
                              />
                            ) : (
                              <p className="text-gray-600">
                                {fullDetailsData.lead.phone}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="font-medium text-gray-700">
                              Ocupação:
                            </label>
                            {isEditingLead ? (
                              <Input
                                value={editingLead?.ocupation || ""}
                                onChange={(e) =>
                                  setEditingLead((prev: any) => ({
                                    ...prev,
                                    ocupation: e.target.value,
                                  }))
                                }
                                className="mt-1"
                                placeholder="Profissão do lead"
                              />
                            ) : (
                              <p className="text-gray-600">
                                {fullDetailsData.lead.ocupation}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="font-medium text-gray-700">
                              Valor Potencial:
                            </label>
                            {isEditingLead ? (
                              <Input
                                value={editingLead?.potentialValue || ""}
                                onChange={(e) =>
                                  setEditingLead((prev: any) => ({
                                    ...prev,
                                    potentialValue: e.target.value,
                                  }))
                                }
                                className="mt-1"
                                placeholder="R$ 0,00"
                              />
                            ) : (
                              <p className="text-gray-600 font-semibold text-green-600">
                                {formatarMoedaBR(
                                  fullDetailsData.lead.potentialValue || "0"
                                )}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="font-medium text-gray-700">
                              Status:
                            </label>
                            {isEditingLead ? (
                              <Select
                                value={editingLead?.status || ""}
                                onValueChange={(value) =>
                                  setEditingLead((prev: any) => ({
                                    ...prev,
                                    status: value,
                                  }))
                                }
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Selecione o status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="novos_leads">
                                    Novos Leads
                                  </SelectItem>
                                  <SelectItem value="proposta">
                                    Proposta
                                  </SelectItem>
                                  <SelectItem value="negociacao">
                                    Negociação
                                  </SelectItem>
                                  <SelectItem value="fechado">
                                    Fechado
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <p className="text-gray-600 capitalize">
                                {fullDetailsData.lead.status}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="font-medium text-gray-700">
                              Produto:
                            </label>
                            {isEditingLead ? (
                              <Select
                                value={editingLead?.product || ""}
                                onValueChange={(value) =>
                                  setEditingLead((prev: any) => ({
                                    ...prev,
                                    product: value,
                                  }))
                                }
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Selecione o produto" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="home_equity">
                                    Home Equity
                                  </SelectItem>
                                  <SelectItem value="consorcio">
                                    Consórcio
                                  </SelectItem>
                                  <SelectItem value="outros">Outros</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <p className="text-gray-600">
                                {fullDetailsData.lead.product ||
                                  "Não especificado"}
                              </p>
                            )}
                          </div>
                          <div className="col-span-2">
                            <label className="font-medium text-gray-700">
                              Observações:
                            </label>
                            {isEditingLead ? (
                              <Textarea
                                value={editingLead?.observations || ""}
                                onChange={(e) =>
                                  setEditingLead((prev: any) => ({
                                    ...prev,
                                    observations: e.target.value,
                                  }))
                                }
                                className="mt-1"
                                rows={3}
                                placeholder="Observações sobre o lead..."
                              />
                            ) : (
                              <p className="text-gray-600">
                                {fullDetailsData.lead.observations ||
                                  "Sem observações"}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="font-medium text-gray-700">
                              Criado em:
                            </label>
                            <p className="text-gray-600">
                              {fullDetailsData.lead.createdAt
                                ? new Date(
                                    fullDetailsData.lead.createdAt
                                  ).toLocaleString("pt-BR")
                                : "Não disponível"}
                            </p>
                          </div>
                          <div>
                            <label className="font-medium text-gray-700">
                              Atualizado em:
                            </label>
                            <p className="text-gray-600">
                              {fullDetailsData.lead.updatedAt
                                ? new Date(
                                    fullDetailsData.lead.updatedAt
                                  ).toLocaleString("pt-BR")
                                : "Nunca"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Follow-ups */}
                    {fullDetailsData.lead?.followups &&
                      fullDetailsData.lead.followups.length > 0 && (
                        <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                          <h4 className="font-medium text-orange-800 mb-3 flex items-center">
                            📞 Histórico de Follow-ups (
                            {fullDetailsData.lead.followups.length})
                          </h4>
                          <div className="max-h-64 overflow-y-auto space-y-3">
                            {fullDetailsData.lead.followups
                              .sort(
                                (a: any, b: any) =>
                                  new Date(b.date).getTime() -
                                  new Date(a.date).getTime()
                              )
                              .map((followup: any) => (
                                <div
                                  key={followup.id}
                                  className="bg-white p-3 rounded border border-orange-200"
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs text-orange-600 font-medium uppercase">
                                      {followup.tipeOfContact}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(followup.date).toLocaleString(
                                        "pt-BR"
                                      )}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700">
                                    {followup.observations}
                                  </p>
                                  {followup.dateNextContact && (
                                    <div className="mt-2 text-xs text-blue-600">
                                      Próximo contato:{" "}
                                      {new Date(
                                        followup.dateNextContact
                                      ).toLocaleString("pt-BR")}
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                    {/* Proponentes */}
                    {fullDetailsData.proposal?.proponentes &&
                      fullDetailsData.proposal.proponentes.length > 0 && (
                        <div className="border border-indigo-200 rounded-lg p-4 bg-indigo-50">
                          <h4 className="font-medium text-indigo-800 mb-3 flex items-center">
                            👥 Proponentes (
                            {fullDetailsData.proposal.proponentes.length})
                          </h4>
                          <div className="space-y-2">
                            {fullDetailsData.proposal.proponentes.map(
                              (proponente: any) => (
                                <div
                                  key={proponente.id}
                                  className="bg-white p-3 rounded border"
                                >
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <label className="font-medium">
                                        Nome:
                                      </label>
                                      <p>{proponente.name}</p>
                                    </div>
                                    <div>
                                      <label className="font-medium">
                                        CPF:
                                      </label>
                                      <p>{proponente.cpf}</p>
                                    </div>
                                    <div>
                                      <label className="font-medium">
                                        E-mail:
                                      </label>
                                      <p>{proponente.email}</p>
                                    </div>
                                    <div>
                                      <label className="font-medium">
                                        Telefone:
                                      </label>
                                      <p>{proponente.phone}</p>
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Imóveis */}
                    {fullDetailsData.proposal?.imoveis &&
                      fullDetailsData.proposal.imoveis.length > 0 && (
                        <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                          <h4 className="font-medium text-yellow-800 mb-3 flex items-center">
                            🏠 Imóveis (
                            {fullDetailsData.proposal.imoveis.length})
                          </h4>
                          <div className="space-y-2">
                            {fullDetailsData.proposal.imoveis.map(
                              (imovel: any) => (
                                <div
                                  key={imovel.id}
                                  className="bg-white p-3 rounded border"
                                >
                                  <div className="text-sm">
                                    <div className="mb-2">
                                      <label className="font-medium">
                                        Endereço:
                                      </label>
                                      <p>{imovel.address}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="font-medium">
                                          Valor:
                                        </label>
                                        <p className="font-semibold text-green-600">
                                          {formatarMoedaBR(imovel.value || "0")}
                                        </p>
                                      </div>
                                      <div>
                                        <label className="font-medium">
                                          Descrição:
                                        </label>
                                        <p>
                                          {imovel.description ||
                                            "Sem descrição"}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhum dado disponível</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
