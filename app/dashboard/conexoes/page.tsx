"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { createLocalScheduleDateTime, toISOString } from "@/lib/dateUtils";
import {
  CheckCircle,
  Mail,
  MessageCircle,
  Plus,
  QrCode,
  RefreshCw,
  Send,
  Settings,
  Smartphone,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface QrCodeData {
  base64Image: string;
  urlCode?: string;
  asciiQR?: string;
  attempts?: number;
  expiresAt?: number;
}

interface WhatsAppSession {
  id: string;
  sessionName: string;
  isActive: boolean;
  connectionStatus: string;
  qrCode?: string;
  lastConnected?: string;
  createdAt: string;
  updatedAt: string;
}

interface TemplateMessage {
  id: string;
  text: string;
  audioUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  documentUrl?: string;
  createdAt: string;
  updatedAt: string;
  templateId: string;
}

interface Template {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  messages: TemplateMessage[];
  campaings: any[];
}

interface Campaign {
  id: string;
  name: string;
  delay: number;
  createdAt: string;
  updatedAt: string;
  templates: {
    template: Template;
  }[];
}

const connections: any = [];

export default function ConexoesPage() {
  const [selectedSegment, setSelectedSegment] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [campaignType, setCampaignType] = useState("whatsapp");
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<QrCodeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [whatsappSessions, setWhatsappSessions] = useState<WhatsAppSession[]>(
    []
  );
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [isRecording, setIsRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState<BlobPart[]>([]);
  const [isSegmentContactsModalOpen, setIsSegmentContactsModalOpen] =
    useState(false);
  const [selectedSegmentContacts, setSelectedSegmentContacts] = useState<any[]>(
    []
  );
  const [selectedSegmentName, setSelectedSegmentName] = useState("");

  const loadSegmentContacts = async (
    segmentId: string,
    segmentName: string
  ) => {
    try {
      const res = await fetch(`/api/segments/${segmentId}/contacts`);
      const data = await res.json();
      if (data.status) {
        setSelectedSegmentContacts(data.contacts);
        setSelectedSegmentName(segmentName);
        setIsSegmentContactsModalOpen(true);
      } else {
        alert("Erro ao carregar contatos: " + data.error);
      }
    } catch (error) {
      console.error("Erro ao carregar contatos:", error);
    }
  };

  const [customDelay, setCustomDelay] = useState(5);
  const [customContactDelay, setCustomContactDelay] = useState(30);
  const [currentSession, setCurrentSession] = useState<WhatsAppSession | null>(
    null
  );

  const [segments, setSegments] = useState<any[]>([]);
  const [newSegmentName, setNewSegmentName] = useState("");
  const [newSegmentDescription, setNewSegmentDescription] = useState("");

  const loadSegments = async () => {
    const res = await fetch("/api/segments");
    const data = await res.json();
    if (data.status) setSegments(data.segments);
  };

  const createSegment = async () => {
    if (!newSegmentName.trim()) return alert("Informe um nome");
    const res = await fetch("/api/segments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newSegmentName,
        description: newSegmentDescription,
      }),
    });
    const data = await res.json();
    if (data.status) {
      setNewSegmentName("");
      setNewSegmentDescription("");
      await loadSegments();
      toast.success("Segmento criado com sucesso");
    }
  };

  useEffect(() => {
    loadSegments();
  }, []);

  const [isNewConnectionModalOpen, setIsNewConnectionModalOpen] =
    useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedSessionName, setSelectedSessionName] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isNewTemplateModalOpen, setIsNewTemplateModalOpen] = useState(false);
  const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newCampaignName, setNewCampaignName] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [newCampaignDelay, setNewCampaignDelay] = useState(30000);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [isTemplateMessagesModalOpen, setIsTemplateMessagesModalOpen] =
    useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );

  const [templateMessages, setTemplateMessages] = useState<TemplateMessage[]>(
    []
  );
  const [newMessageText, setNewMessageText] = useState("");
  const [isAddingMessage, setIsAddingMessage] = useState(false);
  const [showVariablesDropdown, setShowVariablesDropdown] = useState(false);

  const availableVariables = [
    { key: "{{nome}}", label: "Nome", description: "Nome do contato" },
    {
      key: "{{telefone}}",
      label: "Telefone",
      description: "Número de telefone",
    },
    { key: "{{email}}", label: "Email", description: "Endereço de email" },
    {
      key: "{{empresa}}",
      label: "Empresa",
      description: "Nome da empresa",
    },
  ];

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById(
      "new-message"
    ) as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = newMessageText;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      const newText = before + variable + after;
      setNewMessageText(newText);
      setShowVariablesDropdown(false);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + variable.length,
          start + variable.length
        );
      }, 0);
    }
  };

  const renderTextWithVariables = (text: string) => {
    if (!text) return text;
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const parts = text.split(variableRegex);

    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <span
            key={index}
            className="inline-flex items-center px-2 py-1 mx-1 text-xs font-medium text-sky-700 bg-sky-50 rounded-md border border-sky-100"
          >
            {`{{${part}}}`}
          </span>
        );
      }
      return part;
    });
  };

  const WHATSAPP_EXTERNAL_API = "https://wpp.melissaia.com.br";

  const loadWhatsAppSessions = async () => {
    try {
      const response = await fetch("/api/whatsapp/sessions");
      const data = await response.json();

      if (data.status) {
        setWhatsappSessions(data.sessions);
      }
    } catch (error) {
      console.error("Erro ao carregar sessões:", error);
    }
  };

  const createOrGetSession = async (sessionName: string) => {
    try {
      const response = await fetch("/api/whatsapp/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionName }),
      });

      const data = await response.json();
      if (data.status) {
        setCurrentSession(data.session);
        return data.session;
      }
    } catch (error) {
      console.error("Erro ao criar/buscar sessão:", error);
    }
    return null;
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [segmentFiles, setSegmentFiles] = useState<{
    [key: string]: File | null;
  }>({});

  const handleImportExcel = async (segmentId: string, file?: File | null) => {
    if (!file) {
      alert("Selecione um arquivo Excel");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/segments/${segmentId}/import`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.status) {
      alert(`Importados ${data.imported} contatos`);
      await loadSegments();
    } else {
      alert("Erro: " + data.error);
    }
  };

  const updateSessionStatus = async (
    sessionName: string,
    connectionStatus: string,
    qrCode?: string,
    numberInfo?: any
  ) => {
    try {
      const response = await fetch("/api/whatsapp/sessions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionName,
          connectionStatus,
          qrCode,
          numberInfo,
        }),
      });

      const data = await response.json();

      if (data.status) {
        setCurrentSession(data.session);
        await loadWhatsAppSessions();
      }
    } catch (error) {
      console.error("Erro ao atualizar sessão:", error);
    }
  };

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const documentInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (
    file: File,
    type: "image" | "video" | "audio" | "document",
    ref: React.RefObject<HTMLInputElement | null>
  ) => {
    if (!selectedTemplate) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const res = await fetch(`/api/templates/${selectedTemplate.id}/messages`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (data.status) {
      await loadTemplateMessages(selectedTemplate.id);
      toast.success("Arquivo enviado com sucesso");
      if (ref.current) ref.current.value = "";
    } else {
      toast.error(data?.error || "Erro ao enviar arquivo");
    }
  };

  const createSession = async (sessionName: string) => {
    setIsLoading(true);
    try {
      const dbSession = await createOrGetSession(sessionName);
      if (!dbSession) {
        console.error("Erro ao criar sessão no banco");
        return null;
      }

      setSessionId(sessionName);
      setCurrentSession(dbSession);

      await updateSessionStatus(sessionName, "CREATING");

      const response = await fetch(
        `${WHATSAPP_EXTERNAL_API}/${sessionName}/createsession`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await response.json();

      if (data.status) {
        await checkSessionStatusOnCreate(sessionName);
      } else {
        console.error("Erro ao criar sessão:", data.message);
        await updateSessionStatus(sessionName, "ERROR");
      }

      return dbSession;
    } catch (error) {
      console.error("Erro ao criar sessão:", error);
      await updateSessionStatus(sessionName, "ERROR");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const checkSessionStatus = async () => {
    try {
      const url = `${WHATSAPP_EXTERNAL_API}/${sessionId}/status`;
      const response = await fetch(url);
      const text = await response.text();

      let data: any;
      try {
        data = JSON.parse(text);
      } catch (err) {
        throw new Error(`Resposta não é JSON: ${text.slice(0, 200)}`);
      }
      if (data.message === "Sessão não encontrada") {
        setConnectionStatus("DISCONNECTED");
        await updateSessionStatus(sessionId, "DISCONNECTED");
      }
      if (data.status) {
        setConnectionStatus(data.connectionState);

        if (data.connectionState !== "CONNECTED") {
          await updateSessionStatus(sessionId, data.connectionState, undefined);
        }

        if (data.connectionState === "QR_CODE") {
          await getQrCode(sessionId);
        } else if (data.connectionState === "CONNECTED") {
          await updateSessionStatus(
            sessionId,
            data.connectionState,
            undefined,
            data.numberInfo || null
          );
        } else if (data.connectionState === "CREATING") {
          setTimeout(() => checkSessionStatusOnCreate(sessionId), 2000);
        }
      }
    } catch (error) {
      console.error("Erro ao verificar status da sessão:", error);
      setConnectionStatus("DISCONNECTED");
      await updateSessionStatus(sessionId, "DISCONNECTED");
    }
  };

  const checkSessionStatusOnCreate = async (sessionName: string) => {
    try {
      const url = `${WHATSAPP_EXTERNAL_API}/${sessionName}/status`;
      const response = await fetch(url);
      const text = await response.text();

      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Resposta não é JSON: ${text.slice(0, 200)}`);
      }

      if (data.message === "Sessão não encontrada") {
        setConnectionStatus("DISCONNECTED");
        await updateSessionStatus(sessionName, "DISCONNECTED");
        return;
      }

      if (data.status) {
        setConnectionStatus(data.connectionState);

        if (data.connectionState !== "CONNECTED") {
          await updateSessionStatus(sessionName, data.connectionState);
        }

        if (data.connectionState === "QR_CODE") {
          await getQrCode(sessionName);
        } else if (data.connectionState === "CONNECTED") {
          await updateSessionStatus(
            sessionName,
            data.connectionState,
            undefined,
            data.numberInfo || null
          );
        } else if (data.connectionState === "CREATING") {
          setTimeout(() => checkSessionStatusOnCreate(sessionName), 2000);
        }
      }
    } catch (error) {
      console.error("Erro ao verificar status:", error);
      setConnectionStatus("DISCONNECTED");
      await updateSessionStatus(sessionName, "DISCONNECTED");
    }
  };

  const getQrCode = async (sessionName: string) => {
    try {
      const response = await fetch(
        `${WHATSAPP_EXTERNAL_API}/${sessionName}/getqrcode`
      );
      const data = await response.json();

      if (data.status && data.qrcode) {
        setQrCodeData(data.qrcode);
        await updateSessionStatus(
          sessionName,
          "QR_CODE",
          data.qrcode.base64Image
        );
      } else {
        console.error("Erro ao obter QR code:", data.message);
      }
    } catch (error) {
      console.error("Erro ao obter QR code:", error);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch(
        `${WHATSAPP_EXTERNAL_API}/${sessionId}/status`
      );
      const data = await response.json();

      if (data.status) {
        setConnectionStatus(data.connectionState);

        await updateSessionStatus(sessionId, data.connectionState);

        if (data.connectionState === "QR_CODE") {
          await getQrCode(sessionId);
        } else if (data.connectionState === "CONNECTED") {
          await updateSessionStatus(
            sessionId,
            data.connectionState,
            undefined,
            data.numberInfo || null
          );
        }
      }
    } catch (error) {
      console.error("Erro ao verificar status:", error);
    }
  };

  const handleOpenQrModal = async (sessionName: string) => {
    setIsQrModalOpen(true);
    setQrCodeData(null);
    setConnectionStatus("");
    await createSession(sessionName);
  };

  const handleCreateNewConnection = async (sessionName: string) => {
    if (!sessionName.trim()) {
      alert("Por favor, insira um nome para a sessão");
      return;
    }

    try {
      const dbSession = await createSession(sessionName);
      if (dbSession) {
        setIsNewConnectionModalOpen(false);
        setNewSessionName("");
        setIsQrModalOpen(true);
        setQrCodeData(null);
        setConnectionStatus("");
      }
    } catch (error) {
      console.error("Erro ao criar nova conexão:", error);
      alert("Erro ao criar nova conexão");
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isQrModalOpen && connectionStatus === "QR_CODE") {
      interval = setInterval(checkConnectionStatus, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isQrModalOpen, connectionStatus]);

  const loadTemplates = async () => {
    try {
      const response = await fetch("/api/templates");
      const data = await response.json();

      if (data.status) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error("Erro ao carregar templates:", error);
    }
  };

  const loadCampaigns = async () => {
    try {
      const response = await fetch("/api/campaigns");
      const data = await response.json();

      if (data.status) {
        setCampaigns(data.campaigns);
      }
    } catch (error) {
      console.error("Erro ao carregar campanhas:", error);
    }
  };

  const createTemplate = async (name: string) => {
    setIsCreatingTemplate(true);
    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (data.status) {
        await loadTemplates();
        return data.template;
      } else {
        console.error("Erro ao criar template:", data.error);
        return null;
      }
    } catch (error) {
      console.error("Erro ao criar template:", error);
      return null;
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  const createCampaign = async (
    name: string,
    delay: number,
    templateIds: string[]
  ) => {
    setIsCreatingCampaign(true);
    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, delay, templateIds }),
      });

      const data = await response.json();

      if (data.status) {
        await loadCampaigns();
        return data.campaign;
      } else {
        console.error("Erro ao criar campanha:", data.error);
        return null;
      }
    } catch (error) {
      console.error("Erro ao criar campanha:", error);
      return null;
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  const loadTemplateMessages = async (templateId: string) => {
    try {
      const response = await fetch(`/api/templates/${templateId}/messages`);
      const data = await response.json();

      if (data.status) {
        setTemplateMessages(data.messages);
      }
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
    }
  };

  const addMessageToTemplate = async (templateId: string, text: string) => {
    setIsAddingMessage(true);
    try {
      const response = await fetch(`/api/templates/${templateId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (data.status) {
        await loadTemplateMessages(templateId);
        return data.message;
      } else {
        console.error("Erro ao adicionar mensagem:", data.error);
        return null;
      }
    } catch (error) {
      console.error("Erro ao adicionar mensagem:", error);
      return null;
    } finally {
      setIsAddingMessage(false);
    }
  };

  const deleteMessageFromTemplate = async (
    templateId: string,
    messageId: string
  ) => {
    try {
      const response = await fetch(
        `/api/templates/${templateId}/messages?messageId=${messageId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (data.status) {
        await loadTemplateMessages(templateId);
        return true;
      } else {
        console.error("Erro ao deletar mensagem:", data.error);
        return false;
      }
    } catch (error) {
      console.error("Erro ao deletar mensagem:", error);
      return false;
    }
  };

  const openTemplateMessagesModal = async (template: Template) => {
    setSelectedTemplate(template);
    setIsTemplateMessagesModalOpen(true);
    await loadTemplateMessages(template.id);
  };

  useEffect(() => {
    loadWhatsAppSessions();
    loadTemplates();
    loadCampaigns();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showVariablesDropdown && !target.closest(".variables-dropdown")) {
        setShowVariablesDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showVariablesDropdown]);

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-gradient-to-b from-sky-50 via-white to-sky-50">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Conexões de Envio
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Gerencie sessões de WhatsApp, segmentos, templates e disparos em
            massa em um só lugar.
          </p>
        </div>
      </div>

      <Tabs defaultValue="connections" className="space-y-4">
        <TabsList className="bg-white border rounded-full shadow-sm p-1 inline-flex">
          <TabsTrigger
            value="connections"
            className="data-[state=active]:bg-sky-600 data-[state=active]:text-white rounded-full px-4"
          >
            Conexões
          </TabsTrigger>
          <TabsTrigger
            value="segments"
            className="data-[state=active]:bg-sky-600 data-[state=active]:text-white rounded-full px-4"
          >
            Segmentação
          </TabsTrigger>
          <TabsTrigger
            value="templates"
            className="data-[state=active]:bg-sky-600 data-[state=active]:text-white rounded-full px-4"
          >
            Templates
          </TabsTrigger>
          {/* <TabsTrigger value="campaigns">Campanhas</TabsTrigger> */}
          <TabsTrigger
            value="send"
            className="data-[state=active]:bg-sky-600 data-[state=active]:text-white rounded-full px-4"
          >
            Envio em Massa
          </TabsTrigger>
        </TabsList>

        {/* CONEXÕES */}
        <TabsContent value="connections" className="space-y-4">
          <Card className="border border-sky-100/60 bg-white/80 backdrop-blur-sm shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-sky-600" />
                  Sessões WhatsApp
                </CardTitle>
                <CardDescription>
                  Conecte e gerencie múltiplas sessões de WhatsApp para disparos
                  em massa.
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setIsNewConnectionModalOpen(true)}
                variant="outline"
                className="border-sky-200 text-sky-700 hover:bg-sky-50"
              >
                <Plus className="mr-2 h-3 w-3" />
                Nova Sessão
              </Button>
            </CardHeader>
            <CardContent>
              {whatsappSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-muted-foreground">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 mb-3">
                    <QrCode className="h-5 w-5 text-sky-500" />
                  </div>
                  <p className="font-medium text-slate-700">
                    Nenhuma sessão cadastrada
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Crie sua primeira sessão de WhatsApp para iniciar seus
                    disparos automáticos.
                  </p>
                  <Button
                    size="sm"
                    className="mt-4 bg-sky-600 hover:bg-sky-700"
                    onClick={() => setIsNewConnectionModalOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Criar primeira sessão
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {whatsappSessions.map((session) => (
                    <Card
                      key={session.id}
                      className="min-w-0 border border-sky-100/60 bg-white/90 hover:shadow-md transition-shadow"
                    >
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 min-w-0">
                          <MessageCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="truncate">
                            WhatsApp - {session.sessionName}
                          </span>
                        </CardTitle>
                        <Badge
                          variant={
                            session.connectionStatus === "CONNECTED"
                              ? "default"
                              : session.connectionStatus === "QR_CODE"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {session.connectionStatus === "CONNECTED"
                            ? "Conectado"
                            : session.connectionStatus === "QR_CODE"
                            ? "QR Code"
                            : session.connectionStatus === "CREATING"
                            ? "Criando"
                            : "Desconectado"}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Sessão:{" "}
                            <span className="font-medium text-slate-800">
                              {session.sessionName}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {session.lastConnected
                              ? `Conectado em: ${new Date(
                                  session.lastConnected
                                ).toLocaleString()}`
                              : "Nunca conectado"}
                          </p>
                          <div className="flex flex-wrap gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-shrink-0 border-slate-200"
                            >
                              <Settings className="mr-2 h-3 w-3" />
                              Configurar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                setSessionId(session.sessionName);
                                await checkSessionStatus();
                              }}
                              className="flex items-center gap-1 flex-shrink-0 border-slate-200"
                            >
                              <RefreshCw className="mr-1 h-3 w-3" />
                              Atualizar Status
                            </Button>
                            <Button
                              size="sm"
                              className="flex-shrink-0 bg-red-600 text-white hover:bg-red-700"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (
                                  !confirm(
                                    "Tem certeza que deseja deletar esta sessão?"
                                  )
                                )
                                  return;

                                await fetch(
                                  `/api/whatsapp/sessions/${session.id}/delete`,
                                  {
                                    method: "DELETE",
                                  }
                                );

                                await loadWhatsAppSessions?.();
                              }}
                            >
                              🗑 Deletar
                            </Button>

                            {session.connectionStatus === "CONNECTED" ? (
                              <></>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSessionId(session.sessionName);
                                  handleOpenQrModal(session.sessionName);
                                }}
                                className="flex-shrink-0 bg-sky-600 hover:bg-sky-700 text-white"
                              >
                                <QrCode className="mr-2 h-3 w-3" />
                                Conectar
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {connections.map((connection: any) => (
                    <Card
                      key={connection.id}
                      className="min-w-0 border border-sky-100/60 bg-white/90 hover:shadow-md transition-shadow"
                    >
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 min-w-0">
                          {connection.type === "whatsapp" && (
                            <MessageCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          )}
                          {connection.type === "email" && (
                            <Mail className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          )}
                          {connection.type === "sms" && (
                            <Smartphone className="h-4 w-4 text-orange-600 flex-shrink-0" />
                          )}
                          <span className="truncate">{connection.name}</span>
                        </CardTitle>
                        <Badge
                          variant={
                            connection.status === "connected"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {connection.status === "connected"
                            ? "Conectado"
                            : "Desconectado"}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            {connection.type === "whatsapp" ||
                            connection.type === "sms"
                              ? connection.phone
                              : connection.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Última sincronização: {connection.lastSync}
                          </p>
                          <div className="flex flex-wrap gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-shrink-0 border-slate-200"
                            >
                              <Settings className="mr-2 h-3 w-3" />
                              Configurar
                            </Button>
                            {connection.status === "connected" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-shrink-0 border-slate-200"
                              >
                                Testar
                              </Button>
                            ) : connection.type === "whatsapp" ? (
                              <Button
                                size="sm"
                                onClick={() => handleOpenQrModal(sessionId)}
                                className="flex-shrink-0 bg-sky-600 hover:bg-sky-700 text-white"
                              >
                                <QrCode className="mr-2 h-3 w-3" />
                                Conectar
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                className="flex-shrink-0 bg-sky-600 hover:bg-sky-700 text-white"
                              >
                                Conectar
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TEMPLATES */}
        <TabsContent value="templates" className="space-y-4">
          <Card className="border border-sky-100/60 bg-white/80 backdrop-blur-sm shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-sky-600" />
                  Templates
                </CardTitle>
                <CardDescription>
                  Crie e organize modelos de mensagens reutilizáveis.
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setIsNewTemplateModalOpen(true)}
                variant="outline"
                className="border-sky-200 text-sky-700 hover:bg-sky-50"
              >
                <Plus className="mr-2 h-3 w-3" />
                Novo Template
              </Button>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-muted-foreground">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 mb-3">
                    <MessageCircle className="h-5 w-5 text-sky-500" />
                  </div>
                  <p className="font-medium text-slate-700">
                    Nenhum template criado
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Comece criando um template para estruturar seus disparos com
                    variáveis dinâmicas.
                  </p>
                  <Button
                    size="sm"
                    className="mt-4 bg-sky-600 hover:bg-sky-700"
                    onClick={() => setIsNewTemplateModalOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Criar template
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {templates.map((template) => (
                    <Card
                      key={template.id}
                      className="min-w-0 border border-sky-100/60 bg-white/90 hover:shadow-md transition-shadow"
                    >
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 min-w-0">
                          <MessageCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="truncate">{template.name}</span>
                        </CardTitle>
                        <Badge variant="outline">
                          {template.messages.length} mensagens
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            {template.messages.length > 0
                              ? template.messages[0].text?.substring(0, 50) +
                                "..."
                              : "Sem mensagens"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Criado em:{" "}
                            {new Date(template.createdAt).toLocaleDateString()}
                          </p>
                          <div className="flex flex-wrap gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                openTemplateMessagesModal(template)
                              }
                              className="flex-shrink-0 border-slate-200"
                            >
                              <Settings className="mr-2 h-3 w-3" />
                              Configurar
                            </Button>
                            <Button
                              size="sm"
                              className="flex-shrink-0 bg-sky-600 hover:bg-sky-700 text-white"
                            >
                              <Send className="mr-2 h-3 w-3" />
                              Usar
                            </Button>
                            <Button
                              size="sm"
                              className="flex-shrink-0 bg-red-600 text-white hover:bg-red-700"
                              onClick={async () => {
                                if (
                                  !confirm(
                                    "Tem certeza que deseja deletar este template?"
                                  )
                                )
                                  return;

                                await fetch(
                                  `/api/templates/${template.id}/delete`,
                                  {
                                    method: "DELETE",
                                  }
                                );

                                if (typeof loadTemplates === "function") {
                                  loadTemplates();
                                }
                              }}
                            >
                              🗑 Deletar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CAMPANHAS - (ainda não exibido no TabsList, mas mantido) */}
        <TabsContent value="campaigns" className="space-y-4">
          <Card className="border border-sky-100/60 bg-white/80 backdrop-blur-sm shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle>Campanhas</CardTitle>
                <CardDescription>
                  Construa fluxos de mensagens usando múltiplos templates.
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setIsNewCampaignModalOpen(true)}
                variant="outline"
                className="border-sky-200 text-sky-700 hover:bg-sky-50"
              >
                <Plus className="mr-2 h-3 w-3" />
                Nova Campanha
              </Button>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-muted-foreground">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 mb-3">
                    <Send className="h-5 w-5 text-sky-500" />
                  </div>
                  <p className="font-medium text-slate-700">
                    Nenhuma campanha criada
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Crie campanhas para organizar disparos complexos com
                    múltiplos templates.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {campaigns.map((campaign) => (
                    <Card
                      key={campaign.id}
                      className="min-w-0 border border-sky-100/60 bg-white/90 hover:shadow-md transition-shadow"
                    >
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 min-w-0">
                          <MessageCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="truncate">{campaign.name}</span>
                        </CardTitle>
                        <Badge variant="outline">
                          {campaign.templates.length} templates
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Delay: {campaign.delay / 1000}s entre mensagens
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Criada em:{" "}
                            {new Date(campaign.createdAt).toLocaleDateString()}
                          </p>
                          <div className="flex flex-wrap gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-shrink-0 border-slate-200"
                            >
                              <Settings className="mr-2 h-3 w-3" />
                              Configurar
                            </Button>
                            <Button
                              size="sm"
                              className="flex-shrink-0 bg-sky-600 hover:bg-sky-700 text-white"
                            >
                              <Send className="mr-2 h-3 w-3" />
                              Executar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEGMENTOS */}
        <TabsContent value="segments" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <Card className="border border-sky-100/60 bg-white/80 backdrop-blur-sm shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <div>
                  <CardTitle>Segmentos Disponíveis</CardTitle>
                  <CardDescription>
                    Grupos de contatos para envio direcionado.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    window.open("/api/segments/template", "_blank")
                  }
                  className="border-sky-200 text-sky-700 hover:bg-sky-50"
                >
                  📥 Baixar Modelo Excel
                </Button>
              </CardHeader>
              <CardContent>
                {segments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-muted-foreground">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 mb-3">
                      <Users className="h-5 w-5 text-sky-500" />
                    </div>
                    <p className="font-medium text-slate-700">
                      Nenhum segmento cadastrado
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      Crie segmentos para agrupar contatos por tipo de lead,
                      jornada, região e mais.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {segments.map((segment) => (
                      <div
                        key={segment.id}
                        className="p-3 border border-slate-100 rounded-lg hover:bg-sky-50/40 transition-colors cursor-pointer"
                        onClick={() =>
                          loadSegmentContacts(segment.id, segment.name)
                        }
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-medium text-slate-900">
                              {segment.name}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {segment.description}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            {segment.contacts.length} contatos
                          </Badge>
                        </div>

                        <div className="mt-3 flex gap-2 flex-wrap">
                          <input
                            type="file"
                            accept=".xlsx,.xls"
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              setSegmentFiles({
                                ...segmentFiles,
                                [segment.id]: e.target.files?.[0] || null,
                              });
                            }}
                            className="text-xs"
                          />
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleImportExcel(
                                segment.id,
                                segmentFiles[segment.id]
                              );
                            }}
                          >
                            Importar Excel
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(
                                `/api/segments/${segment.id}/export`,
                                "_blank"
                              );
                            }}
                            className="border-slate-200"
                          >
                            Exportar Excel
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-600 text-white hover:bg-red-700"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (
                                !confirm(
                                  "Tem certeza que deseja deletar este segmento?"
                                )
                              )
                                return;

                              await fetch(
                                `/api/segments/${segment.id}/delete`,
                                {
                                  method: "DELETE",
                                }
                              );

                              if (typeof loadSegments === "function") {
                                loadSegments();
                              }
                            }}
                          >
                            🗑 Deletar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-sky-100/60 bg-white/80 backdrop-blur-sm shadow-sm">
              <CardHeader>
                <CardTitle>Criar Novo Segmento</CardTitle>
                <CardDescription>
                  Defina grupos estratégicos de contatos para suas campanhas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="segment-name">Nome do Segmento</Label>
                  <Input
                    id="segment-name"
                    value={newSegmentName}
                    onChange={(e) => setNewSegmentName(e.target.value)}
                    placeholder="Ex: Leads Premium"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="segment-description">Descrição</Label>
                  <Textarea
                    id="segment-description"
                    value={newSegmentDescription}
                    onChange={(e) => setNewSegmentDescription(e.target.value)}
                    placeholder="Descreva os critérios do segmento..."
                    rows={3}
                  />
                </div>

                <Button
                  className="w-full bg-sky-600 hover:bg-sky-700"
                  onClick={createSegment}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Criar Segmento
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ENVIO EM MASSA */}
        <TabsContent value="send" className="space-y-4">
          <Card className="border border-sky-100/60 bg-white/80 backdrop-blur-sm shadow-sm">
            <CardHeader>
              <CardTitle>Disparo de Campanha</CardTitle>
              <CardDescription>
                Crie e agende campanhas de envio em massa usando segmentos,
                templates e sessões conectadas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome da Campanha</Label>
                    <Input
                      type="text"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      placeholder="Digite o nome da campanha"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Templates da Campanha</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2 bg-slate-50/60">
                      {templates.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Nenhum template disponível. Crie templates na aba
                          &quot;Templates&quot;.
                        </p>
                      ) : (
                        templates.map((template) => (
                          <div
                            key={template.id}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              id={`template-${template.id}`}
                              checked={selectedTemplates.includes(template.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTemplates([
                                    ...selectedTemplates,
                                    template.id,
                                  ]);
                                } else {
                                  setSelectedTemplates(
                                    selectedTemplates.filter(
                                      (id) => id !== template.id
                                    )
                                  );
                                }
                              }}
                            />
                            <Label
                              htmlFor={`template-${template.id}`}
                              className="text-sm"
                            >
                              {template.name} ({template.messages.length}{" "}
                              mensagens)
                            </Label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Segmento de Destino</Label>
                    <Select
                      value={selectedSegment}
                      onValueChange={setSelectedSegment}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um segmento" />
                      </SelectTrigger>
                      <SelectContent>
                        {segments.map((segment) => (
                          <SelectItem key={segment.id} value={segment.id}>
                            {segment.name} ({segment.contacts.length} contatos)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Sessão WhatsApp</Label>
                    <Select
                      value={selectedSessionName}
                      onValueChange={setSelectedSessionName}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma sessão" />
                      </SelectTrigger>
                      <SelectContent>
                        {whatsappSessions
                          .filter((s) => s.connectionStatus === "CONNECTED")
                          .map((s) => (
                            <SelectItem key={s.id} value={s.sessionName}>
                              {s.sessionName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Data/Hora de Envio</Label>
                    <Input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Deixe em branco para enviar imediatamente.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Delay entre mensagens (segundos)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={300}
                      value={customDelay}
                      onChange={(e) =>
                        setCustomDelay(Number(e.target.value) || 1)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Delay entre contatos (segundos)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={300}
                      value={customContactDelay}
                      onChange={(e) =>
                        setCustomContactDelay(Number(e.target.value) || 1)
                      }
                    />
                  </div>

                  <div className="rounded-lg border border-sky-100 bg-sky-50/60 p-3 text-xs text-slate-600">
                    Ajuste os delays para evitar bloqueios de spam e manter uma
                    entrega segura das mensagens.
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-sky-600 hover:bg-sky-700"
                onClick={async () => {
                  if (
                    !campaignName ||
                    !selectedSegment ||
                    !selectedSessionName
                  ) {
                    alert(
                      "Digite o nome da campanha, selecione o segmento e a sessão."
                    );
                    return;
                  }

                  const res = await fetch(`/api/campaigns/create-and-send`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      campaignName,
                      segmentId: selectedSegment,
                      sessionName: selectedSessionName,
                      scheduledAt: scheduledAt
                        ? (() => {
                            const scheduleDate =
                              createLocalScheduleDateTime(scheduledAt);
                            return scheduleDate
                              ? toISOString(scheduleDate)
                              : null;
                          })()
                        : null,
                      delay: customDelay * 1000,
                      contactDelay: customContactDelay * 1000,
                      templateIds: selectedTemplates,
                    }),
                  });

                  const data = await res.json();
                  if (data.status) {
                    alert(
                      `Mensagens enfileiradas: ${data.enqueued} mensagens.`
                    );
                  } else {
                    console.error("SEND", res);
                    alert("Erro ao disparar mensagens: " + data.error);
                  }
                }}
              >
                <Send className="mr-2 h-4 w-4" /> Disparar Mensagens
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal do QR Code */}
      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-sky-600" />
              Conectar WhatsApp
            </DialogTitle>
            <DialogDescription>
              Escaneie o QR Code com seu WhatsApp para conectar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Criando sessão...
                </p>
              </div>
            ) : connectionStatus === "CONNECTED" ? (
              <div className="flex flex-col items-center justify-center py-8">
                <CheckCircle className="h-12 w-12 text-green-600" />
                <h3 className="mt-4 text-lg font-semibold text-green-600">
                  Sessão Conectada!
                </h3>
                <p className="mt-2 text-sm text-muted-foreground text-center">
                  WhatsApp conectado com sucesso.
                </p>
                <Button
                  onClick={() => setIsQrModalOpen(false)}
                  className="mt-4"
                >
                  Fechar
                </Button>
              </div>
            ) : qrCodeData ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white p-4 rounded-lg border">
                  <img
                    src={`${qrCodeData.base64Image}`}
                    alt="QR Code WhatsApp"
                    className="w-64 h-64"
                  />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Status: <Badge variant="outline">{connectionStatus}</Badge>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Abra o WhatsApp no seu celular e escaneie o QR Code.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkSessionStatus}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Verificar Status
                </Button>
              </div>
            ) : connectionStatus === "CREATING" ? (
              <div className="flex flex-col items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Criando sessão...
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-sm text-muted-foreground">
                  Aguardando QR Code...
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal contatos do segmento */}
      <Dialog
        open={isSegmentContactsModalOpen}
        onOpenChange={setIsSegmentContactsModalOpen}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Contatos do Segmento: {selectedSegmentName}
            </DialogTitle>
            <DialogDescription>
              Lista completa de contatos cadastrados.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-96 overflow-y-auto mt-4 space-y-2">
            {selectedSegmentContacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum contato neste segmento.
              </p>
            ) : (
              selectedSegmentContacts.map((c, i) => (
                <div
                  key={c.id}
                  className="border rounded-lg p-2 flex justify-between items-center bg-slate-50/60"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {i + 1}. {c.name || "Sem nome"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      📱 {c.phone} | 📧 {c.email}
                    </p>
                  </div>
                  {c.company && (
                    <Badge variant="secondary" className="ml-2">
                      {c.company}
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={() => setIsSegmentContactsModalOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Nova Conexão */}
      <Dialog
        open={isNewConnectionModalOpen}
        onOpenChange={setIsNewConnectionModalOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nova Conexão WhatsApp
            </DialogTitle>
            <DialogDescription>
              Crie uma nova sessão do WhatsApp para conectar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="session-name">Nome da Sessão</Label>
              <Input
                id="session-name"
                placeholder="Ex: Sessão Principal"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleCreateNewConnection(newSessionName);
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Este nome será usado para identificar a sessão do WhatsApp.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsNewConnectionModalOpen(false);
                  setNewSessionName("");
                }}
                className="flex-1 min-w-0"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleCreateNewConnection(newSessionName)}
                className="flex-1 min-w-0 bg-sky-600 hover:bg-sky-700"
                disabled={!newSessionName.trim()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Sessão
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Novo Template */}
      <Dialog
        open={isNewTemplateModalOpen}
        onOpenChange={setIsNewTemplateModalOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Novo Template
            </DialogTitle>
            <DialogDescription>
              Crie um novo template de mensagens.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Nome do Template</Label>
              <Input
                id="template-name"
                placeholder="Ex: Template de Boas-vindas"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && newTemplateName.trim()) {
                    createTemplate(newTemplateName).then((template) => {
                      if (template) {
                        setIsNewTemplateModalOpen(false);
                        setNewTemplateName("");
                      } else {
                        alert("Erro ao criar template");
                      }
                    });
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Este nome será usado para identificar o template.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsNewTemplateModalOpen(false);
                  setNewTemplateName("");
                }}
                className="flex-1 min-w-0"
              >
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  if (!newTemplateName.trim()) {
                    alert("Por favor, insira um nome para o template");
                    return;
                  }

                  const template = await createTemplate(newTemplateName);

                  if (template) {
                    setIsNewTemplateModalOpen(false);
                    setNewTemplateName("");
                  } else {
                    alert("Erro ao criar template");
                  }
                }}
                className="flex-1 min-w-0 bg-sky-600 hover:bg-sky-700"
                disabled={!newTemplateName.trim() || isCreatingTemplate}
              >
                {isCreatingTemplate ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {isCreatingTemplate ? "Criando..." : "Criar Template"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Nova Campanha */}
      <Dialog
        open={isNewCampaignModalOpen}
        onOpenChange={setIsNewCampaignModalOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nova Campanha
            </DialogTitle>
            <DialogDescription>
              Crie uma nova campanha de envio.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Nome da Campanha</Label>
              <Input
                id="campaign-name"
                placeholder="Ex: Campanha Black Friday"
                value={newCampaignName}
                onChange={(e) => setNewCampaignName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && newCampaignName.trim()) {
                    createCampaign(
                      newCampaignName,
                      newCampaignDelay,
                      selectedTemplates
                    ).then((campaign) => {
                      if (campaign) {
                        setIsNewCampaignModalOpen(false);
                        setNewCampaignName("");
                        setNewCampaignDelay(30000);
                        setSelectedTemplates([]);
                      } else {
                        alert("Erro ao criar campanha");
                      }
                    });
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-delay">
                Delay entre mensagens (segundos)
              </Label>
              <Input
                id="campaign-delay"
                type="number"
                value={newCampaignDelay / 1000}
                onChange={(e) =>
                  setNewCampaignDelay(parseInt(e.target.value || "1") * 1000)
                }
                min="1"
                max="300"
              />
            </div>

            <div className="space-y-2">
              <Label>Templates da Campanha</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="checkbox"
                      id={`template-${template.id}`}
                      checked={selectedTemplates.includes(template.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTemplates([
                            ...selectedTemplates,
                            template.id,
                          ]);
                        } else {
                          setSelectedTemplates(
                            selectedTemplates.filter((id) => id !== template.id)
                          );
                        }
                      }}
                    />
                    <Label
                      htmlFor={`template-${template.id}`}
                      className="text-sm"
                    >
                      {template.name} ({template.messages.length} mensagens)
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsNewCampaignModalOpen(false);
                  setNewCampaignName("");
                  setNewCampaignDelay(30000);
                  setSelectedTemplates([]);
                }}
                className="flex-1 min-w-0"
              >
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  if (!newCampaignName.trim()) {
                    alert("Por favor, insira um nome para a campanha");
                    return;
                  }

                  const campaign = await createCampaign(
                    newCampaignName,
                    newCampaignDelay,
                    selectedTemplates
                  );

                  if (campaign) {
                    setIsNewCampaignModalOpen(false);
                    setNewCampaignName("");
                    setNewCampaignDelay(30000);
                    setSelectedTemplates([]);
                  } else {
                    alert("Erro ao criar campanha");
                  }
                }}
                className="flex-1 min-w-0 bg-sky-600 hover:bg-sky-700"
                disabled={!newCampaignName.trim() || isCreatingCampaign}
              >
                {isCreatingCampaign ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {isCreatingCampaign ? "Criando..." : "Criar Campanha"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Mensagens do Template */}
      <Dialog
        open={isTemplateMessagesModalOpen}
        onOpenChange={setIsTemplateMessagesModalOpen}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Mensagens do Template: {selectedTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              Gerencie as mensagens deste template.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Adicionar nova mensagem */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="new-message">Nova Mensagem</Label>
                <div className="relative variables-dropdown">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setShowVariablesDropdown(!showVariablesDropdown)
                    }
                    className="flex items-center gap-2"
                  >
                    <span className="text-blue-600">📝</span>
                    Variáveis
                  </Button>

                  {showVariablesDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                      <div className="p-3 border-b border-gray-100">
                        <h4 className="text-sm font-medium text-gray-900">
                          Variáveis Disponíveis
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Clique para inserir no texto.
                        </p>
                      </div>
                      <div className="p-2 space-y-1">
                        {availableVariables.map((variable) => (
                          <button
                            key={variable.key}
                            onClick={() => insertVariable(variable.key)}
                            className="w-full text-left p-2 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-sm font-medium text-blue-600">
                                  {variable.key}
                                </span>
                                <p className="text-xs text-gray-500">
                                  {variable.description}
                                </p>
                              </div>
                              <span className="text-xs text-gray-400">
                                {variable.label}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Textarea
                  id="new-message"
                  placeholder="Digite sua mensagem... Use variáveis como {{nome}}, {{telefone}}, etc."
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  rows={4}
                  className="w-full"
                />

                {newMessageText && (
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <Label className="text-xs text-gray-600 mb-2 block">
                      Preview:
                    </Label>
                    <div className="text-sm">
                      {renderTextWithVariables(newMessageText)}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    if (newMessageText.trim() && selectedTemplate) {
                      await addMessageToTemplate(
                        selectedTemplate.id,
                        newMessageText
                      );
                      setNewMessageText("");
                    }
                  }}
                  disabled={!newMessageText.trim() || isAddingMessage}
                  className="flex-1 bg-sky-600 hover:bg-sky-700"
                >
                  {isAddingMessage ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Adicionar Mensagem
                </Button>
              </div>

              {/* Uploads */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="image-upload">Imagem</Label>
                  <Input
                    id="upload-image"
                    type="file"
                    accept="image/*"
                    ref={imageInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, "image", imageInputRef);
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="video-upload">Vídeo</Label>
                  <Input
                    id="upload-video"
                    type="file"
                    accept="video/*"
                    ref={videoInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, "video", videoInputRef);
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="audio-upload">Áudio</Label>
                  <Input
                    id="upload-audio"
                    type="file"
                    accept="audio/*"
                    ref={audioInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, "audio", audioInputRef);
                    }}
                  />

                  {/* Gravação manual */}
                  <div className="mt-2 flex gap-2">
                    {!isRecording ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          if (!selectedTemplate) return;
                          try {
                            const stream =
                              await navigator.mediaDevices.getUserMedia({
                                audio: true,
                              });
                            const recorder = new MediaRecorder(stream);
                            setAudioChunks([]);
                            recorder.ondataavailable = (event) => {
                              if (event.data.size > 0) {
                                setAudioChunks((prev) => [...prev, event.data]);
                              }
                            };
                            recorder.start();
                            setMediaRecorder(recorder);
                            setIsRecording(true);
                          } catch (err) {
                            console.error("Erro ao iniciar gravação:", err);
                            alert("Erro ao acessar o microfone");
                          }
                        }}
                      >
                        🎙️ Iniciar Gravação
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async () => {
                          if (!mediaRecorder || !selectedTemplate) return;

                          const chunks: BlobPart[] = [];

                          const finalBlob = await new Promise<Blob>(
                            (resolve) => {
                              mediaRecorder.ondataavailable = (event) => {
                                if (event.data.size > 0) {
                                  chunks.push(event.data);
                                }
                              };

                              mediaRecorder.onstop = () => {
                                const blob = new Blob(chunks, {
                                  type: "audio/webm",
                                });
                                resolve(blob);
                              };

                              mediaRecorder.stop();
                            }
                          );

                          if (finalBlob.size === 0) {
                            toast.error("⚠️ Nenhum áudio foi gravado.");
                            return;
                          }

                          const file = new File([finalBlob], "gravacao.webm", {
                            type: "audio/webm",
                          });

                          const formData = new FormData();
                          formData.append("file", file);
                          formData.append("type", "audio");

                          try {
                            const res = await fetch(
                              `/api/templates/${selectedTemplate.id}/messages`,
                              {
                                method: "POST",
                                body: formData,
                              }
                            );
                            const data = await res.json();

                            if (data.status) {
                              toast.success("🎙️ Áudio gravado com sucesso!");
                              await loadTemplateMessages(selectedTemplate.id);
                            } else {
                              toast.error(
                                data?.error || "Erro ao salvar o áudio"
                              );
                            }
                          } catch (err) {
                            console.error("❌ Erro upload áudio:", err);
                            toast.error("Falha no upload do áudio");
                          }

                          mediaRecorder.stream
                            .getTracks()
                            .forEach((t) => t.stop());
                          setIsRecording(false);
                          setMediaRecorder(null);
                        }}
                      >
                        ⏹ Parar Gravação
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="document-upload">Documento (PDF)</Label>
                  <Input
                    id="upload-document"
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                    ref={documentInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file)
                        handleFileUpload(file, "document", documentInputRef);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Lista de mensagens */}
            <div className="space-y-2">
              <Label>Mensagens do Template</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {templateMessages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma mensagem criada ainda.
                  </p>
                ) : (
                  templateMessages.map((message, index) => (
                    <div
                      key={message.id}
                      className="border rounded-lg p-3 bg-muted/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              #{index + 1}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(message.createdAt).toLocaleString()}
                            </span>
                          </div>

                          {message.text && (
                            <div className="text-sm">
                              {renderTextWithVariables(message.text)}
                            </div>
                          )}

                          <div className="flex flex-col gap-2 mt-2">
                            {message.imageUrl && (
                              <img
                                src={message.imageUrl}
                                className="h-20 rounded"
                              />
                            )}
                            {message.videoUrl && (
                              <video
                                src={message.videoUrl}
                                controls
                                className="h-20"
                              />
                            )}
                            {message.audioUrl && (
                              <audio src={message.audioUrl} controls />
                            )}
                            {message.documentUrl && (
                              <a
                                href={message.documentUrl}
                                target="_blank"
                                className="text-blue-500 underline"
                              >
                                📄 Abrir Documento
                              </a>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            if (selectedTemplate) {
                              await deleteMessageFromTemplate(
                                selectedTemplate.id,
                                message.id
                              );
                            }
                          }}
                          className="ml-2"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setIsTemplateMessagesModalOpen(false);
                  setSelectedTemplate(null);
                  setTemplateMessages([]);
                  setNewMessageText("");
                }}
              >
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
