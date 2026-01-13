'use client';

import React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    BarChart3,
    Calendar,
    Download,
    Edit,
    Eye,
    FileSpreadsheet,
    Loader2,
    Mail,
    MessageCircle,
    Phone,
    Plus,
    Search,
    Star,
    Trash2,
    TrendingUp,
    Users,
    Video,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

const pipelineColumns = [
    { id: 'novos_leads', title: 'Novos Leads', color: 'bg-blue-500', count: 2 },
    {
        id: 'primeiro_contato',
        title: 'Primeiro Contato',
        color: 'bg-purple-500',
        count: 2,
    },
    {
        id: 'agendamento',
        title: 'Agendamento',
        color: 'bg-yellow-500',
        count: 1,
    },
    { id: 'reuniao', title: 'Reunião', color: 'bg-orange-500', count: 1 },
    { id: 'negociacao', title: 'Negociação', color: 'bg-green-500', count: 1 },
    { id: 'proposta', title: 'Proposta', color: 'bg-green-500', count: 1 },
    { id: 'lixeira', title: 'Lixeira', color: 'bg-red-800', count: 1 }, // Substitui Documentação
    // Remover Aprovação e Assinatura
];

// Função utilitária para formatar moeda brasileira
function formatarMoedaBR(valor: string) {
    // Remove tudo que não for número
    let v = valor.replace(/\D/g, '');
    if (!v) return '';

    // Converte para número (tratando como centavos)
    const number = parseInt(v);
    if (isNaN(number)) return '';

    // Formata como moeda brasileira com centavos
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(number / 100);
}
interface LeadStat {
    label: string;
    value: string;
    change: string;
    icon: React.ComponentType<any>;
}

export default function LeadsPage() {
    const [selectedLead, setSelectedLead] = useState<any>(null);
    const [showNewLead, setShowNewLead] = useState(false);
    const [draggedItem, setDraggedItem] = useState<any>(null);
    const [leads, setLeads] = useState<any[]>([]);
    const [dbLeads, setDbLeads] = useState<any[]>([]);
    const [showScheduleMeeting, setShowScheduleMeeting] = useState(false);
    const [meetingForm, setMeetingForm] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        duration: '60',
        attendees: '',
    });
    const [googleConnected, setGoogleConnected] = useState(false);
    const [checkingGoogle, setCheckingGoogle] = useState(false);
    const [leadMeetings, setLeadMeetings] = useState<any[]>([]);
    const [loadingMeetings, setLoadingMeetings] = useState(false);
    const [leadsWithMeetings, setLeadsWithMeetings] = useState<Set<string>>(
        new Set()
    );

    // Log para verificar mudanças no estado dbLeads
    useEffect(() => {
        console.log('🔄 Estado dbLeads atualizado:', dbLeads.length, 'leads');
        if (dbLeads.length > 0) {
            console.log(
                '📋 Primeiros 3 leads no estado:',
                dbLeads
                    .slice(0, 3)
                    .map((l) => ({ name: l.name, status: l.status }))
            );
        }
    }, [dbLeads]);

    // Carregar reuniões quando a página carregar
    useEffect(() => {
        fetchAllMeetings();
    }, []);
    const [loading, setLoading] = useState(false);

    // Estados do formulário
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        ocupation: '',
        potentialValue: '',
        observations: '',
        product: '',
    });

    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadingLead, setUploadingLead] = useState<any>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [leadStats, setLeadStats] = useState<LeadStat[]>([
        { label: 'Total de Leads', value: '0', change: '+0%', icon: Users },
        {
            label: 'Taxa de Conversão',
            value: '0%',
            change: '+0%',
            icon: TrendingUp,
        },
    ]);

    useEffect(() => {
        if (dbLeads.length >= 0) {
            setLeadStats((prev) => [
                {
                    ...prev[0],
                    value: dbLeads.length.toString(), // ✅ número real de leads
                },
                leadStats[1], // mantém a taxa de conversão (pode calcular depois)
            ]);
        }
    }, [dbLeads]);
    // Estados para upload de contatos
    const [showContactsUploadModal, setShowContactsUploadModal] =
        useState(false);
    const [contactsFile, setContactsFile] = useState<File | null>(null);
    const [contactsUploadLoading, setContactsUploadLoading] = useState(false);
    const [uploadResults, setUploadResults] = useState<any>(null);

    // Estados para Excel Import/Export
    const [showExcelModal, setShowExcelModal] = useState(false);
    const [excelFile, setExcelFile] = useState<File | null>(null);
    const [excelUploadLoading, setExcelUploadLoading] = useState(false);
    const [excelResults, setExcelResults] = useState<any>(null);

    // Estados para follow-up
    const [showFollowUpModal, setShowFollowUpModal] = useState(false);
    const [followUpData, setFollowUpData] = useState({
        observation: '',
        type: 'ligacao',
        date: new Date().toISOString().slice(0, 16),
        dateNextContact: '',
    });
    const [pendingStatusChange, setPendingStatusChange] = useState<{
        lead: any;
        targetStatus: string;
    } | null>(null);
    // Adicionar estados para histórico e próximo contato
    const [followUpHistory, setFollowUpHistory] = useState<any[]>([]);

    // Adicionar estado para histórico de follow-ups do lead selecionado
    const [leadDetailsFollowUpHistory, setLeadDetailsFollowUpHistory] =
        useState<any[]>([]);

    // [NOVOS ESTADOS PARA AÇÕES DOS BOTÕES]
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduleData, setScheduleData] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        type: 'reuniao' as 'reuniao' | 'ligacao' | 'apresentacao',
    });

    // [ESTADOS PARA DETALHES COMPLETOS]
    const [showFullDetailsModal, setShowFullDetailsModal] = useState(false);
    const [fullDetailsData, setFullDetailsData] = useState<any>(null);
    const [loadingFullDetails, setLoadingFullDetails] = useState(false);

    // [ESTADOS PARA EDIÇÃO]
    const [isEditingLead, setIsEditingLead] = useState(false);
    const [editingLead, setEditingLead] = useState<any>(null);
    const [savingLead, setSavingLead] = useState(false);

    const { data: session, status } = useSession();
    const user = session?.user;
    const isLoading = status === 'loading';

    // Log para verificar o estado do usuário
    useEffect(() => {
        console.log('👤 Estado do usuário:', { user, isLoading });
    }, [user, isLoading]);

    // [FUNÇÕES PARA AÇÕES DOS BOTÕES]
    const handlePhoneCall = (
        phone: string,
        clientName: string,
        leadId?: string
    ) => {
        if (phone) {
            // Remove caracteres especiais do telefone para o link tel:
            const cleanPhone = phone.replace(/[^\d+]/g, '');
            window.open(`tel:${cleanPhone}`, '_self');

            // Registrar a tentativa de ligação como follow-up automaticamente
            if (leadId) {
                fetch(`/api/leads/${leadId}/followups`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        observation: `Ligação realizada para ${clientName} - ${phone}`,
                        type: 'ligacao',
                        date: new Date().toISOString(),
                        dateNextContact: '',
                        userEmail: user?.email,
                    }),
                }).catch(console.error);
            }
        } else {
            alert('Número de telefone não disponível');
        }
    };

    const handleSendEmail = (
        email: string,
        clientName: string,
        leadId?: string
    ) => {
        if (email) {
            const subject = encodeURIComponent(
                `Contato sobre oportunidade de negócio`
            );
            const body = encodeURIComponent(
                `Olá ${clientName},\n\nEspero que esteja bem!\n\nEstou entrando em contato para conversarmos sobre uma oportunidade que pode ser do seu interesse.\n\nGostaria de agendar uma conversa para apresentar nossa proposta e esclarecer suas dúvidas.\n\nFico à disposição.\n\nAtenciosamente,\n${
                    user?.name || 'Equipe'
                }`
            );

            window.open(
                `mailto:${email}?subject=${subject}&body=${body}`,
                '_self'
            );

            // Registrar o envio de email como follow-up
            if (leadId) {
                fetch(`/api/leads/${leadId}/followups`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        observation: `E-mail enviado para ${clientName} - ${email}`,
                        type: 'email',
                        date: new Date().toISOString(),
                        dateNextContact: '',
                        userEmail: user?.email,
                    }),
                }).catch(console.error);
            }
        } else {
            alert('E-mail não disponível');
        }
    };

    const handleWhatsApp = (
        phone: string,
        clientName: string,
        leadId?: string
    ) => {
        if (phone) {
            // Remove caracteres especiais do telefone
            const cleanPhone = phone.replace(/[^\d]/g, '');
            const message = encodeURIComponent(
                `Olá ${clientName}! Tudo bem?\n\nEstou entrando em contato para conversarmos sobre uma oportunidade que pode ser do seu interesse.\n\nPodemos agendar uma conversa rápida para eu apresentar nossa proposta?\n\nAguardo seu retorno!`
            );

            window.open(
                `https://wa.me/${cleanPhone}?text=${message}`,
                '_blank'
            );

            // Registrar o envio de WhatsApp como follow-up
            if (leadId) {
                fetch(`/api/leads/${leadId}/followups`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        observation: `WhatsApp enviado para ${clientName} - ${phone}`,
                        type: 'whatsapp',
                        date: new Date().toISOString(),
                        dateNextContact: '',
                        userEmail: user?.email,
                    }),
                }).catch(console.error);
            }
        } else {
            alert('Número de telefone não disponível');
        }
    };

    const handleDeleteLead = async (leadId: string, leadName: string) => {
        if (
            !confirm(
                `Tem certeza que deseja mover o lead "${leadName}" para a lixeira?`
            )
        ) {
            return;
        }

        try {
            const response = await fetch(`/api/leads?id=${leadId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                // Remover o lead da lista local
                setDbLeads((prevLeads) =>
                    prevLeads.filter((lead) => lead.id !== leadId)
                );
                alert('Lead movido para a lixeira com sucesso!');
            } else {
                const error = await response.json();
                alert(error.error || 'Erro ao deletar lead');
            }
        } catch (error) {
            console.error('Erro ao deletar lead:', error);
            alert('Erro ao deletar lead');
        }
    };

    const handleScheduleMeetingOld = (lead: any) => {
        setScheduleData({
            title: `Reunião - ${lead.name}`,
            description: `Reunião com ${lead.name} sobre oportunidade de negócio`,
            date: '',
            time: '',
            type: 'reuniao',
        });
        setShowScheduleModal(true);
    };

    const handleSaveSchedule = async () => {
        if (!scheduleData.date || !scheduleData.time || !scheduleData.title) {
            alert('Preencha todos os campos obrigatórios');
            return;
        }

        try {
            const eventDateTime = new Date(
                `${scheduleData.date}T${scheduleData.time}`
            );

            // Criar evento no Google Calendar
            const response = await fetch('/api/google/create-event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: scheduleData.title,
                    description: scheduleData.description,
                    start: eventDateTime.toISOString(),
                    end: new Date(
                        eventDateTime.getTime() + 60 * 60 * 1000
                    ).toISOString(), // 1 hora de duração
                    attendees: selectedLead?.email ? [selectedLead.email] : [],
                    userEmail: user?.email,
                }),
            });

            if (response.ok) {
                const event = await response.json();

                // Registrar agendamento como follow-up
                if (selectedLead?.id) {
                    await fetch(`/api/leads/${selectedLead.id}/followups`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            observation: `${
                                scheduleData.type === 'reuniao'
                                    ? 'Reunião'
                                    : scheduleData.type === 'ligacao'
                                    ? 'Ligação'
                                    : 'Apresentação'
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

                alert('Evento criado com sucesso no Google Calendar!');
                setShowScheduleModal(false);
                setScheduleData({
                    title: '',
                    description: '',
                    date: '',
                    time: '',
                    type: 'reuniao',
                });
            } else {
                const error = await response.json();
                alert(
                    `Erro ao criar evento: ${
                        error.error || 'Erro desconhecido'
                    }`
                );
            }
        } catch (error) {
            console.error('Erro ao agendar:', error);
            alert('Erro ao criar agendamento. Tente novamente.');
        }
    };

    const checkGoogleConnection = async () => {
        setCheckingGoogle(true);
        try {
            const response = await fetch('/api/leads/check-google-connection');
            const data = await response.json();
            setGoogleConnected(data.isConnected);

            if (!data.isConnected) {
                alert(
                    'Você precisa conectar sua conta Google primeiro. Redirecionando para a página de agenda...'
                );
                window.open('/agenda', '_blank');
                setShowScheduleMeeting(false);
            }
        } catch (error) {
            console.error('Erro ao verificar conexão Google:', error);
            alert('Erro ao verificar conexão Google');
        } finally {
            setCheckingGoogle(false);
        }
    };

    const fetchLeadMeetings = async (leadId: string) => {
        setLoadingMeetings(true);
        try {
            const response = await fetch(
                `/api/leads/meetings?leadId=${leadId}`
            );
            const data = await response.json();

            if (response.ok) {
                setLeadMeetings(data.meetings || []);
            } else {
                console.error('Erro ao buscar reuniões:', data.error);
                setLeadMeetings([]);
            }
        } catch (error) {
            console.error('Erro ao buscar reuniões:', error);
            setLeadMeetings([]);
        } finally {
            setLoadingMeetings(false);
        }
    };

    const fetchAllMeetings = async () => {
        try {
            const response = await fetch('/api/leads/meetings');
            const data = await response.json();

            if (response.ok) {
                const meetings = data.meetings || [];
                const leadIdsWithMeetings = new Set(
                    meetings
                        .map((meeting: any) => meeting.leadId)
                        .filter(Boolean) as string[]
                );
                setLeadsWithMeetings(leadIdsWithMeetings);
            }
        } catch (error) {
            console.error('Erro ao buscar todas as reuniões:', error);
        }
    };

    const handleScheduleMeeting = async () => {
        if (!selectedLead) return;

        setLoading(true);
        try {
            const startDateTime = new Date(
                `${meetingForm.date}T${meetingForm.time}`
            );
            const endDateTime = new Date(
                startDateTime.getTime() + parseInt(meetingForm.duration) * 60000
            );

            const response = await fetch('/api/leads/schedule-meeting', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leadId: selectedLead.id,
                    title: meetingForm.title,
                    description: meetingForm.description,
                    startDateTime: startDateTime.toISOString(),
                    endDateTime: endDateTime.toISOString(),
                    duration: parseInt(meetingForm.duration),
                    attendees: meetingForm.attendees
                        .split(',')
                        .map((email) => email.trim())
                        .filter((email) => email),
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const meetLink = data.meeting.meetLink;
                const eventUrl = data.meeting.eventUrl;

                // Mostrar modal com informações da reunião
                const confirmMessage =
                    `Reunião agendada com sucesso!\n\n` +
                    `📅 Título: ${data.meeting.title}\n` +
                    `⏰ Data/Hora: ${new Date(
                        data.meeting.startTime
                    ).toLocaleString('pt-BR')}\n` +
                    `🔗 Link do Google Meet: ${meetLink}\n\n` +
                    `Deseja abrir o link do Google Meet agora?`;

                if (confirm(confirmMessage)) {
                    window.open(meetLink, '_blank');
                }

                // Opcional: abrir o evento no Google Calendar
                if (confirm('Deseja abrir o evento no Google Calendar?')) {
                    window.open(eventUrl, '_blank');
                }

                setShowScheduleMeeting(false);
                setMeetingForm({
                    title: '',
                    description: '',
                    date: '',
                    time: '',
                    duration: '60',
                    attendees: '',
                });

                // Recarregar reuniões do lead e todas as reuniões
                fetchLeadMeetings(selectedLead.id);
                fetchAllMeetings();
            } else {
                const error = await response.json();
                alert(`Erro ao agendar reunião: ${error.error}`);
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao agendar reunião');
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 bg-green-50';
        if (score >= 60) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    const getTagColor = (tag: string) => {
        const colors = {
            Quente: 'bg-red-100 text-red-800',
            Morno: 'bg-yellow-100 text-yellow-800',
            Frio: 'bg-blue-100 text-blue-800',
            Premium: 'bg-purple-100 text-purple-800',
            Auto: 'bg-green-100 text-green-800',
            Moto: 'bg-orange-100 text-orange-800',
            Imóvel: 'bg-indigo-100 text-indigo-800',
            Financiamento: 'bg-cyan-100 text-cyan-800',
            Múltiplos: 'bg-pink-100 text-pink-800',
            'Consórcio Auto': 'bg-emerald-100 text-emerald-800',
            'Consórcio Moto': 'bg-amber-100 text-amber-800',
        };
        return (
            colors[tag as keyof typeof colors] || 'bg-gray-100 text-gray-800'
        );
    };

    const handleDragStart = (e: React.DragEvent, lead: any) => {
        setDraggedItem(lead);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
        e.preventDefault();
        if (draggedItem && draggedItem.status !== targetStatus) {
            const isDbLead = dbLeads.some((lead) => lead.id === draggedItem.id);
            if (isDbLead) {
                // Se for para a fase 'proposta', abrir modal de upload de proposta
                if (targetStatus === 'proposta') {
                    setUploadingLead(draggedItem);
                    setShowUploadModal(true);
                    setDraggedItem(null);
                    return; // Não atualiza o status até o upload ser concluído
                }
                // Antes de atualizar, abrir modal de follow-up
                setPendingStatusChange({ lead: draggedItem, targetStatus });
                setShowFollowUpModal(true);
                setDraggedItem(null);
                return;
            } else {
                setLeads((prevLeads) =>
                    prevLeads.map((lead) =>
                        lead.id === draggedItem.id
                            ? { ...lead, status: targetStatus }
                            : lead
                    )
                );
            }
            console.log(`Movendo ${draggedItem.name} para ${targetStatus}`);
        }
        setDraggedItem(null);
    };

    // Função para criar proposta automaticamente quando lead é movido para fase "proposta"
    const createProposalForLead = async (lead: any) => {
        try {
            // Verificar se já existe uma proposta para este lead
            const response = await fetch('/api/proposals');
            if (response.ok) {
                const existingProposals = await response.json();
                const hasProposal = existingProposals.some(
                    (proposal: any) => proposal.leadId === lead.id
                );

                if (hasProposal) {
                    console.log(`Proposta já existe para o lead ${lead.name}`);
                    return;
                }
            }

            // Criar nova proposta
            const proposalData = {
                title: `${
                    lead.product === 'home_equity'
                        ? 'Home Equity'
                        : lead.product === 'consorcio'
                        ? 'Consórcio'
                        : 'Proposta'
                } - ${lead.name}`,
                client: lead.name,
                company: lead.ocupation || 'Não informado',
                value: lead.potentialValue || 'Não informado',
                stage: 'pendente_envio', // Primeira fase do pipeline de propostas
                priority: 'medium',
                description: `Proposta criada automaticamente para o lead ${lead.name}`,
                phone: lead.phone,
                email: lead.email,
                leadId: lead.id,
            };

            const createResponse = await fetch('/api/proposals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(proposalData),
            });

            if (createResponse.ok) {
                const newProposal = await createResponse.json();
                console.log(
                    `Proposta criada automaticamente para ${lead.name}:`,
                    newProposal
                );
                alert(`Proposta criada automaticamente para ${lead.name}!`);
            } else {
                const error = await createResponse.json();
                console.error('Erro ao criar proposta:', error);
            }
        } catch (error) {
            console.error('Erro ao criar proposta automaticamente:', error);
        }
    };

    // Função para salvar follow-up e atualizar status
    const handleSaveFollowUp = async () => {
        if (!pendingStatusChange) return;
        if (!followUpData.observation.trim()) {
            alert('Observação é obrigatória!');
            return;
        }
        setShowFollowUpModal(false);
        setLoading(true);
        try {
            await fetch('/api/leads', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: pendingStatusChange.lead.id,
                    status: pendingStatusChange.targetStatus,
                    followUp: {
                        observation: followUpData.observation,
                        type: followUpData.type,
                        date: followUpData.date,
                        dateNextContact: followUpData.dateNextContact,
                        userEmail: user?.email,
                    },
                }),
            });
            setDbLeads((prevDbLeads) =>
                prevDbLeads.map((lead) =>
                    lead.id === pendingStatusChange.lead.id
                        ? { ...lead, status: pendingStatusChange.targetStatus }
                        : lead
                )
            );
            setFollowUpData({
                observation: '',
                type: 'ligacao',
                date: new Date().toISOString().slice(0, 16),
                dateNextContact: '',
            });
            setPendingStatusChange(null);
        } catch (error) {
            alert('Erro ao salvar follow-up ou atualizar lead!');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
    };

    // Carregar leads do banco de dados
    const fetchLeads = async () => {
        console.log('🔍 fetchLeads chamada');
        console.log('👤 Dados do usuário:', user);

        if (!user?.email || !user?.role) {
            console.log('❌ Dados do usuário incompletos');
            return;
        }

        try {
            const url = `/api/leads?userEmail=${encodeURIComponent(
                user.email
            )}&userRole=${encodeURIComponent(user.role)}`;
            console.log('🔗 Chamando API:', url);

            const response = await fetch(url);
            console.log(
                '📡 Resposta da API:',
                response.status,
                response.statusText
            );

            if (response.ok) {
                const data = await response.json();
                console.log('📊 Dados recebidos:', data.length, 'leads');
                setDbLeads(data);
                console.log('✅ Leads atualizados no estado');
            } else {
                console.log('❌ Erro na resposta da API');
                const errorData = await response.json();
                console.log('📋 Detalhes do erro:', errorData);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar leads:', error);
        }
    };

    // Funções de edição
    const startEditingLead = () => {
        if (fullDetailsData?.lead) {
            setEditingLead({ ...fullDetailsData.lead });
            setIsEditingLead(true);
        }
    };

    const saveLeadChanges = async () => {
        if (!editingLead) return;

        setSavingLead(true);
        try {
            const response = await fetch('/api/leads/edit', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
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
                // Atualizar a lista de leads
                fetchLeads();
            } else {
                const error = await response.json();
                alert(error.error || 'Erro ao salvar lead');
            }
        } catch (error) {
            console.error('Erro ao salvar lead:', error);
            alert('Erro ao salvar lead');
        } finally {
            setSavingLead(false);
        }
    };

    const cancelEditingLead = () => {
        setIsEditingLead(false);
        setEditingLead(null);
    };

    // Salvar novo lead
    const handleSaveLead = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/leads', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    userEmail: user?.email, // Adiciona o e-mail do consultor logado
                }),
            });

            if (response.ok) {
                const newLead = await response.json();
                setDbLeads((prev) => [newLead, ...prev]);
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    ocupation: '',
                    potentialValue: '',
                    observations: '',
                    product: '',
                });
                setShowNewLead(false);
                alert('Lead criado com sucesso!');
            } else {
                const error = await response.json();
                alert(error.error || 'Erro ao criar lead');
            }
        } catch (error) {
            console.error('Erro ao salvar lead:', error);
            alert('Erro ao salvar lead');
        } finally {
            setLoading(false);
        }
    };

    // Função para selecionar arquivo
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const allowedTypes = ['.pdf', '.doc', '.docx'];
            const fileExtension = file.name
                .toLowerCase()
                .substring(file.name.lastIndexOf('.'));
            if (!allowedTypes.includes(fileExtension)) {
                alert(
                    'Tipo de arquivo não permitido. Apenas PDF, DOC e DOCX são aceitos.'
                );
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                alert('Arquivo muito grande. Tamanho máximo: 10MB');
                return;
            }
            setSelectedFile(file);
        }
    };

    // Função para upload e criação da proposta
    const handleUploadFile = async () => {
        if (!selectedFile || !uploadingLead) return;
        setUploadLoading(true);
        try {
            // Upload do arquivo
            const formData = new FormData();
            formData.append('file', selectedFile);
            const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            if (!uploadResponse.ok) {
                const error = await uploadResponse.json();
                throw new Error(error.error || 'Erro no upload');
            }
            const uploadResult = await uploadResponse.json();
            // Criar proposta vinculada ao lead
            const proposalData = {
                title: `${
                    uploadingLead.product === 'home_equity'
                        ? 'Home Equity'
                        : uploadingLead.product === 'consorcio'
                        ? 'Consórcio'
                        : 'Proposta'
                } - ${uploadingLead.name}`,
                client: uploadingLead.name,
                company: uploadingLead.ocupation || 'Não informado',
                value: uploadingLead.potentialValue || 'Não informado',
                stage: 'pendente_envio',
                priority: 'medium',
                description: `Proposta criada automaticamente para o lead ${uploadingLead.name}`,
                phone: uploadingLead.phone,
                email: uploadingLead.email,
                leadId: uploadingLead.id,
                arquivoUrl: uploadResult.fileUrl,
                userEmail: user?.email, // <-- ESSENCIAL
            };
            const createResponse = await fetch('/api/proposals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(proposalData),
            });
            if (!createResponse.ok) {
                const error = await createResponse.json();
                throw new Error(error.error || 'Erro ao criar proposta');
            }
            // Atualizar status do lead localmente
            setDbLeads((prevDbLeads) =>
                prevDbLeads.map((lead) =>
                    lead.id === uploadingLead.id
                        ? { ...lead, status: 'proposta' }
                        : lead
                )
            );
            setShowUploadModal(false);
            setUploadingLead(null);
            setSelectedFile(null);
            alert('Proposta criada e arquivo enviado com sucesso!');
        } catch (error) {
            console.error('Erro no upload:', error);
            alert(`Erro ao enviar arquivo: ${error}`);
        } finally {
            setUploadLoading(false);
        }
    };

    const handleCancelUpload = () => {
        setShowUploadModal(false);
        setUploadingLead(null);
        setSelectedFile(null);
    };

    // Funções para upload de contatos
    const handleContactsFileSelect = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (file) {
            const allowedTypes = [
                'text/csv',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ];
            const allowedExtensions = ['.csv', '.xls', '.xlsx'];
            const fileExtension = file.name
                .toLowerCase()
                .substring(file.name.lastIndexOf('.'));

            if (
                allowedTypes.includes(file.type) ||
                allowedExtensions.includes(fileExtension)
            ) {
                setContactsFile(file);
            } else {
                alert(
                    'Tipo de arquivo não permitido. Apenas CSV, XLS e XLSX são aceitos.'
                );
            }
        }
    };

    const handleUploadContacts = async () => {
        if (!contactsFile) return;

        setContactsUploadLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', contactsFile);
            if (user?.email) {
                formData.append('userEmail', user.email);
            }

            const response = await fetch('/api/leads/upload', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                setUploadResults(result);
                // Recarregar leads após upload bem-sucedido
                await fetchLeads();
            } else {
                alert(`Erro: ${result.error}`);
            }
        } catch (error) {
            console.error('Erro no upload:', error);
            alert('Erro ao fazer upload do arquivo');
        } finally {
            setContactsUploadLoading(false);
        }
    };

    const handleCancelContactsUpload = () => {
        setContactsFile(null);
        setShowContactsUploadModal(false);
        setUploadResults(null);
    };

    // Funções para Excel Import/Export
    const handleExportToExcel = () => {
        try {
            // Preparar dados para exportação
            const dataToExport = dbLeads.map((lead) => ({
                Nome: lead.name || '',
                Email: lead.email || '',
                Telefone: lead.phone || '',
                Descricao: lead.observations || '',
                Ocupacao: lead.ocupation || '',
                'Valor Potencial': lead.potentialValue || '',
                Produto: lead.product || '',
                Status: lead.status || 'novos_leads',
                'Data de Criação': lead.createdAt
                    ? new Date(lead.createdAt).toLocaleDateString('pt-BR')
                    : '',
            }));

            // Criar workbook
            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Leads');

            // Configurar largura das colunas
            const wscols = [
                { wch: 20 }, // Nome
                { wch: 25 }, // Email
                { wch: 18 }, // Telefone
                { wch: 30 }, // Descrição
                { wch: 15 }, // Ocupação
                { wch: 15 }, // Valor Potencial
                { wch: 12 }, // Produto
                { wch: 15 }, // Status
                { wch: 12 }, // Data de Criação
            ];
            ws['!cols'] = wscols;

            // Gerar arquivo
            const fileName = `leads_export_${
                new Date().toISOString().split('T')[0]
            }.xlsx`;
            XLSX.writeFile(wb, fileName);

            alert(
                `Planilha exportada com sucesso! ${dataToExport.length} leads exportados.`
            );
        } catch (error) {
            console.error('Erro ao exportar:', error);
            alert('Erro ao exportar planilha. Tente novamente.');
        }
    };

    const handleExcelFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const allowedTypes = [
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ];
            const allowedExtensions = ['.xls', '.xlsx'];
            const fileExtension = file.name
                .toLowerCase()
                .substring(file.name.lastIndexOf('.'));

            if (
                allowedTypes.includes(file.type) ||
                allowedExtensions.includes(fileExtension)
            ) {
                setExcelFile(file);
            } else {
                alert(
                    'Tipo de arquivo não permitido. Apenas XLS e XLSX são aceitos.'
                );
            }
        }
    };

    const handleImportFromExcel = async () => {
        if (!excelFile) return;

        setExcelUploadLoading(true);
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(
                        e.target?.result as ArrayBuffer
                    );
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);

                    const leadsToCreate = [];
                    const errors = [];

                    for (let i = 0; i < jsonData.length; i++) {
                        const row: any = jsonData[i];
                        const leadData: any = {};

                        // Mapear campos (flexível para diferentes nomes de colunas)
                        const nameFields = ['Nome', 'Name', 'nome', 'name'];
                        const emailFields = [
                            'Email',
                            'E-mail',
                            'email',
                            'e-mail',
                        ];
                        const phoneFields = [
                            'Telefone',
                            'Phone',
                            'telefone',
                            'phone',
                            'Celular',
                            'celular',
                        ];
                        const descriptionFields = [
                            'Descricao',
                            'Descrição',
                            'Description',
                            'description',
                            'Observações',
                            'observacoes',
                        ];

                        // Buscar nome
                        for (const field of nameFields) {
                            if (row[field]) {
                                leadData.name = String(row[field]).trim();
                                break;
                            }
                        }

                        // Buscar email
                        for (const field of emailFields) {
                            if (row[field]) {
                                leadData.email = String(row[field]).trim();
                                break;
                            }
                        }

                        // Buscar telefone
                        for (const field of phoneFields) {
                            if (row[field]) {
                                leadData.phone = String(row[field]).trim();
                                break;
                            }
                        }

                        // Buscar descrição
                        for (const field of descriptionFields) {
                            if (row[field]) {
                                leadData.observations = String(
                                    row[field]
                                ).trim();
                                break;
                            }
                        }

                        // Validação básica
                        if (
                            !leadData.name ||
                            !leadData.email ||
                            !leadData.phone
                        ) {
                            errors.push(
                                `Linha ${
                                    i + 2
                                }: Nome, Email e Telefone são obrigatórios`
                            );
                            continue;
                        }

                        // Validação de email
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(leadData.email)) {
                            errors.push(`Linha ${i + 2}: Email inválido`);
                            continue;
                        }

                        // Adicionar campos opcionais
                        leadData.ocupation =
                            row['Ocupacao'] || row['Ocupação'] || '';
                        leadData.potentialValue =
                            row['Valor Potencial'] ||
                            row['valor_potencial'] ||
                            '';
                        leadData.product =
                            row['Produto'] || row['produto'] || 'consorcio';
                        leadData.userEmail = user?.email;

                        leadsToCreate.push(leadData);
                    }

                    // Salvar leads válidos
                    const savedLeads: any[] = [];
                    for (const leadData of leadsToCreate) {
                        try {
                            const response = await fetch('/api/leads', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(leadData),
                            });

                            if (response.ok) {
                                const newLead = await response.json();
                                savedLeads.push(newLead);
                            } else {
                                const error = await response.json();
                                errors.push(
                                    `Erro ao salvar ${leadData.name}: ${error.error}`
                                );
                            }
                        } catch (error) {
                            errors.push(
                                `Erro ao salvar ${leadData.name}: ${error}`
                            );
                        }
                    }

                    // Atualizar lista de leads
                    if (savedLeads.length > 0) {
                        setDbLeads((prev) => [...savedLeads, ...prev]);
                    }

                    // Mostrar resultados
                    setExcelResults({
                        total: jsonData.length,
                        valid: leadsToCreate.length,
                        saved: savedLeads.length,
                        errors: errors,
                        savedLeads: savedLeads,
                    });
                } catch (error) {
                    console.error('Erro ao processar arquivo:', error);
                    alert(
                        'Erro ao processar arquivo Excel. Verifique o formato e tente novamente.'
                    );
                } finally {
                    setExcelUploadLoading(false);
                }
            };

            reader.readAsArrayBuffer(excelFile);
        } catch (error) {
            console.error('Erro ao importar:', error);
            alert('Erro ao importar arquivo. Tente novamente.');
            setExcelUploadLoading(false);
        }
    };

    const handleCancelExcelUpload = () => {
        setExcelFile(null);
        setShowExcelModal(false);
        setExcelResults(null);
    };

    // Carregar leads ao montar o componente
    useEffect(() => {
        console.log('🚀 useEffect executado - carregando leads');
        console.log('👤 Usuário atual:', user);
        fetchLeads();
    }, []);

    useEffect(() => {
        if (user?.email && user?.role) {
            fetchLeads();
        }
    }, [user]);

    // Buscar histórico de follow-ups ao abrir o modal
    useEffect(() => {
        if (showFollowUpModal && pendingStatusChange) {
            fetch(`/api/leads/${pendingStatusChange.lead.id}/followups`)
                .then((res) => res.json())
                .then((data) => setFollowUpHistory(data))
                .catch(() => setFollowUpHistory([]));
        }
    }, [showFollowUpModal, pendingStatusChange]);

    // Buscar histórico ao abrir detalhes do lead
    useEffect(() => {
        if (selectedLead) {
            fetch(`/api/leads/${selectedLead.id}/followups`)
                .then((res) => res.json())
                .then((data) =>
                    setLeadDetailsFollowUpHistory(
                        Array.isArray(data) ? data : []
                    )
                )
                .catch(() => setLeadDetailsFollowUpHistory([]));
        }
    }, [selectedLead]);

    const [searchTerm, setSearchTerm] = useState('');

    // Função de filtro inteligente
    function filtrarLeads(leadsArr: any[]) {
        if (!searchTerm.trim()) return leadsArr;
        const termo = searchTerm.toLowerCase();
        return leadsArr.filter(
            (lead) =>
                (lead.name && lead.name.toLowerCase().includes(termo)) ||
                (lead.ocupation &&
                    lead.ocupation.toLowerCase().includes(termo)) ||
                (lead.potentialValue &&
                    String(lead.potentialValue)
                        .replace(/\D/g, '')
                        .includes(termo.replace(/\D/g, ''))) ||
                (lead.value &&
                    String(lead.value)
                        .replace(/\D/g, '')
                        .includes(termo.replace(/\D/g, ''))) ||
                (lead.email && lead.email.toLowerCase().includes(termo)) ||
                (lead.phone &&
                    lead.phone
                        .replace(/\D/g, '')
                        .includes(termo.replace(/\D/g, ''))) ||
                (lead.company && lead.company.toLowerCase().includes(termo)) ||
                (lead.tags &&
                    lead.tags.some((tag: string) =>
                        tag.toLowerCase().includes(termo)
                    ))
        );
    }

    // [FUNÇÃO PARA BUSCAR DETALHES COMPLETOS DO LEAD]
    const handleViewFullDetails = async (lead: any) => {
        setLoadingFullDetails(true);
        setShowFullDetailsModal(true);

        try {
            let leadDetails = lead;
            let followups: any[] = [];

            // Buscar follow-ups do lead se tivermos o ID
            if (lead.id) {
                try {
                    const followupsResponse = await fetch(
                        `/api/leads/${lead.id}/followups`
                    );
                    if (followupsResponse.ok) {
                        followups = await followupsResponse.json();
                    }
                } catch (error) {
                    console.log('Não foi possível carregar follow-ups:', error);
                }
            }

            // Combinar os dados
            setFullDetailsData({
                lead: { ...leadDetails, followups },
                originalLead: lead,
            });
        } catch (error) {
            console.error('Erro ao buscar detalhes completos:', error);
            // Usar dados já disponíveis se houver erro
            setFullDetailsData({
                lead: lead,
                originalLead: lead,
            });
        } finally {
            setLoadingFullDetails(false);
        }
    };

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 bg-gray-50 min-h-screen">
            {/* Modal de Follow Up */}
            <Dialog
                open={showFollowUpModal}
                onOpenChange={setShowFollowUpModal}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Registrar Follow Up</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
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
                                    setFollowUpData({
                                        ...followUpData,
                                        type: v,
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ligacao">
                                        Ligação
                                    </SelectItem>
                                    <SelectItem value="whatsapp">
                                        WhatsApp
                                    </SelectItem>
                                    <SelectItem value="email">
                                        E-mail
                                    </SelectItem>
                                    <SelectItem value="reuniao">
                                        Reunião
                                    </SelectItem>
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
                                {followUpHistory.map((f, i) => (
                                    <div
                                        key={f.id || i}
                                        className="mb-2 pb-2 border-b last:border-b-0 last:mb-0 last:pb-0"
                                    >
                                        <div className="text-xs text-gray-600">
                                            {new Date(f.date).toLocaleString()}{' '}
                                            ({f.tipeOfContact})
                                        </div>
                                        <div className="text-sm">
                                            {f.observations}
                                        </div>
                                        {f.dateNextContact && (
                                            <div className="text-xs text-blue-600 mt-1">
                                                Próximo contato:{' '}
                                                {new Date(
                                                    f.dateNextContact
                                                ).toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex space-x-2 mt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowFollowUpModal(false);
                                    setPendingStatusChange(null);
                                }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSaveFollowUp}
                                disabled={loading}
                            >
                                Salvar e Mover
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal de Import/Export Excel */}
            <Dialog open={showExcelModal} onOpenChange={setShowExcelModal}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Importar Leads via Planilha Excel
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                        {/* Instruções */}
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-blue-900 mb-2">
                                Instruções:
                            </h4>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• Formatos aceitos: XLS, XLSX</li>
                                <li>
                                    • Colunas obrigatórias:{' '}
                                    <strong>Nome, Email, Telefone</strong>
                                </li>
                                <li>
                                    • Coluna opcional:{' '}
                                    <strong>Descricao</strong> (ou Descrição)
                                </li>
                                <li>
                                    • Outras colunas opcionais: Ocupacao, Valor
                                    Potencial, Produto
                                </li>
                                <li>
                                    • Telefone deve ter DDI (ex: +55 11
                                    99999-9999)
                                </li>
                                <li>• Tamanho máximo: 5MB</li>
                            </ul>
                            <div className="mt-3 pt-3 border-t border-blue-200">
                                <a
                                    href="/template-leads.xlsx"
                                    download
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                                >
                                    📥 Baixar template Excel de exemplo
                                </a>
                            </div>
                        </div>

                        {/* Upload do arquivo */}
                        {!excelResults && (
                            <div className="space-y-4">
                                <div>
                                    <Label>Selecionar arquivo Excel</Label>
                                    <Input
                                        type="file"
                                        accept=".xls,.xlsx"
                                        onChange={handleExcelFileSelect}
                                        className="mt-1"
                                    />
                                </div>
                                {excelFile && (
                                    <div className="bg-green-50 p-3 rounded-lg">
                                        <p className="text-sm text-green-800">
                                            Arquivo selecionado:{' '}
                                            <strong>{excelFile.name}</strong>
                                        </p>
                                    </div>
                                )}
                                <div className="flex space-x-2">
                                    <Button
                                        onClick={handleImportFromExcel}
                                        disabled={
                                            !excelFile || excelUploadLoading
                                        }
                                        className="flex-1"
                                    >
                                        {excelUploadLoading
                                            ? 'Processando...'
                                            : 'Importar Leads'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleCancelExcelUpload}
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Resultados do upload */}
                        {excelResults && (
                            <div className="space-y-4">
                                {/* Resumo */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-semibold mb-2">
                                        Resumo da Importação
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {excelResults.total}
                                            </div>
                                            <div className="text-gray-600">
                                                Total
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-600">
                                                {excelResults.valid}
                                            </div>
                                            <div className="text-gray-600">
                                                Válidos
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-purple-600">
                                                {excelResults.saved}
                                            </div>
                                            <div className="text-gray-600">
                                                Criados
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-red-600">
                                                {excelResults.errors.length}
                                            </div>
                                            <div className="text-gray-600">
                                                Erros
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Leads criados */}
                                {excelResults.savedLeads.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-2 text-green-700">
                                            ✅ Leads Criados (
                                            {excelResults.savedLeads.length})
                                        </h4>
                                        <div className="max-h-40 overflow-y-auto border rounded p-2 bg-green-50">
                                            {excelResults.savedLeads.map(
                                                (lead: any, index: number) => (
                                                    <div
                                                        key={index}
                                                        className="mb-2 pb-2 border-b last:border-b-0 last:mb-0 last:pb-0"
                                                    >
                                                        <div className="text-sm font-medium">
                                                            {lead.name}
                                                        </div>
                                                        <div className="text-xs text-gray-600">
                                                            {lead.email}
                                                        </div>
                                                        <div className="text-xs text-gray-600">
                                                            {lead.phone}
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Erros */}
                                {excelResults.errors.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-2 text-red-700">
                                            ❌ Erros (
                                            {excelResults.errors.length})
                                        </h4>
                                        <div className="max-h-40 overflow-y-auto border rounded p-2 bg-red-50">
                                            {excelResults.errors.map(
                                                (
                                                    error: string,
                                                    index: number
                                                ) => (
                                                    <div
                                                        key={index}
                                                        className="mb-1 text-sm text-red-600"
                                                    >
                                                        • {error}
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex space-x-2">
                                    <Button
                                        onClick={handleCancelExcelUpload}
                                        className="flex-1"
                                    >
                                        Fechar
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal de Upload de Contatos */}
            <Dialog
                open={showContactsUploadModal}
                onOpenChange={setShowContactsUploadModal}
            >
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Upload de Contatos via Planilha
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                        {/* Instruções */}
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-blue-900 mb-2">
                                Instruções:
                            </h4>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• Formatos aceitos: CSV, XLS, XLSX</li>
                                <li>• Colunas obrigatórias: Nome, Telefone</li>
                                <li>
                                    • Colunas opcionais: Empresa, Email, Link
                                </li>
                                <li>
                                    • Telefone deve ter DDI (ex: +55 11
                                    99999-9999)
                                </li>
                                <li>• Tamanho máximo: 5MB</li>
                            </ul>
                            <div className="mt-3 pt-3 border-t border-blue-200">
                                <a
                                    href="/template-contatos.csv"
                                    download
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                                >
                                    📥 Baixar template CSV de exemplo
                                </a>
                            </div>
                        </div>

                        {/* Upload do arquivo */}
                        {!uploadResults && (
                            <div className="space-y-4">
                                <div>
                                    <Label>Selecionar arquivo</Label>
                                    <Input
                                        type="file"
                                        accept=".csv,.xls,.xlsx"
                                        onChange={handleContactsFileSelect}
                                        className="mt-1"
                                    />
                                </div>
                                {contactsFile && (
                                    <div className="bg-green-50 p-3 rounded-lg">
                                        <p className="text-sm text-green-800">
                                            Arquivo selecionado:{' '}
                                            <strong>{contactsFile.name}</strong>
                                        </p>
                                    </div>
                                )}
                                <div className="flex space-x-2">
                                    <Button
                                        onClick={handleUploadContacts}
                                        disabled={
                                            !contactsFile ||
                                            contactsUploadLoading
                                        }
                                        className="flex-1"
                                    >
                                        {contactsUploadLoading
                                            ? 'Processando...'
                                            : 'Fazer Upload'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleCancelContactsUpload}
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Resultados do upload */}
                        {uploadResults && (
                            <div className="space-y-4">
                                {/* Resumo */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-semibold mb-2">
                                        Resumo do Upload
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {uploadResults.summary.total}
                                            </div>
                                            <div className="text-gray-600">
                                                Total
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-600">
                                                {uploadResults.summary.valid}
                                            </div>
                                            <div className="text-gray-600">
                                                Válidos
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-red-600">
                                                {uploadResults.summary.invalid}
                                            </div>
                                            <div className="text-gray-600">
                                                Inválidos
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-purple-600">
                                                {uploadResults.summary.saved}
                                            </div>
                                            <div className="text-gray-600">
                                                Salvos
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Contatos válidos */}
                                {uploadResults.validContacts.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-2 text-green-700">
                                            ✅ Contatos Válidos (
                                            {uploadResults.validContacts.length}
                                            )
                                        </h4>
                                        <div className="max-h-40 overflow-y-auto border rounded p-2 bg-green-50">
                                            {uploadResults.validContacts.map(
                                                (
                                                    contact: any,
                                                    index: number
                                                ) => (
                                                    <div
                                                        key={index}
                                                        className="mb-2 pb-2 border-b last:border-b-0 last:mb-0 last:pb-0"
                                                    >
                                                        <div className="text-sm font-medium">
                                                            {
                                                                contact.contact
                                                                    .nome
                                                            }
                                                        </div>
                                                        <div className="text-xs text-gray-600">
                                                            {
                                                                contact.contact
                                                                    .telefone
                                                            }
                                                        </div>
                                                        {contact.contact
                                                            .empresa && (
                                                            <div className="text-xs text-gray-600">
                                                                {
                                                                    contact
                                                                        .contact
                                                                        .empresa
                                                                }
                                                            </div>
                                                        )}
                                                        {contact.warnings
                                                            .length > 0 && (
                                                            <div className="text-xs text-yellow-600 mt-1">
                                                                ⚠️{' '}
                                                                {contact.warnings.join(
                                                                    ', '
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Contatos inválidos */}
                                {uploadResults.invalidContacts.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-2 text-red-700">
                                            ❌ Contatos com Erros (
                                            {
                                                uploadResults.invalidContacts
                                                    .length
                                            }
                                            )
                                        </h4>
                                        <div className="max-h-40 overflow-y-auto border rounded p-2 bg-red-50">
                                            {uploadResults.invalidContacts.map(
                                                (
                                                    contact: any,
                                                    index: number
                                                ) => (
                                                    <div
                                                        key={index}
                                                        className="mb-2 pb-2 border-b last:border-b-0 last:mb-0 last:pb-0"
                                                    >
                                                        <div className="text-sm font-medium">
                                                            {contact.contact
                                                                .nome ||
                                                                'Nome não informado'}
                                                        </div>
                                                        <div className="text-xs text-gray-600">
                                                            {contact.contact
                                                                .telefone ||
                                                                'Telefone não informado'}
                                                        </div>
                                                        {contact.contact
                                                            .empresa && (
                                                            <div className="text-xs text-gray-600">
                                                                {
                                                                    contact
                                                                        .contact
                                                                        .empresa
                                                                }
                                                            </div>
                                                        )}
                                                        <div className="text-xs text-red-600 mt-1">
                                                            ❌{' '}
                                                            {contact.errors.join(
                                                                ', '
                                                            )}
                                                        </div>
                                                        {contact.warnings
                                                            .length > 0 && (
                                                            <div className="text-xs text-yellow-600 mt-1">
                                                                ⚠️{' '}
                                                                {contact.warnings.join(
                                                                    ', '
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex space-x-2">
                                    <Button
                                        onClick={handleCancelContactsUpload}
                                        className="flex-1"
                                    >
                                        Fechar
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        Leads & Contatos
                    </h2>
                    <p className="text-muted-foreground">
                        Gerencie seus leads e acompanhe o funil de vendas
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar leads..."
                            className="pl-8 w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <Button
                        variant="outline"
                        onClick={handleExportToExcel}
                        title="Exportar leads para Excel"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Exportar Excel
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => setShowExcelModal(true)}
                        title="Importar leads do Excel"
                    >
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Importar Excel
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() =>
                            window.open('/dashboard/leads/trash', '_blank')
                        }
                        className="text-red-600 hover:text-red-700"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Lixeira
                    </Button>

                    <Button onClick={() => setShowNewLead(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Lead
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {leadStats.map((stat) => (
                    <Card key={stat.label}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.label}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stat.value}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Pipeline Kanban */}
            <div
                className="flex gap-4 overflow-x-auto pb-6"
                style={{ minHeight: 'calc(100vh - 300px)' }}
            >
                {pipelineColumns.map((column) => (
                    <div
                        key={column.id}
                        className="flex-shrink-0 w-72"
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
                                        <CardTitle className="text-sm font-semibold text-gray-800">
                                            {column.title}
                                        </CardTitle>
                                    </div>
                                    <Badge
                                        variant="secondary"
                                        className="bg-white text-gray-700 font-medium"
                                    >
                                        {leads.filter(
                                            (l) => l.status === column.id
                                        ).length +
                                            dbLeads.filter(
                                                (l) =>
                                                    (l.status ||
                                                        'novos_leads') ===
                                                    column.id
                                            ).length}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 p-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                                {/* Leads do banco de dados */}
                                {filtrarLeads(dbLeads)
                                    .filter(
                                        (lead) =>
                                            (lead.status || 'novos_leads') ===
                                            column.id
                                    )
                                    .map((lead) => (
                                        <div
                                            key={`db-${lead.id}`}
                                            draggable
                                            onDragStart={(e) =>
                                                handleDragStart(e, {
                                                    ...lead,
                                                    company: lead.ocupation,
                                                    source: 'Banco de Dados',
                                                    status:
                                                        lead.status ||
                                                        'novos_leads',
                                                    score: 75,
                                                    value:
                                                        lead.potentialValue ||
                                                        'Não informado',
                                                    lastContact: 'Recém criado',
                                                    tags: ['Novo'],
                                                    avatar: '/placeholder.svg?height=40&width=40',
                                                })
                                            }
                                            onDragEnd={handleDragEnd}
                                            className={`p-3 bg-white border rounded-lg shadow-sm hover:shadow-md transition-all cursor-move border-l-4 border-l-blue-500 ${
                                                draggedItem?.id === lead.id
                                                    ? 'opacity-50 rotate-2 scale-105'
                                                    : ''
                                            }`}
                                            onClick={() => {
                                                const leadData = {
                                                    ...lead,
                                                    company: lead.ocupation,
                                                    source: 'Banco de Dados',
                                                    status:
                                                        lead.status ||
                                                        'novos_leads',
                                                    score: 75,
                                                    value:
                                                        lead.potentialValue ||
                                                        'Não informado',
                                                    lastContact: 'Recém criado',
                                                    tags: ['Novo'],
                                                    avatar: '/placeholder.svg?height=40&width=40',
                                                };
                                                setSelectedLead(leadData);
                                                fetchLeadMeetings(lead.id);
                                            }}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                    <Avatar className="h-7 w-7">
                                                        <AvatarImage src="/placeholder.svg" />
                                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                                                            {lead.name
                                                                .split(' ')
                                                                .map(
                                                                    (
                                                                        n: string
                                                                    ) => n[0]
                                                                )
                                                                .join('')}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <h4 className="font-medium text-sm">
                                                            {lead.name}
                                                        </h4>
                                                        <p className="text-xs text-gray-500 truncate max-w-[100px]">
                                                            {lead.ocupation}
                                                        </p>
                                                        {user?.role ===
                                                            'gerente' &&
                                                            lead.creator && (
                                                                <p className="text-xs text-blue-600 font-medium">
                                                                    👤{' '}
                                                                    {
                                                                        lead
                                                                            .creator
                                                                            .name
                                                                    }
                                                                </p>
                                                            )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium text-blue-600 bg-blue-50">
                                                        <Star className="h-3 w-3 mr-0.5" />
                                                        75
                                                    </div>
                                                    {leadsWithMeetings.has(
                                                        lead.id
                                                    ) && (
                                                        <div className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium text-green-600 bg-green-50">
                                                            <Video className="h-3 w-3 mr-0.5" />
                                                            Reunião
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex flex-wrap gap-1">
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs bg-blue-100 text-blue-800 border-0 py-0 px-1.5"
                                                    >
                                                        Novo
                                                    </Badge>
                                                </div>
                                                <span className="text-xs font-medium text-green-600">
                                                    {lead.potentialValue ||
                                                        'Não informado'}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                                                <span className="text-xs text-gray-500">
                                                    Recém criado
                                                </span>
                                                <div className="flex space-x-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handlePhoneCall(
                                                                lead.phone,
                                                                lead.name,
                                                                lead.id
                                                            );
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
                                                            handleWhatsApp(
                                                                lead.phone,
                                                                lead.name,
                                                                lead.id
                                                            );
                                                        }}
                                                        title="WhatsApp"
                                                    >
                                                        <MessageCircle className="h-3 w-3 text-green-600" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewFullDetails(
                                                                {
                                                                    ...lead,
                                                                    company:
                                                                        lead.ocupation,
                                                                    source: 'Banco de Dados',
                                                                    status:
                                                                        lead.status ||
                                                                        'novos_leads',
                                                                    score: 75,
                                                                    value:
                                                                        lead.potentialValue ||
                                                                        'Não informado',
                                                                    lastContact:
                                                                        'Recém criado',
                                                                    tags: [
                                                                        'Novo',
                                                                    ],
                                                                    avatar: '/placeholder.svg?height=40&width=40',
                                                                }
                                                            );
                                                        }}
                                                        title="Ver Detalhes Completos"
                                                    >
                                                        <Eye className="h-3 w-3 text-gray-600" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteLead(
                                                                lead.id,
                                                                lead.name
                                                            );
                                                        }}
                                                        title="Mover para Lixeira"
                                                    >
                                                        <Trash2 className="h-3 w-3 text-red-600" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                {/* Leads estáticos existentes */}
                                {leads
                                    .filter((lead) => lead.status === column.id)
                                    .map((lead) => (
                                        <div
                                            key={lead.id}
                                            draggable
                                            onDragStart={(e) =>
                                                handleDragStart(e, lead)
                                            }
                                            onDragEnd={handleDragEnd}
                                            className={`p-3 bg-white border rounded-lg shadow-sm hover:shadow-md transition-all cursor-move ${
                                                lead.score >= 80
                                                    ? 'border-l-4 border-l-green-500'
                                                    : lead.score >= 60
                                                    ? 'border-l-4 border-l-yellow-500'
                                                    : 'border-l-4 border-l-red-500'
                                            } ${
                                                draggedItem?.id === lead.id
                                                    ? 'opacity-50 rotate-2 scale-105'
                                                    : ''
                                            }`}
                                            onClick={() => {
                                                setSelectedLead(lead);
                                                fetchLeadMeetings(lead.id);
                                            }}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                    <Avatar className="h-7 w-7">
                                                        <AvatarImage
                                                            src={
                                                                lead.avatar ||
                                                                '/placeholder.svg'
                                                            }
                                                        />
                                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                                                            {lead.name
                                                                .split(' ')
                                                                .map(
                                                                    (n: any) =>
                                                                        n[0]
                                                                )
                                                                .join('')}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <h4 className="font-medium text-sm">
                                                            {lead.name}
                                                        </h4>
                                                        <p className="text-xs text-gray-500 truncate max-w-[100px]">
                                                            {lead.company}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div
                                                        className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getScoreColor(
                                                            lead.score
                                                        )}`}
                                                    >
                                                        <Star className="h-3 w-3 mr-0.5" />
                                                        {lead.score}
                                                    </div>
                                                    {leadsWithMeetings.has(
                                                        lead.id
                                                    ) && (
                                                        <div className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium text-green-600 bg-green-50">
                                                            <Video className="h-3 w-3 mr-0.5" />
                                                            Reunião
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex flex-wrap gap-1">
                                                    {lead.tags
                                                        .slice(0, 1)
                                                        .map((tag: any) => (
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
                                                <span className="text-xs font-medium text-green-600">
                                                    {lead.value}
                                                </span>
                                            </div>

                                            {lead.simulations &&
                                                lead.simulations.length > 0 && (
                                                    <div className="mb-2 pt-2 border-t border-gray-100">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-xs font-medium text-blue-600">
                                                                📊 Simulações (
                                                                {
                                                                    lead
                                                                        .simulations
                                                                        .length
                                                                }
                                                                )
                                                            </span>
                                                        </div>
                                                        <div className="space-y-1">
                                                            {lead.simulations
                                                                .slice(0, 2)
                                                                .map(
                                                                    (
                                                                        simulation: any,
                                                                        index: number
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                simulation.id
                                                                            }
                                                                            className="text-xs bg-blue-50 p-1 rounded"
                                                                        >
                                                                            <div className="flex justify-between">
                                                                                <span className="text-blue-700">
                                                                                    R${' '}
                                                                                    {simulation.creditoUnitario?.toLocaleString(
                                                                                        'pt-BR'
                                                                                    ) ||
                                                                                        '0'}
                                                                                </span>
                                                                                <span className="text-gray-500">
                                                                                    {
                                                                                        simulation.opcaoParcela
                                                                                    }
                                                                                    %
                                                                                    -{' '}
                                                                                    {
                                                                                        simulation.prazoConsorcio
                                                                                    }{' '}
                                                                                    meses
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                )}
                                                            {lead.simulations
                                                                .length > 2 && (
                                                                <div className="text-xs text-gray-500 text-center">
                                                                    +
                                                                    {lead
                                                                        .simulations
                                                                        .length -
                                                                        2}{' '}
                                                                    mais
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                                                <span className="text-xs text-gray-500">
                                                    {lead.lastContact}
                                                </span>
                                                <div className="flex space-x-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handlePhoneCall(
                                                                lead.phone,
                                                                lead.name,
                                                                String(lead.id)
                                                            );
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
                                                            handleWhatsApp(
                                                                lead.phone,
                                                                lead.name,
                                                                String(lead.id)
                                                            );
                                                        }}
                                                        title="WhatsApp"
                                                    >
                                                        <MessageCircle className="h-3 w-3 text-green-600" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewFullDetails(
                                                                lead
                                                            );
                                                        }}
                                                        title="Ver Detalhes Completos"
                                                    >
                                                        <Eye className="h-3 w-3 text-gray-600" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                <Button
                                    variant="ghost"
                                    className="w-full border-2 border-dashed border-gray-300 h-10 text-gray-500 hover:border-gray-400 hover:bg-gray-50 rounded-lg text-sm"
                                    onClick={() => setShowNewLead(true)}
                                >
                                    <Plus className="mr-1 h-4 w-4" />
                                    Adicionar
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                ))}
            </div>

            {/* Modal de Detalhes do Lead */}
            {selectedLead && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Detalhes do Lead</CardTitle>
                                <Button
                                    variant="ghost"
                                    onClick={() => setSelectedLead(null)}
                                >
                                    ×
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center space-x-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage
                                        src={
                                            selectedLead.avatar ||
                                            '/placeholder.svg'
                                        }
                                    />
                                    <AvatarFallback>
                                        {selectedLead.name
                                            .split(' ')
                                            .map((n: string) => n[0])
                                            .join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-xl font-semibold">
                                        {selectedLead.name}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {selectedLead.company}
                                    </p>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <Badge
                                            className={getTagColor(
                                                selectedLead.tags[0]
                                            )}
                                        >
                                            {selectedLead.tags[0]}
                                        </Badge>
                                        <div
                                            className={`px-2 py-1 rounded-full text-xs ${getScoreColor(
                                                selectedLead.score
                                            )}`}
                                        >
                                            Score: {selectedLead.score}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">
                                        E-mail
                                    </label>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedLead.email}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">
                                        Telefone
                                    </label>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedLead.phone}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">
                                        Origem
                                    </label>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedLead.source}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">
                                        Valor Potencial
                                    </label>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedLead.value}
                                    </p>
                                </div>
                                {user?.role === 'gerente' &&
                                    selectedLead.creator && (
                                        <div>
                                            <label className="text-sm font-medium">
                                                Consultor Responsável
                                            </label>
                                            <p className="text-sm text-blue-600 font-medium">
                                                {selectedLead.creator.name}
                                            </p>
                                        </div>
                                    )}
                            </div>

                            <div>
                                <label className="text-sm font-medium">
                                    Tags
                                </label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {selectedLead.tags.map((tag: string) => (
                                        <Badge
                                            key={tag}
                                            variant="outline"
                                            className={getTagColor(tag)}
                                        >
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-blue-600" />
                                    Simulações (
                                    {(selectedLead as any)?.files?.length || 0})
                                </label>
                                {(selectedLead as any)?.files &&
                                (selectedLead as any).files.length > 0 ? (
                                    <div className="space-y-2 mt-2">
                                        {(selectedLead as any).files.map(
                                            (file: any) => (
                                                <div
                                                    key={file.id}
                                                    className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex justify-between items-center"
                                                >
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800">
                                                            {file.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(
                                                                file.createdAt
                                                            ).toLocaleDateString(
                                                                'pt-BR'
                                                            )}
                                                        </p>
                                                    </div>
                                                    <a
                                                        href={file.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 text-sm underline"
                                                    >
                                                        Abrir
                                                    </a>
                                                </div>
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm text-gray-500">
                                        Nenhum documento vinculado.
                                    </div>
                                )}
                            </div>

                            <div className="flex space-x-2">
                                <Button
                                    className="flex-1"
                                    onClick={() =>
                                        handlePhoneCall(
                                            selectedLead.phone,
                                            selectedLead.name,
                                            selectedLead.id
                                        )
                                    }
                                >
                                    <Phone className="mr-2 h-4 w-4" />
                                    Ligar
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() =>
                                        handleSendEmail(
                                            selectedLead.email,
                                            selectedLead.name,
                                            selectedLead.id
                                        )
                                    }
                                >
                                    <Mail className="mr-2 h-4 w-4" />
                                    E-mail
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() =>
                                        handleWhatsApp(
                                            selectedLead.phone,
                                            selectedLead.name,
                                            selectedLead.id
                                        )
                                    }
                                >
                                    <MessageCircle className="mr-2 h-4 w-4" />
                                    WhatsApp
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                        setShowScheduleMeeting(true);
                                        checkGoogleConnection();
                                    }}
                                    disabled={checkingGoogle}
                                >
                                    <Video className="mr-2 h-4 w-4" />
                                    {checkingGoogle
                                        ? 'Verificando...'
                                        : 'Reunião'}
                                </Button>
                            </div>

                            <div className="flex justify-center mt-4">
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        handleScheduleMeetingOld(selectedLead)
                                    }
                                    className="w-full"
                                >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Agendar Reunião
                                </Button>
                            </div>

                            {/* Seção de Reuniões Agendadas */}
                            <div className="mt-6">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                        <Video className="h-5 w-5 text-blue-600" />
                                        Reuniões Agendadas
                                    </h4>
                                    {loadingMeetings && (
                                        <div className="text-sm text-gray-500">
                                            Carregando...
                                        </div>
                                    )}
                                </div>

                                {leadMeetings.length > 0 ? (
                                    <div className="space-y-3">
                                        {leadMeetings.map((meeting) => (
                                            <div
                                                key={meeting.id}
                                                className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h5 className="font-medium text-blue-900">
                                                            {meeting.title}
                                                        </h5>
                                                        <p className="text-sm text-blue-700 mt-1">
                                                            {
                                                                meeting.description
                                                            }
                                                        </p>
                                                        <div className="flex items-center gap-4 mt-2 text-xs text-blue-600">
                                                            <span>
                                                                📅{' '}
                                                                {new Date(
                                                                    meeting.startDateTime
                                                                ).toLocaleDateString(
                                                                    'pt-BR'
                                                                )}
                                                            </span>
                                                            <span>
                                                                🕐{' '}
                                                                {new Date(
                                                                    meeting.startDateTime
                                                                ).toLocaleTimeString(
                                                                    'pt-BR',
                                                                    {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                    }
                                                                )}
                                                            </span>
                                                            <span>
                                                                ⏱️{' '}
                                                                {
                                                                    meeting.duration
                                                                }{' '}
                                                                min
                                                            </span>
                                                        </div>
                                                        {meeting.attendees && (
                                                            <div className="mt-2 text-xs text-blue-600">
                                                                👥
                                                                Participantes:{' '}
                                                                {
                                                                    meeting.attendees
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-2 ml-4">
                                                        {meeting.meetLink && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-xs"
                                                                onClick={() =>
                                                                    window.open(
                                                                        meeting.meetLink,
                                                                        '_blank'
                                                                    )
                                                                }
                                                            >
                                                                <Video className="h-3 w-3 mr-1" />
                                                                Entrar
                                                            </Button>
                                                        )}
                                                        <Badge
                                                            variant={
                                                                meeting.status ===
                                                                'confirmed'
                                                                    ? 'default'
                                                                    : 'secondary'
                                                            }
                                                            className="text-xs"
                                                        >
                                                            {meeting.status ===
                                                            'confirmed'
                                                                ? 'Confirmada'
                                                                : meeting.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-gray-500">
                                        <Video className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                        <p>Nenhuma reunião agendada</p>
                                        <p className="text-sm">
                                            Clique em "Reunião" para agendar uma
                                            nova reunião
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Histórico de Follow-ups */}
                            <div>
                                <label className="text-sm font-medium">
                                    Histórico de Follow-ups
                                </label>
                                <div className="max-h-40 overflow-y-auto border rounded p-2 bg-gray-50 mt-1">
                                    {Array.isArray(
                                        leadDetailsFollowUpHistory
                                    ) &&
                                        leadDetailsFollowUpHistory.length ===
                                            0 && (
                                            <div className="text-xs text-gray-400">
                                                Nenhum follow-up registrado.
                                            </div>
                                        )}
                                    {Array.isArray(
                                        leadDetailsFollowUpHistory
                                    ) &&
                                        leadDetailsFollowUpHistory.map(
                                            (f, i) => (
                                                <div
                                                    key={f.id || i}
                                                    className="mb-2 pb-2 border-b last:border-b-0 last:mb-0 last:pb-0"
                                                >
                                                    <div className="text-xs text-gray-600">
                                                        {new Date(
                                                            f.date
                                                        ).toLocaleString()}{' '}
                                                        ({f.tipeOfContact})
                                                    </div>
                                                    <div className="text-sm">
                                                        {f.observations}
                                                    </div>
                                                    {f.dateNextContact && (
                                                        <div className="text-xs text-blue-600 mt-1">
                                                            Próximo contato:{' '}
                                                            {new Date(
                                                                f.dateNextContact
                                                            ).toLocaleString()}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Modal Novo Lead */}
            {showNewLead && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Novo Lead</CardTitle>
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowNewLead(false)}
                                >
                                    ×
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <form onSubmit={handleSaveLead}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="lead-name">
                                            Nome Completo
                                        </Label>
                                        <Input
                                            id="lead-name"
                                            placeholder="Ex: João Silva"
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    name: e.target.value,
                                                })
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lead-ocupation">
                                            Profissão
                                        </Label>
                                        <Input
                                            id="lead-ocupation"
                                            placeholder="Ex: Advogado"
                                            value={formData.ocupation}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    ocupation: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="lead-email">
                                            E-mail
                                        </Label>
                                        <Input
                                            id="lead-email"
                                            type="email"
                                            placeholder="cliente@empresa.com"
                                            value={formData.email}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    email: e.target.value,
                                                })
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lead-phone">
                                            Telefone
                                        </Label>
                                        <Input
                                            id="lead-phone"
                                            placeholder="+55 11 99999-9999"
                                            value={formData.phone}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    phone: e.target.value,
                                                })
                                            }
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="lead-value">
                                        Valor Potencial
                                    </Label>
                                    <Input
                                        id="lead-value"
                                        placeholder="R$ 50.000,00"
                                        value={formData.potentialValue}
                                        onChange={(e) => {
                                            const formatted = formatarMoedaBR(
                                                e.target.value
                                            );
                                            setFormData({
                                                ...formData,
                                                potentialValue: formatted,
                                            });
                                        }}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="lead-product">
                                        Produto
                                    </Label>
                                    <Select
                                        value={formData.product}
                                        onValueChange={(value) =>
                                            setFormData({
                                                ...formData,
                                                product: value,
                                            })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o produto" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="home_equity">
                                                Home Equity
                                            </SelectItem>
                                            <SelectItem value="consorcio">
                                                Consórcio
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="lead-notes">
                                        Observações
                                    </Label>
                                    <Textarea
                                        id="lead-notes"
                                        placeholder="Informações adicionais sobre o lead..."
                                        rows={3}
                                        value={formData.observations}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                observations: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="flex space-x-2">
                                    <Button
                                        type="button"
                                        onClick={() => setShowNewLead(false)}
                                        variant="outline"
                                        disabled={loading}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={loading}>
                                        {loading
                                            ? 'Salvando...'
                                            : 'Adicionar Lead'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
            {showUploadModal && uploadingLead && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Enviar Proposta</CardTitle>
                                <Button
                                    variant="ghost"
                                    onClick={handleCancelUpload}
                                >
                                    ×
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center">
                                <p className="text-sm text-gray-600 mb-4">
                                    Para mover o lead "{uploadingLead.name}"
                                    para "Proposta", você precisa anexar o
                                    arquivo da proposta <b>ou</b> cadastrar uma
                                    proposta completa.
                                </p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Button
                                    className="w-full bg-blue-700 hover:bg-blue-800 text-white"
                                    onClick={() => {
                                        window.location.href = `/dashboard/propostas/nova?leadId=${uploadingLead.id}`;
                                    }}
                                >
                                    + Cadastrar Proposta Completa
                                </Button>
                            </div>
                            {/* <div className="space-y-2">
                <Label htmlFor="file-upload-lead">Arquivo da Proposta</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                  <input
                    id="file-upload-lead"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label htmlFor="file-upload-lead" className="cursor-pointer">
                    <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      {selectedFile
                        ? selectedFile.name
                        : "Clique para selecionar arquivo"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, DOC ou DOCX (máx. 10MB)
                    </p>
                  </label>
                </div>
              </div> */}
                            {selectedFile && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <p className="text-sm text-green-800">
                                        <strong>Arquivo selecionado:</strong>{' '}
                                        {selectedFile.name}
                                    </p>
                                    <p className="text-xs text-green-600">
                                        Tamanho:{' '}
                                        {(
                                            selectedFile.size /
                                            1024 /
                                            1024
                                        ).toFixed(2)}{' '}
                                        MB
                                    </p>
                                </div>
                            )}
                            <div className="flex space-x-2">
                                <Button
                                    onClick={handleCancelUpload}
                                    variant="outline"
                                    className="flex-1"
                                    disabled={uploadLoading}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleUploadFile}
                                    className="flex-1"
                                    disabled={!selectedFile || uploadLoading}
                                >
                                    {uploadLoading
                                        ? 'Enviando...'
                                        : 'Enviar Proposta'}
                                </Button>
                            </div>
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
                                            title: '',
                                            description: '',
                                            date: '',
                                            time: '',
                                            type: 'reuniao',
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
                                        setScheduleData({
                                            ...scheduleData,
                                            title: e.target.value,
                                        })
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
                                        setScheduleData({
                                            ...scheduleData,
                                            date: e.target.value,
                                        })
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
                                        setScheduleData({
                                            ...scheduleData,
                                            time: e.target.value,
                                        })
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
                                            title: '',
                                            description: '',
                                            date: '',
                                            time: '',
                                            type: 'reuniao',
                                        });
                                    }}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleSaveSchedule}
                                    disabled={loading}
                                >
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
                    <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Detalhes Completos - Lead</CardTitle>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={startEditingLead}
                                        disabled={isEditingLead}
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
                                            setIsEditingLead(false);
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
                                <div className="space-y-6">
                                    {/* Seção Principal do Lead */}
                                    <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-blue-800 flex items-center">
                                                👤 Informações do Lead
                                            </h3>
                                            {isEditingLead && (
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={
                                                            cancelEditingLead
                                                        }
                                                        className="text-gray-600"
                                                    >
                                                        Cancelar
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={
                                                            saveLeadChanges
                                                        }
                                                        disabled={savingLead}
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        {savingLead ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                                Salvando...
                                                            </>
                                                        ) : (
                                                            'Salvar'
                                                        )}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Header com Avatar e Info Principal */}
                                        <div className="flex items-center space-x-4 mb-6">
                                            <Avatar className="h-16 w-16">
                                                <AvatarImage
                                                    src={
                                                        fullDetailsData.lead
                                                            ?.avatar ||
                                                        '/placeholder.svg'
                                                    }
                                                />
                                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg">
                                                    {fullDetailsData.lead?.name
                                                        ?.split(' ')
                                                        .map(
                                                            (n: string) => n[0]
                                                        )
                                                        .join('')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h4 className="text-xl font-semibold text-gray-800">
                                                    {fullDetailsData.lead?.name}
                                                </h4>
                                                <p className="text-gray-600">
                                                    {fullDetailsData.lead
                                                        ?.company ||
                                                        fullDetailsData.lead
                                                            ?.ocupation}
                                                </p>
                                                <div className="flex items-center space-x-2 mt-2">
                                                    {fullDetailsData.lead
                                                        ?.tags && (
                                                        <Badge className="bg-blue-100 text-blue-800">
                                                            {Array.isArray(
                                                                fullDetailsData
                                                                    .lead.tags
                                                            )
                                                                ? fullDetailsData
                                                                      .lead
                                                                      .tags[0]
                                                                : fullDetailsData
                                                                      .lead
                                                                      .tags}
                                                        </Badge>
                                                    )}
                                                    {fullDetailsData.lead
                                                        ?.score && (
                                                        <div className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                                            Score:{' '}
                                                            {
                                                                fullDetailsData
                                                                    .lead.score
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Grid de Informações */}
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <label className="font-medium text-gray-700">
                                                    E-mail:
                                                </label>
                                                {isEditingLead ? (
                                                    <Input
                                                        type="email"
                                                        value={
                                                            editingLead?.email ||
                                                            ''
                                                        }
                                                        onChange={(e) =>
                                                            setEditingLead(
                                                                (
                                                                    prev: any
                                                                ) => ({
                                                                    ...prev,
                                                                    email: e
                                                                        .target
                                                                        .value,
                                                                })
                                                            )
                                                        }
                                                        className="mt-1"
                                                        placeholder="lead@email.com"
                                                    />
                                                ) : (
                                                    <p className="text-gray-600">
                                                        {fullDetailsData.lead
                                                            ?.email ||
                                                            'Não informado'}
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="font-medium text-gray-700">
                                                    Telefone:
                                                </label>
                                                {isEditingLead ? (
                                                    <Input
                                                        value={
                                                            editingLead?.phone ||
                                                            ''
                                                        }
                                                        onChange={(e) =>
                                                            setEditingLead(
                                                                (
                                                                    prev: any
                                                                ) => ({
                                                                    ...prev,
                                                                    phone: e
                                                                        .target
                                                                        .value,
                                                                })
                                                            )
                                                        }
                                                        className="mt-1"
                                                        placeholder="(11) 99999-9999"
                                                    />
                                                ) : (
                                                    <p className="text-gray-600">
                                                        {fullDetailsData.lead
                                                            ?.phone ||
                                                            'Não informado'}
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="font-medium text-gray-700">
                                                    Ocupação:
                                                </label>
                                                {isEditingLead ? (
                                                    <Input
                                                        value={
                                                            editingLead?.ocupation ||
                                                            ''
                                                        }
                                                        onChange={(e) =>
                                                            setEditingLead(
                                                                (
                                                                    prev: any
                                                                ) => ({
                                                                    ...prev,
                                                                    ocupation:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            )
                                                        }
                                                        className="mt-1"
                                                        placeholder="Profissão do lead"
                                                    />
                                                ) : (
                                                    <p className="text-gray-600">
                                                        {fullDetailsData.lead
                                                            ?.ocupation ||
                                                            'Não informado'}
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="font-medium text-gray-700">
                                                    Valor Potencial:
                                                </label>
                                                {isEditingLead ? (
                                                    <Input
                                                        value={
                                                            editingLead?.potentialValue ||
                                                            ''
                                                        }
                                                        onChange={(e) =>
                                                            setEditingLead(
                                                                (
                                                                    prev: any
                                                                ) => ({
                                                                    ...prev,
                                                                    potentialValue:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            )
                                                        }
                                                        className="mt-1"
                                                        placeholder="R$ 0,00"
                                                    />
                                                ) : (
                                                    <p className="text-gray-600 font-semibold text-green-600">
                                                        {fullDetailsData.lead
                                                            ?.potentialValue ||
                                                            fullDetailsData.lead
                                                                ?.value ||
                                                            'Não informado'}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="font-medium text-gray-700">
                                                    Produto:
                                                </label>
                                                {isEditingLead ? (
                                                    <Select
                                                        value={
                                                            editingLead?.product ||
                                                            ''
                                                        }
                                                        onValueChange={(
                                                            value
                                                        ) =>
                                                            setEditingLead(
                                                                (
                                                                    prev: any
                                                                ) => ({
                                                                    ...prev,
                                                                    product:
                                                                        value,
                                                                })
                                                            )
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
                                                            <SelectItem value="outros">
                                                                Outros
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <p className="text-gray-600">
                                                        {fullDetailsData.lead
                                                            ?.product ||
                                                            'Não especificado'}
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="font-medium text-gray-700">
                                                    Origem:
                                                </label>
                                                <p className="text-gray-600">
                                                    {fullDetailsData.lead
                                                        ?.source ||
                                                        'Não informado'}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="font-medium text-gray-700">
                                                    Último Contato:
                                                </label>
                                                <p className="text-gray-600">
                                                    {fullDetailsData.lead
                                                        ?.lastContact ||
                                                        'Não informado'}
                                                </p>
                                            </div>
                                            {fullDetailsData.lead
                                                ?.createdAt && (
                                                <div>
                                                    <label className="font-medium text-gray-700">
                                                        Criado em:
                                                    </label>
                                                    <p className="text-gray-600">
                                                        {new Date(
                                                            fullDetailsData.lead.createdAt
                                                        ).toLocaleString(
                                                            'pt-BR'
                                                        )}
                                                    </p>
                                                </div>
                                            )}
                                            {fullDetailsData.lead
                                                ?.updatedAt && (
                                                <div>
                                                    <label className="font-medium text-gray-700">
                                                        Atualizado em:
                                                    </label>
                                                    <p className="text-gray-600">
                                                        {new Date(
                                                            fullDetailsData.lead.updatedAt
                                                        ).toLocaleString(
                                                            'pt-BR'
                                                        )}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Observações */}
                                        <div className="mt-4 pt-4 border-t border-blue-200">
                                            <label className="font-medium text-gray-700">
                                                Observações:
                                            </label>
                                            {isEditingLead ? (
                                                <Textarea
                                                    value={
                                                        editingLead?.observations ||
                                                        ''
                                                    }
                                                    onChange={(e) =>
                                                        setEditingLead(
                                                            (prev: any) => ({
                                                                ...prev,
                                                                observations:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        )
                                                    }
                                                    className="mt-1"
                                                    rows={3}
                                                    placeholder="Observações sobre o lead..."
                                                />
                                            ) : (
                                                <p className="text-gray-600 mt-1">
                                                    {fullDetailsData.lead
                                                        ?.observations ||
                                                        'Sem observações'}
                                                </p>
                                            )}
                                        </div>

                                        {/* Informações do Criador */}
                                        {fullDetailsData.lead?.creator && (
                                            <div className="mt-4 pt-4 border-t border-blue-200">
                                                <label className="font-medium text-gray-700">
                                                    Consultor Responsável:
                                                </label>
                                                <p className="text-blue-600 font-medium">
                                                    {
                                                        fullDetailsData.lead
                                                            .creator.name
                                                    }
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Seção de Follow-ups */}
                                    {fullDetailsData.lead?.followups &&
                                        fullDetailsData.lead.followups.length >
                                            0 && (
                                            <div className="border border-orange-200 rounded-lg p-6 bg-orange-50">
                                                <h4 className="text-lg font-semibold text-orange-800 mb-4 flex items-center">
                                                    📞 Histórico de Follow-ups (
                                                    {
                                                        fullDetailsData.lead
                                                            .followups.length
                                                    }
                                                    )
                                                </h4>
                                                <div className="max-h-64 overflow-y-auto space-y-3">
                                                    {fullDetailsData.lead.followups
                                                        .sort(
                                                            (a: any, b: any) =>
                                                                new Date(
                                                                    b.date
                                                                ).getTime() -
                                                                new Date(
                                                                    a.date
                                                                ).getTime()
                                                        )
                                                        .map(
                                                            (
                                                                followup: any,
                                                                index: number
                                                            ) => (
                                                                <div
                                                                    key={
                                                                        followup.id ||
                                                                        index
                                                                    }
                                                                    className="bg-white p-4 rounded-lg border border-orange-200"
                                                                >
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <span className="text-xs text-orange-600 font-medium uppercase bg-orange-100 px-2 py-1 rounded">
                                                                            {followup.tipeOfContact ||
                                                                                followup.type ||
                                                                                'Contato'}
                                                                        </span>
                                                                        <span className="text-xs text-gray-500">
                                                                            {new Date(
                                                                                followup.date
                                                                            ).toLocaleString(
                                                                                'pt-BR'
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-sm text-gray-700 mb-2">
                                                                        {followup.observations ||
                                                                            followup.observation}
                                                                    </p>
                                                                    {followup.dateNextContact && (
                                                                        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                                            <strong>
                                                                                Próximo
                                                                                contato:
                                                                            </strong>{' '}
                                                                            {new Date(
                                                                                followup.dateNextContact
                                                                            ).toLocaleString(
                                                                                'pt-BR'
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )
                                                        )}
                                                </div>
                                            </div>
                                        )}

                                    {/* Ações Rápidas */}
                                    <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                                        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                            ⚡ Ações Rápidas
                                        </h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <Button
                                                className="flex-1"
                                                onClick={() => {
                                                    handlePhoneCall(
                                                        fullDetailsData.lead
                                                            ?.phone,
                                                        fullDetailsData.lead
                                                            ?.name,
                                                        fullDetailsData.lead?.id
                                                    );
                                                    setShowFullDetailsModal(
                                                        false
                                                    );
                                                }}
                                            >
                                                <Phone className="mr-2 h-4 w-4" />
                                                Ligar
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => {
                                                    handleSendEmail(
                                                        fullDetailsData.lead
                                                            ?.email,
                                                        fullDetailsData.lead
                                                            ?.name,
                                                        fullDetailsData.lead?.id
                                                    );
                                                    setShowFullDetailsModal(
                                                        false
                                                    );
                                                }}
                                            >
                                                <Mail className="mr-2 h-4 w-4" />
                                                E-mail
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => {
                                                    handleWhatsApp(
                                                        fullDetailsData.lead
                                                            ?.phone,
                                                        fullDetailsData.lead
                                                            ?.name,
                                                        fullDetailsData.lead?.id
                                                    );
                                                    setShowFullDetailsModal(
                                                        false
                                                    );
                                                }}
                                            >
                                                <MessageCircle className="mr-2 h-4 w-4" />
                                                WhatsApp
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => {
                                                    setShowFullDetailsModal(
                                                        false
                                                    );
                                                    handleScheduleMeetingOld(
                                                        fullDetailsData.lead
                                                    );
                                                }}
                                            >
                                                <Calendar className="mr-2 h-4 w-4" />
                                                Agendar
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">
                                        Nenhum dado disponível
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Modal de Agendamento de Reunião */}
            {showScheduleMeeting && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Agendar Reunião</CardTitle>
                                <Button
                                    variant="ghost"
                                    onClick={() =>
                                        setShowScheduleMeeting(false)
                                    }
                                >
                                    ×
                                </Button>
                            </div>
                            {!googleConnected && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
                                    <div className="flex items-center">
                                        <div className="text-yellow-600 mr-2">
                                            ⚠️
                                        </div>
                                        <div className="text-sm text-yellow-800">
                                            <strong>
                                                Google não conectado:
                                            </strong>{' '}
                                            Você precisa conectar sua conta
                                            Google primeiro.
                                            <a
                                                href="/agenda"
                                                target="_blank"
                                                className="text-blue-600 underline ml-1"
                                            >
                                                Conectar agora
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="meeting-title">
                                    Título da Reunião
                                </Label>
                                <Input
                                    id="meeting-title"
                                    placeholder="Ex: Reunião de apresentação"
                                    value={meetingForm.title}
                                    onChange={(e) =>
                                        setMeetingForm({
                                            ...meetingForm,
                                            title: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div>
                                <Label htmlFor="meeting-description">
                                    Descrição
                                </Label>
                                <Textarea
                                    id="meeting-description"
                                    placeholder="Descrição da reunião..."
                                    value={meetingForm.description}
                                    onChange={(e) =>
                                        setMeetingForm({
                                            ...meetingForm,
                                            description: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="meeting-date">Data</Label>
                                    <Input
                                        id="meeting-date"
                                        type="date"
                                        value={meetingForm.date}
                                        onChange={(e) =>
                                            setMeetingForm({
                                                ...meetingForm,
                                                date: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="meeting-time">
                                        Horário
                                    </Label>
                                    <Input
                                        id="meeting-time"
                                        type="time"
                                        value={meetingForm.time}
                                        onChange={(e) =>
                                            setMeetingForm({
                                                ...meetingForm,
                                                time: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="meeting-duration">
                                    Duração (minutos)
                                </Label>
                                <Select
                                    value={meetingForm.duration}
                                    onValueChange={(value) =>
                                        setMeetingForm({
                                            ...meetingForm,
                                            duration: value,
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="30">
                                            30 minutos
                                        </SelectItem>
                                        <SelectItem value="60">
                                            1 hora
                                        </SelectItem>
                                        <SelectItem value="90">
                                            1h 30min
                                        </SelectItem>
                                        <SelectItem value="120">
                                            2 horas
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="meeting-attendees">
                                    Participantes (emails separados por vírgula)
                                </Label>
                                <Input
                                    id="meeting-attendees"
                                    placeholder="email1@exemplo.com, email2@exemplo.com"
                                    value={meetingForm.attendees}
                                    onChange={(e) =>
                                        setMeetingForm({
                                            ...meetingForm,
                                            attendees: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() =>
                                        setShowScheduleMeeting(false)
                                    }
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={handleScheduleMeeting}
                                    disabled={
                                        loading ||
                                        !meetingForm.title ||
                                        !meetingForm.date ||
                                        !meetingForm.time ||
                                        !googleConnected
                                    }
                                >
                                    {loading
                                        ? 'Agendando...'
                                        : !googleConnected
                                        ? 'Conecte o Google'
                                        : 'Agendar Reunião'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
