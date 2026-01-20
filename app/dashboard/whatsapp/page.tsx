"use client";

import { formatDateForDisplay, parseDate } from "@/lib/dateUtils";
import {
  FileText,
  Image as ImageIcon,
  Mic,
  Send,
  StopCircle,
  Video,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import styles from "./whatsapp-styles.module.scss";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatBRPhone } from "@/utils";
import { useSession } from "next-auth/react";
import { Chat, Message } from "./types";

const WhatsAppChats = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const { data: session } = useSession();
  const [aiMode, setAiMode] = useState(false);

  const lastAiHandledMessageRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedChat) {
      lastAiHandledMessageRef.current = null;
      return;
    }

    // pega a última mensagem recebida (inbound) desse chat
    const lastInbound = messages
      .filter((m) => m.direction === "inbound")
      .slice(-1)[0];

    // marca como "já tratada" para não responder histórico velho
    if (lastInbound) {
      lastAiHandledMessageRef.current = lastInbound.id;
    }
  }, [selectedChat]);

  useEffect(() => {
    if (!aiMode) return;

    // ao ligar o AI Mode, considera a última inbound atual como "já tratada"
    const lastInbound = messages
      .filter((m) => m.direction === "inbound")
      .slice(-1)[0];

    if (lastInbound) {
      lastAiHandledMessageRef.current = lastInbound.id;
    }
  }, [aiMode]);

  const handleAiReply = async () => {
    if (!aiMode || !selectedChat) return;

    const lastInbound = messages
      .filter((m) => m.direction === "inbound")
      .slice(-1)[0];

    if (!lastInbound) return;

    // se essa mensagem já foi tratada pela IA, não faz nada
    if (lastAiHandledMessageRef.current === lastInbound.id) return;

    lastAiHandledMessageRef.current = lastInbound.id;

    try {
      let contentText = lastInbound.text || "";

      console.log("lastIndoud", lastInbound);

      // 🟡 Se for áudio/ptt, transcreve antes de mandar pra IA
      if (
        aiMode &&
        (lastInbound.mediaType === "audio" || lastInbound.type === "ptt")
      ) {
        if (!lastInbound.mediaUrl) {
          console.warn(
            "Mensagem de áudio sem mediaUrl, não dá pra transcrever."
          );
          return;
        }

        const formData = new FormData();
        formData.append("audioUrl", lastInbound.mediaUrl);

        const resp = await fetch("/api/whatsapp/transcribe-audio-from-url", {
          method: "POST",
          body: formData,
        });

        const data = await resp.json();
        if (data.ok && data.text) {
          contentText = data.text;
        } else {
          console.error("Erro transcrição:", data);
          return;
        }
      }

      // monta histórico (últimas 15)
      const lastMessages = messages.slice(-15);

      const payload = {
        chatId: selectedChat.id,
        contactName: selectedChat.contact?.name || "",
        contactPhone: selectedChat.contact?.phone || "",
        messages: lastMessages.map((m) => ({
          role: m.direction === "inbound" ? "user" : "assistant",
          content: m.id === lastInbound.id ? contentText : m.text || "",
          timestamp: m.timestamp,
        })),
      };

      const res = await fetch("/api/whatsapp/ai-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.ok || !data.reply) return;

      await sendMessage(data.reply as string);
    } catch (err) {
      console.error("Erro ao obter resposta da IA:", err);
    }
  };

  useEffect(() => {
    if (!aiMode || !selectedChat) return;
    if (!messages || messages.length === 0) return;

    // verifica se a última mensagem é inbound (do cliente)
    const last = messages[messages.length - 1];

    if (last.direction !== "inbound") return;

    // delega pra função que garante que não vai responder duas vezes
    handleAiReply();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, aiMode, selectedChat?.id]);

  useEffect(() => {
    if (!session?.user?.id) return;

    fetch("/api/quick-replies", {
      headers: { "x-user-id": session.user.id },
    })
      .then((res) => res.json())
      .then();
  }, [session?.user?.id]);

  const [showQrReconnectModal, setShowQrReconnectModal] = useState(false);
  const [qrReconnectInfo, setQrReconnectInfo] = useState<{
    session: string;
    number: string;
    qrCode?: { base64Image: string };
  } | null>(null);

  useEffect(() => {
    if (!showQrReconnectModal || !qrReconnectInfo?.session) return;

    let interval: NodeJS.Timeout;

    const pollStatus = async () => {
      try {
        const resp = await fetch(
          `https://wpp.melissaia.com.br/${qrReconnectInfo.session}/status`
        );
        const data = await resp.json();

        // Atualiza número no modal
        if (data.numberInfo?.wid?.user) {
          setQrReconnectInfo((prev) =>
            prev ? { ...prev, number: data.numberInfo.wid.user } : prev
          );
        }

        if (data.connectionState === "CONNECTED") {
          console.log("✅ Sessão reconectada:", qrReconnectInfo.session);
          setShowQrReconnectModal(false); // fecha modal
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Erro ao verificar status da sessão:", err);
      }
    };

    interval = setInterval(pollStatus, 5000);
    pollStatus(); // dispara a primeira logo de cara

    return () => clearInterval(interval);
  }, [showQrReconnectModal, qrReconnectInfo?.session]);

  const [selectedTagFilter, setSelectedTagFilter] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [showConnectionsDropdown, setShowConnectionsDropdown] = useState(false);

  // Estados para gravação de áudio
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );

  const [recordingTime, setRecordingTime] = useState(0);
  const [sendingAudio, setSendingAudio] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Buscar chats do WhatsApp
  const fetchChats = async (showLoading = true, showArchived = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const url = showArchived
        ? "/api/whatsapp/chats?showArchived=true"
        : "/api/whatsapp/chats";

      const response = await fetch(url);
      const data = await response.json();
      setChats(data);
    } catch (error: unknown) {
      console.error("Erro ao buscar chats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Buscar mensagens de um chat específico
  const fetchMessages = async (
    chatId: string,
    sessionKey?: string, // agora vem no formato "sessionName|sessionId"
    showLoading = true,
    showArchived = false
  ) => {
    if (showLoading) setMessagesLoading(true);

    try {
      console.log(`🔍 Buscando mensagens para chatId: ${chatId}`);

      let sessionName: string | undefined;
      let sessionId: string | undefined;

      if (sessionKey) {
        const [name, id] = sessionKey.split("|");
        sessionName = name;
        sessionId = id;
      }

      const query = `/api/whatsapp/messages?chatId=${encodeURIComponent(
        chatId
      )}${
        sessionName ? `&sessionName=${encodeURIComponent(sessionName)}` : ""
      }${sessionId ? `&sessionId=${encodeURIComponent(sessionId)}` : ""}${
        showArchived ? `&showArchived=true` : ""
      }`;

      const response = await fetch(query);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Erro ao buscar mensagens:", error);
      setMessages([]);
    } finally {
      if (showLoading) setMessagesLoading(false);
    }
  };

  // Funções para gravação de áudio
  const startRecording = async () => {
    if (!isMounted) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000,
        },
      });

      // Tentar diferentes formatos de áudio
      let mimeType = "audio/ogg;codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/webm;codecs=opus";
      }
      const recorder = new MediaRecorder(stream, { mimeType });

      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, {
          type: "audio/webm;codecs=opus",
        });
        await sendAudio(audioBlob);

        // Parar todas as tracks de mídia
        stream.getTracks().forEach((track) => track.stop());
      };

      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);

      // Iniciar timer
      if (isMounted) {
        recordingTimerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      }

      recorder.start();
      console.log("🎤 Gravação iniciada");
    } catch (error) {
      console.error("❌ Erro ao acessar microfone:", error);
      alert("Erro ao acessar o microfone. Verifique as permissões.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);

      // Limpar timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      console.log("🛑 Gravação finalizada");
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      setRecordingTime(0);

      // Limpar timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      console.log("❌ Gravação cancelada");
    }
  };

  const sendAudio = async (audio: Blob | string) => {
    if (!selectedChat || sendingAudio) return;
    setSendingAudio(true);

    try {
      const formData = new FormData();
      formData.append("contactId", selectedChat.chatId);
      formData.append("sessionName", selectedChat.sessionName);

      if (typeof audio === "string") {
        // 🔹 já é URL pública
        formData.append("audioUrl", audio);
      } else {
        // 🔹 é Blob gravado no browser
        formData.append("audio", audio, `audio_${Date.now()}.ogg`);
      }

      const response = await fetch("/api/whatsapp/send-audio", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      console.log(result);

      if (result.success) {
        fetchMessages(selectedChat.id, selectedChat.sessionName, false, false);
        fetchChats(false, false);
      } else {
        alert(`Erro: ${result.error || result.details}`);
      }
    } finally {
      setSendingAudio(false);
    }
  };

  async function enviarVideo(
    contactId: string,
    sessionName: string,
    fileOrUrl: File | string
  ) {
    const formData = new FormData();
    formData.append("contactId", contactId);
    formData.append("sessionName", sessionName);

    if (typeof fileOrUrl === "string") {
      // 🔹 Quick Reply ou mídia já no Firebase
      formData.append("videoUrl", fileOrUrl);
    } else {
      // 🔹 Upload manual de arquivo
      formData.append("video", fileOrUrl);
    }

    const res = await fetch("/api/whatsapp/send-video", {
      method: "POST",
      body: formData,
    });

    return await res.json();
  }

  const sendImage = async (fileOrUrl: File | string) => {
    if (!selectedChat) return;

    try {
      const formData = new FormData();
      formData.append("contactId", selectedChat.chatId);
      formData.append("sessionName", selectedChat.sessionName);
      formData.append("caption", newMessage || ""); // opcional: legenda

      if (typeof fileOrUrl === "string") {
        // 🔹 Quick Reply com URL pública
        formData.append("imageUrl", fileOrUrl);
      } else {
        // 🔹 Upload manual de arquivo
        formData.append("image", fileOrUrl);
      }

      const response = await fetch("/api/whatsapp/send-image", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      console.log("📸 Resultado envio imagem:", result);

      if (result.success) {
        fetchMessages(selectedChat.id, selectedChat.sessionName, false, false);
        fetchChats(false, false);
        setNewMessage("");

        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 2000);
      } else {
        alert(`Erro ao enviar imagem: ${result.error || result.details}`);
      }
    } catch (error) {
      console.error("❌ Erro ao enviar imagem:", error);
      alert("Erro de conexão ao enviar imagem.");
    }
  };

  // Formatar tempo de gravação
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Cleanup para timer de gravação
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  // Detectar se é mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Carregamento inicial
  useEffect(() => {
    setIsMounted(true);
    fetchChats(true, false);
  }, []);

  // Atualizar chats quando showArchived mudar
  useEffect(() => {
    if (isMounted) {
      fetchChats(false, false);
      // Se há um chat selecionado, atualizar as mensagens também
      if (selectedChat) {
        fetchMessages(selectedChat.id, selectedChat.sessionName, false, false);
      }
    }
  }, [isMounted, selectedChat]);

  // Atalho de teclado para limpar filtros (Escape)
  useEffect(() => {
    if (!isMounted) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedTagFilter) {
          setSelectedTagFilter("");
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [selectedTagFilter, isMounted]);

  // Atualização automática em background a cada 10 segundos
  useEffect(() => {
    if (!isMounted) return;

    const interval = setInterval(() => {
      fetchChats(false, false);
    }, 10000);
    return () => clearInterval(interval);
  }, [isMounted]);

  // Gerenciar sidebar mobile baseado na seleção de chat
  useEffect(() => {
    if (isMobile) {
      if (!selectedChat) {
        // Se não há chat selecionado, mostrar sidebar
        setIsMobileSidebarOpen(true);
      } else {
        // Se há chat selecionado, esconder sidebar
        setIsMobileSidebarOpen(false);
      }
    }
  }, [selectedChat, isMobile]);

  // Buscar mensagens quando um chat for selecionado
  useEffect(() => {
    if (!isMounted || !selectedChat) return;

    console.log("🔄 Chat selecionado, buscando mensagens...", selectedChat.id);
    fetchMessages(selectedChat.id, selectedChat.sessionName, true, false);

    // Atualização automática das mensagens em background
    const interval = setInterval(() => {
      fetchMessages(selectedChat.id, selectedChat.sessionName, false, false);
    }, 5000);

    // Limpar mensagem anterior e focar no input
    setNewMessage("");
    setTimeout(() => {
      messageInputRef.current?.focus();
    }, 100);

    return () => clearInterval(interval);
  }, [selectedChat, isMounted]);

  // Scroll automático para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const finalText = text ?? newMessage;
    if (!selectedChat || !finalText.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch("/api/whatsapp/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contactId: selectedChat.chatId,
          text: finalText.trim(),
          sessionName: selectedChat.sessionName,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setNewMessage(""); // limpa input se for manual

        // adiciona no estado local
        const newMsg: Message = {
          id: `temp-${Date.now()}`,
          text: finalText.trim(),
          timestamp: new Date().toISOString(),
          direction: "outbound",
          fromType: "user",
          channel: "whatsapp",
        };
        setMessages((prev) => [...prev, newMsg]);

        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 2000);
      } else {
        alert(`Erro ao enviar mensagem: ${result.error || result.details}`);
      }
    } catch (error) {
      console.error("❌ Erro na requisição:", error);
    }
    setSending(false);
  };

  // Função para enviar com Enter
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    if (!isMounted) return "";
    const date = parseDate(timestamp);
    return date ? formatDateForDisplay(date, "HH:mm") : "";
  };

  const formatDate = (timestamp: string) => {
    if (!isMounted) return "";
    const date = parseDate(timestamp);
    return date ? formatDateForDisplay(date, "dd/MM/yyyy") : "";
  };

  const filteredChats = chats.filter((chat) => {
    // Filtro por busca
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const contactName = chat.contact?.name?.toLowerCase() || "";
      const contactPhone = chat.contact?.phone?.toLowerCase() || "";
      const lastMessage = chat.lastMessage?.text?.toLowerCase() || "";

      if (
        !contactName.includes(query) &&
        !contactPhone.includes(query) &&
        !lastMessage.includes(query)
      ) {
        return false;
      }
    }

    // Filtro por sessão
    if (selectedSession && chat.sessionName !== selectedSession) {
      return false;
    }

    // Filtro por tag
    let tagMatch = true;
    if (selectedTagFilter) {
      if (selectedTagFilter === "no-tags") {
        tagMatch = !chat.tags || chat.tags.length === 0;
      } else {
        tagMatch =
          chat.tags?.some((tag) => tag.id === selectedTagFilter) || false;
      }
    }

    // Não precisamos mais filtrar por arquivados no frontend
    // A API já retorna apenas os chats corretos baseado no parâmetro showArchived
    return tagMatch;
  });
  const sortedChats = filteredChats
    // Filtro: só inclui se não tem phone OU phone com até 15 caracteres
    .filter((chat) => !chat.contact?.phone || chat.contact.phone.length <= 15)
    .sort((a, b) => {
      // Se não tem mensagem, trata como menos recente
      const tsA = a.lastMessage?.timestamp
        ? new Date(a.lastMessage.timestamp).getTime()
        : 0;
      const tsB = b.lastMessage?.timestamp
        ? new Date(b.lastMessage.timestamp).getTime()
        : 0;
      return tsB - tsA;
    });

  // Filtrar por sessão (se selecionada) - sem agrupar
  const chatsFilteredBySession = sortedChats.filter(
    (chat) => !selectedSession || chat.sessionName === selectedSession
  );

  function base64ToBlob(base64: string, mimeType: string = "application/pdf") {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      byteArrays.push(new Uint8Array(byteNumbers));
    }

    return new Blob(byteArrays, { type: mimeType });
  }

  if (!isMounted || loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  async function enviarPDF(
    contactId: string,
    sessionName: string,
    fileOrUrl: File | string
  ) {
    console.log(contactId, sessionName, fileOrUrl);
    const formData = new FormData();
    formData.append("contactId", contactId);
    formData.append("sessionName", sessionName);

    if (typeof fileOrUrl === "string") {
      // 🔹 Quick Reply com URL pública
      formData.append("fileUrl", fileOrUrl); // 👈 mudar aqui
    } else {
      // 🔹 Upload manual de arquivo
      formData.append("file", fileOrUrl);
    }

    const res = await fetch("/api/whatsapp/send-document", {
      method: "POST",
      body: formData,
    });

    return await res.json();
  }

  const checkReconnectStatus = async (sessionName: string) => {
    console.log("CHECANDO");
    try {
      const resp = await fetch(
        `https://wpp.melissaia.com.br/${sessionName}/status`
      );
      const data = await resp.json();
      console.log(data);
      // Atualiza número
      if (!qrReconnectInfo || qrReconnectInfo.session !== sessionName) {
        setQrReconnectInfo({
          session: sessionName,
          number: data.numberInfo?.wid?.user || "",
          qrCode: qrReconnectInfo?.qrCode, // preserva QR atual
        });
      }

      if (data.connectionState === "QR_CODE") {
        // 🚨 Buscar QR code base64 do endpoint
        const qrResp = await fetch(
          `https://wpp.melissaia.com.br/${sessionName}/getqrcode`
        );
        const qrData = await qrResp.json();
        console.log(qrData);

        if (qrData.status && qrData.qrcode?.base64Image) {
          setQrReconnectInfo((prev) =>
            prev ? { ...prev, qrCode: qrData.qrcode } : prev
          );
        }
      }

      if (data.connectionState === "CONNECTED") {
        console.log("✅ Sessão reconectada:", sessionName);
        setShowQrReconnectModal(false);
      } else {
        setTimeout(() => checkReconnectStatus(sessionName), 3000);
      }
    } catch (err) {
      console.error("Erro ao verificar status:", err);
      setTimeout(() => checkReconnectStatus(sessionName), 5000);
    }
  };

  return (
    <>
      {/* Botão de toggle para mobile */}
      <button
        className={styles.mobileToggle}
        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        title="Abrir lista de conversas"
      >
        <i className="fe fe-list"></i>
      </button>

      <Dialog
        open={showQrReconnectModal}
        onOpenChange={setShowQrReconnectModal}
      >
        <DialogContent
          className={styles.whatsappModal}
          style={{
            maxWidth: 420,
            borderRadius: 16,
            textAlign: "center",
            padding: 0,
            overflow: "hidden",
          }}
        >
          <DialogHeader
            style={{
              background:
                "linear-gradient(135deg, var(--primary-blue) 0%, var(--blue-600) 100%)",
              color: "white",
              padding: "24px 28px",
              margin: 0,
            }}
          >
            <DialogTitle style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
              🔄 Reconectar WhatsApp
            </DialogTitle>
            <p
              style={{
                fontSize: 13,
                margin: "8px 0 0 0",
                opacity: 0.9,
              }}
            >
              Escaneie o QR Code para reconectar sua sessão do WhatsApp
            </p>
          </DialogHeader>

          {qrReconnectInfo && (
            <div
              style={{
                padding: "28px",
                background: "transparent",
              }}
            >
              <div
                style={{
                  background:
                    "linear-gradient(135deg, var(--blue-50) 0%, var(--blue-100) 100%)",
                  padding: "16px 20px",
                  borderRadius: "12px",
                  marginBottom: "20px",
                  border: "1px solid var(--blue-200)",
                }}
              >
                <p
                  style={{
                    fontSize: 14,
                    marginBottom: 8,
                    color: "var(--primary-blue)",
                    fontWeight: 600,
                  }}
                >
                  Reconectando sessão <b>{qrReconnectInfo.session}</b>...
                </p>
              </div>

              {qrReconnectInfo.number && (
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, var(--success) 0%, #059669 100%)",
                    color: "white",
                    padding: "12px 20px",
                    borderRadius: "12px",
                    marginBottom: "20px",
                    textAlign: "center",
                  }}
                >
                  <h4
                    style={{
                      color: "white",
                      margin: 0,
                      fontSize: "16px",
                      fontWeight: 700,
                    }}
                  >
                    📱 {formatBRPhone(qrReconnectInfo.number)}
                  </h4>
                </div>
              )}

              {qrReconnectInfo?.qrCode?.base64Image && (
                <div
                  style={{
                    background: "white",
                    padding: "20px",
                    borderRadius: "16px",
                    boxShadow: "var(--shadow-md)",
                    border: "2px solid var(--blue-200)",
                    marginBottom: "16px",
                  }}
                >
                  <img
                    src={qrReconnectInfo.qrCode.base64Image}
                    alt="QR Code WhatsApp"
                    style={{
                      width: 220,
                      height: 220,
                      margin: "0 auto",
                      display: "block",
                      borderRadius: "8px",
                    }}
                  />
                </div>
              )}

              <p
                style={{
                  fontSize: 13,
                  marginTop: 12,
                  color: "var(--blue-600)",
                  background:
                    "linear-gradient(135deg, var(--blue-50) 0%, var(--blue-100) 100%)",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  border: "1px solid var(--blue-200)",
                }}
              >
                {qrReconnectInfo.number
                  ? "📱 Escaneie o QR Code com este número no WhatsApp"
                  : "⏳ Aguardando QR Code..."}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div
        className="w-100"
        style={{ height: "calc(100vh - 56px)", padding: "0" }}
      >
        <div className="w-100 h-100">
          <div
            className={`card ${styles.chatContainer}`}
            style={{ height: "100%", margin: 0 }}
          >
            <div
              className="card-body p-0 d-flex flex-row"
              style={{
                flexDirection: "row",
                display: "flex",
                flexWrap: "nowrap",
                height: "100%",
              }}
            >
              {/* Overlay para mobile */}
              {isMobileSidebarOpen && (
                <div
                  className="position-fixed w-100 h-100"
                  style={{
                    top: 0,
                    left: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    zIndex: 998,
                  }}
                  onClick={() => setIsMobileSidebarOpen(false)}
                />
              )}

              {/* Lista de Chats - Lado Esquerdo (Sidebar) */}
              <div
                className={`${styles.chatSidebar} ${
                  isMobileSidebarOpen ? styles.mobileOpen : ""
                }`}
              >
                {/* Header da sidebar com botão de fechar para mobile */}
                <div
                  className="d-flex justify-content-between align-items-center"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--primary-blue) 0%, var(--blue-600) 100%)",
                    padding: "8px 12px",
                    borderRadius: "0 0 8px 8px",
                    boxShadow: "var(--shadow-sm)",
                    borderBottom: "1px solid var(--blue-700)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: "18px",
                        height: "18px",
                        background: "rgba(255, 255, 255, 0.2)",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "8px",
                      }}
                    >
                      💬
                    </div>
                    <div>
                      <h6
                        className="mb-0 fw-bold"
                        style={{
                          color: "white",
                          fontSize: "12px",
                          margin: 0,
                          lineHeight: "1.1",
                        }}
                      >
                        Conversas
                      </h6>
                      <small
                        style={{
                          color: "rgba(255, 255, 255, 0.7)",
                          fontSize: "8px",
                          lineHeight: "1.1",
                        }}
                      >
                        Gerencie suas conversas
                      </small>
                    </div>
                  </div>
                </div>

                {/* Campo de busca */}
                <div
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid var(--blue-200)",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Buscar conversas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: "6px",
                      border: "1px solid var(--blue-200)",
                      background: "white",
                      fontSize: "11px",
                      fontWeight: "500",
                      color: "var(--gray-800)",
                      transition: "all 0.3s ease",
                      boxShadow: "var(--shadow-sm)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--primary-blue)";
                      e.currentTarget.style.boxShadow = "var(--shadow-md)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--blue-200)";
                      e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                    }}
                  />
                </div>

                {/* Dropdowns Colapsáveis */}
                <div
                  style={{
                    background: "white",
                    borderBottom: "1px solid var(--blue-200)",
                  }}
                >
                  {/* Dropdown Conexões */}
                  <div
                    style={{
                      borderBottom: "1px solid var(--blue-100)",
                    }}
                  >
                    <button
                      onClick={() =>
                        setShowConnectionsDropdown(!showConnectionsDropdown)
                      }
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "6px 8px",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "10px",
                        fontWeight: "600",
                        color: "var(--primary-blue)",
                        transition: "all 0.3s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <span style={{ fontSize: "8px" }}>🔗</span>
                        <span>Conexões</span>
                      </div>
                      <span
                        style={{
                          fontSize: "8px",
                          transform: showConnectionsDropdown
                            ? "rotate(180deg)"
                            : "rotate(0deg)",
                          transition: "transform 0.3s ease",
                        }}
                      >
                        ▼
                      </span>
                    </button>
                    {showConnectionsDropdown && (
                      <div
                        style={{
                          padding: "0 8px 8px 8px",
                        }}
                      >
                        <select
                          value={selectedSession}
                          onChange={(e) => setSelectedSession(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "4px 6px",
                            borderRadius: "4px",
                            border: "1px solid var(--blue-200)",
                            background: "white",
                            fontSize: "9px",
                            fontWeight: "500",
                            color: "var(--primary-blue)",
                            cursor: "pointer",
                          }}
                        >
                          <option value="">Todas as sessões</option>
                          {[...new Set(chats.map((chat) => chat.sessionName))]
                            .filter(Boolean)
                            .map((session) => (
                              <option key={session} value={session}>
                                {session}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
                <div
                  className={`list-group list-group-flush ${styles.chatList}`}
                  style={{
                    maxHeight: "calc(100vh - 200px)",
                    overflowY: "auto",
                    overflowX: "hidden",
                  }}
                >
                  {chatsFilteredBySession.map((chat) => (
                    <div
                      key={chat.id}
                      className={`list-group-item list-group-item-action border-0 ${
                        styles.chatListItem
                      } ${selectedChat?.id === chat.id ? styles.active : ""}`}
                      onClick={() => {
                        console.log("🎯 Chat selecionado:", chat);
                        setSelectedChat(chat);
                        // Fechar sidebar no mobile ao selecionar chat
                        if (isMobile) {
                          setIsMobileSidebarOpen(false);
                        }
                      }}
                    >
                      <div className="d-flex align-items-start">
                        <div className={styles.chatAvatarContainer}>
                          {chat.contact?.avatarUrl ? (
                            <img
                              src={chat.contact.avatarUrl}
                              alt={chat.contact?.name || "Contato"}
                              className={styles.contactAvatar}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const nextSibling =
                                  target.nextSibling as HTMLElement;
                                if (nextSibling) {
                                  nextSibling.style.display = "flex";
                                }
                              }}
                            />
                          ) : null}
                          <div
                            className={styles.chatAvatar}
                            style={{
                              backgroundColor: "#25D366",
                              display: chat.contact?.avatarUrl
                                ? "none"
                                : "flex",
                            }}
                          >
                            📱
                          </div>
                          <h6
                            className="mb-0 fw-semibold"
                            style={{
                              fontSize: "12px",
                            }}
                          >
                            {chat.contact?.name || "Sem nome"}
                          </h6>

                          {/* Nome da sessão */}
                          <small
                            className="text-muted"
                            style={{
                              fontSize: "9px",
                              fontWeight: "500",
                              color: "#25D366",
                            }}
                          >
                            📱 {chat.sessionName || "(sem sessão)"}
                          </small>

                          {chat.lastMessage && (
                            <small
                              className="text-muted ms-2"
                              style={{
                                color: "#000000",
                                fontWeight: "500",
                                fontSize: "9px",
                              }}
                            >
                              {formatTime(chat.lastMessage.timestamp)}
                            </small>
                          )}
                        </div>
                        <div className="flex-grow-1 ms-3">
                          {chat.lastMessage && (
                            <p
                              className="mb-0 text-muted small mt-1"
                              style={{
                                fontSize: "10px",
                              }}
                            >
                              {chat.lastMessage.text &&
                              chat.lastMessage.text.length > 40
                                ? chat.lastMessage.text.substring(0, 40) + "..."
                                : chat.lastMessage.text}
                              <span
                                className={`badge badge-sm me-1 ${
                                  styles.badgeHover
                                } ${
                                  chat.lastMessage.direction === "outbound"
                                    ? "bg-success"
                                    : "bg-success"
                                }`}
                                style={{
                                  paddingLeft: "5px",
                                  color:
                                    chat.lastMessage.direction === "outbound"
                                      ? "green"
                                      : "#25D366",
                                  backgroundColor:
                                    chat.lastMessage.direction === "outbound"
                                      ? ""
                                      : "transparent",
                                }}
                              >
                                {chat.lastMessage.direction === "outbound"
                                  ? "Enviada"
                                  : "●"}
                              </span>
                            </p>
                          )}
                          {chat.tags && chat.tags.length > 0 && (
                            <div className="mt-1">
                              {chat.tags.map((tag) => (
                                <span
                                  key={tag.id}
                                  className="badge me-1"
                                  style={{
                                    backgroundColor: tag.color,
                                    fontSize: "7px",
                                    color: "white",
                                    padding: "1px 3px",
                                    borderRadius: "3px",
                                  }}
                                >
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {chats.length === 0 && (
                  <div
                    className={styles.emptyState}
                    style={{ height: "300px" }}
                  >
                    <div className={styles.emptyIcon}>📱</div>
                    <p className={styles.emptyDescription}>
                      Nenhuma conversa do WhatsApp encontrada
                    </p>
                  </div>
                )}

                {chats.length > 0 && chatsFilteredBySession.length === 0 && (
                  <div
                    className={styles.emptyState}
                    style={{ height: "300px" }}
                  >
                    <div className={styles.emptyIcon}>
                      {selectedTagFilter
                        ? selectedTagFilter === "no-tags"
                          ? "🚫"
                          : "🏷️"
                        : "🔍"}
                    </div>
                    <p className={styles.emptyDescription}>
                      Nenhuma conversa encontrada com os filtros aplicados
                    </p>
                    <button
                      className="btn btn-sm btn-outline-primary mt-2"
                      onClick={() => {
                        setSelectedTagFilter("");
                        setSelectedSession("");
                      }}
                    >
                      Limpar todos os filtros
                    </button>
                    <p className="text-muted mt-2" style={{ fontSize: "11px" }}>
                      Ou pressione <kbd>Esc</kbd> para limpar os filtros
                    </p>
                  </div>
                )}
              </div>

              {/* Área de Mensagens - Lado Direito */}
              <div
                className={`${styles.messageArea} ${
                  isMobileSidebarOpen && isMobile ? styles.sidebarOpen : ""
                }`}
              >
                {selectedChat ? (
                  <>
                    <div className={styles.messageHeader}>
                      <div
                        className="d-flex align-items-center justify-content-between w-100"
                        style={{
                          minHeight: "60px",
                          display: "flex",
                          justifyContent: "space-between",
                          width: "100%",
                          alignItems: "center",
                        }}
                      >
                        <div
                          className="d-flex align-items-center"
                          style={{
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          {/* Botão de voltar para mobile */}
                          <button
                            className="btn btn-sm btn-outline-secondary d-md-none me-2"
                            onClick={() => {
                              setSelectedChat(null);
                              setIsMobileSidebarOpen(true);
                            }}
                            style={{
                              padding: "4px 8px",
                              fontSize: "12px",
                            }}
                          >
                            <i className="fe fe-arrow-left"></i>
                          </button>
                          <div className={styles.chatAvatarContainer}>
                            {selectedChat.contact?.avatarUrl ? (
                              <img
                                src={selectedChat.contact.avatarUrl}
                                alt={selectedChat.contact?.name || "Contato"}
                                className={styles.contactAvatar}
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  marginRight: "12px",
                                }}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                  const nextSibling =
                                    target.nextSibling as HTMLElement;
                                  if (nextSibling) {
                                    nextSibling.style.display = "flex";
                                  }
                                }}
                              />
                            ) : null}

                            <div
                              className={styles.chatAvatar}
                              style={{
                                backgroundColor: "#25D366",
                                width: "40px",
                                height: "40px",
                                fontSize: "16px",
                                marginRight: "12px",
                                display: selectedChat.contact?.avatarUrl
                                  ? "none"
                                  : "flex",
                              }}
                            >
                              📱
                            </div>
                          </div>
                          <div>
                            <div className="d-flex align-items-center gap-2">
                              <h6 className="mb-0">
                                {selectedChat.contact?.name || "Sem nome"}
                              </h6>
                            </div>
                            <small
                              className="text-muted"
                              style={{
                                color: "#000000",
                              }}
                            >
                              {formatBRPhone(selectedChat.contact?.phone) ||
                                "Sem telefone"}
                            </small>
                          </div>
                        </div>
                        {/* SWITCH MODO IA */}
                        <div
                          className={styles.aiSwitch}
                          onClick={() => setAiMode(!aiMode)}
                        >
                          <div
                            className={`${styles.switchTrack} ${
                              aiMode ? styles.active : ""
                            }`}
                          >
                            <div className={styles.switchThumb}></div>
                          </div>

                          <span
                            className={`${styles.switchLabel} ${
                              aiMode ? styles.active : ""
                            }`}
                          >
                            {aiMode ? "AI ON" : "AI OFF"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.messagesContainer}>
                      {messagesLoading ? (
                        <div className="text-center">
                          <div className="spinner-border spinner-border-sm text-primary">
                            <span className="visually-hidden">
                              Carregando mensagens...
                            </span>
                          </div>
                        </div>
                      ) : messages.length > 0 ? (
                        messages.map((message, index) => (
                          <div key={message.id} className={styles.messageGroup}>
                            {/* Separador de data */}
                            {(index === 0 ||
                              formatDate(message.timestamp) !==
                                formatDate(messages[index - 1].timestamp)) && (
                              <div className={styles.dateSeparator}>
                                <span className={styles.dateLabel}>
                                  {formatDate(message.timestamp)}
                                </span>
                              </div>
                            )}

                            <div
                              className={`${styles.messageWrapper} ${
                                message.direction === "outbound"
                                  ? styles.outbound
                                  : styles.inbound
                              }`}
                            >
                              <div
                                className={`${styles.messageBubble} ${
                                  message.direction === "outbound"
                                    ? styles.outbound
                                    : styles.inbound
                                }`}
                              >
                                {/* Mensagem de Áudio */}
                                {(message.type === "audio" ||
                                  message.type === "ptt") &&
                                (message.mediaUrl || message.body) ? (
                                  <div className={styles.audioMessage}>
                                    <div className="d-flex align-items-center gap-2">
                                      <i
                                        className="fe fe-volume-2"
                                        style={{
                                          fontSize: "18px",
                                          color: "#25D366",
                                        }}
                                      ></i>
                                      <div className="flex-grow-1">
                                        <audio
                                          controls
                                          style={{
                                            width: "100%",
                                            height: "32px",
                                            maxWidth: "200px",
                                          }}
                                        >
                                          <source
                                            src={
                                              message.mediaUrl || message.body
                                            }
                                            type="audio/ogg"
                                          />
                                          <source
                                            src={
                                              message.mediaUrl || message.body
                                            }
                                            type="audio/mpeg"
                                          />
                                          <source
                                            src={
                                              message.mediaUrl || message.body
                                            }
                                            type="audio/wav"
                                          />
                                          Seu navegador não suporta áudio.
                                        </audio>
                                      </div>
                                    </div>
                                  </div>
                                ) : message.type === "document" &&
                                  (message.mediaUrl || message.body) ? (
                                  /* Mensagem de Documento */
                                  <div className={styles.documentMessage}>
                                    <div className={styles.documentContainer}>
                                      <div className={styles.documentIcon}>
                                        <i className="fe fe-file-text"></i>
                                      </div>
                                      <div className={styles.documentInfo}>
                                        <div className={styles.documentName}>
                                          {message.fileName || "Documento"}
                                        </div>
                                        <div className={styles.documentType}>
                                          {message.mimetype ||
                                            "application/octet-stream"}
                                        </div>
                                      </div>
                                      <a
                                        href={
                                          (
                                            message.mediaUrl || message.body
                                          )?.includes("mmg.whatsapp.net")
                                            ? `/api/whatsapp/proxy-image?url=${encodeURIComponent(
                                                (message.mediaUrl ||
                                                  message.body) as string
                                              )}`
                                            : message.mediaUrl || message.body
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.documentDownload}
                                        title="Baixar documento"
                                      >
                                        <i className="fe fe-download"></i>
                                      </a>
                                    </div>
                                    {message.caption && (
                                      <p className={styles.documentCaption}>
                                        {message.caption}
                                      </p>
                                    )}
                                  </div>
                                ) : message.mediaType === "document" &&
                                  message.body &&
                                  message.mimetype === "application/pdf" ? (
                                  <iframe
                                    src={
                                      isMounted
                                        ? URL.createObjectURL(
                                            base64ToBlob(
                                              message.body,
                                              message.mimetype
                                            )
                                          )
                                        : ""
                                    }
                                    width="100%"
                                    height="400"
                                    style={{
                                      border: "1px solid #ccc",
                                      borderRadius: "4px",
                                      marginTop: "8px",
                                    }}
                                    title={message.fileName || "PDF"}
                                  />
                                ) : message.type === "image" &&
                                  (message.mediaUrl || message.body) ? (
                                  /* Mensagem de Imagem */
                                  <div className={styles.imageMessage}>
                                    <div className={styles.imageContainer}>
                                      <img
                                        src={
                                          (
                                            message.mediaUrl || message.body
                                          )?.includes("mmg.whatsapp.net")
                                            ? `/api/whatsapp/proxy-image?url=${encodeURIComponent(
                                                (message.mediaUrl ||
                                                  message.body) as string
                                              )}`
                                            : message.mediaUrl || message.body
                                        }
                                        alt={message.caption || "Imagem"}
                                        onError={(e) => {
                                          const target =
                                            e.target as HTMLImageElement;
                                          target.style.display = "none";
                                          const nextSibling =
                                            target.nextSibling as HTMLElement;
                                          if (nextSibling) {
                                            nextSibling.style.display = "flex";
                                          }
                                        }}
                                        className={styles.messageImage}
                                        style={{
                                          maxWidth: "100%",
                                          maxHeight: "300px",
                                          borderRadius: "8px",
                                          objectFit: "cover",
                                        }}
                                      />
                                    </div>
                                    {message.caption && (
                                      <p className={styles.imageCaption}>
                                        {message.caption}
                                      </p>
                                    )}
                                  </div>
                                ) : message.type === "video" &&
                                  (message.mediaUrl || message.body) ? (
                                  /* Mensagem de Vídeo */
                                  <div className={styles.videoMessage}>
                                    <div className={styles.videoContainer}>
                                      <video
                                        src={
                                          (
                                            message.mediaUrl || message.body
                                          )?.includes("mmg.whatsapp.net")
                                            ? `/api/whatsapp/proxy-image?url=${encodeURIComponent(
                                                (message.mediaUrl ||
                                                  message.body) as string
                                              )}`
                                            : message.mediaUrl || message.body
                                        }
                                        controls
                                        className={styles.messageVideo}
                                        style={{
                                          maxWidth: "100%",
                                          maxHeight: "300px",
                                          borderRadius: "8px",
                                        }}
                                        onError={(e) => {
                                          const target =
                                            e.target as HTMLVideoElement;
                                          target.style.display = "none";
                                          const nextSibling =
                                            target.nextSibling as HTMLElement;
                                          if (nextSibling) {
                                            nextSibling.style.display = "flex";
                                          }
                                        }}
                                      />
                                      <div
                                        className={styles.videoError}
                                        style={{
                                          display: "none",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          padding: "20px",
                                          backgroundColor: "#f8f9fa",
                                          borderRadius: "8px",
                                          border: "1px solid #dee2e6",
                                          color: "#6c757d",
                                          fontSize: "14px",
                                        }}
                                      >
                                        <i className="fe fe-video me-2"></i>
                                        Vídeo não disponível
                                      </div>
                                    </div>
                                    {message.caption && (
                                      <p className={styles.videoCaption}>
                                        {message.caption}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  /* Mensagem de Texto */
                                  <p className={styles.messageText}>
                                    {message.text ||
                                      message.caption ||
                                      "Mensagem sem conteúdo"}
                                  </p>
                                )}

                                <div className={styles.messageFooter}>
                                  <small className={styles.messageTime}>
                                    {formatTime(message.timestamp)}
                                  </small>
                                  {message.direction === "outbound" && (
                                    <span className={styles.messageStatus}>
                                      ✓✓
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className={styles.emptyState}>
                          <div className={styles.emptyIcon}>📝</div>
                          <p className={styles.emptyDescription}>
                            Nenhuma mensagem encontrada
                          </p>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    {/* Notificação de Sucesso */}
                    {showSuccessMessage && (
                      <div
                        className="alert alert-success alert-dismissible fade show mx-3 mb-0"
                        style={{
                          borderRadius: "8px 8px 0 0",
                          fontSize: "14px",
                          padding: "8px 12px",
                        }}
                      >
                        <i className="fe fe-check-circle me-2"></i>
                        Mensagem enviada com sucesso!
                      </div>
                    )}

                    {/* Indicador de gravação */}
                    {isRecording && (
                      <div
                        className="alert alert-warning mx-3 mb-0"
                        style={{
                          borderRadius: "8px 8px 0 0",
                          fontSize: "14px",
                          padding: "8px 12px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <div
                          className="spinner-border spinner-border-sm"
                          role="status"
                          style={{
                            width: "16px",
                            height: "16px",
                          }}
                        >
                          <span className="visually-hidden">Gravando...</span>
                        </div>
                        <span>
                          Gravando áudio... {formatRecordingTime(recordingTime)}
                        </span>
                        <button
                          className="btn btn-sm btn-outline-danger ms-auto"
                          onClick={cancelRecording}
                          style={{
                            padding: "2px 8px",
                            fontSize: "12px",
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                    {/* Área de Envio de Mensagem */}
                    <div className={styles.messageInputArea}>
                      {/* Container principal do input */}
                      <div className={styles.inputContainer}>
                        <textarea
                          ref={messageInputRef}
                          className={styles.messageInput}
                          placeholder="Digite sua mensagem..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          disabled={sending}
                          rows={1}
                        />

                        {/* Botão de envio */}
                        <button
                          className={styles.sendButton}
                          onClick={() => sendMessage()}
                          disabled={
                            !newMessage.trim() ||
                            sending ||
                            sendingAudio ||
                            isRecording
                          }
                        >
                          {sending ? (
                            <div
                              className="spinner-border spinner-border-sm"
                              role="status"
                            />
                          ) : (
                            <Send size={isMobile ? 18 : 18} />
                          )}
                        </button>

                        {/* Botões de mídia - lado direito em desktop */}
                        {!isMobile && (
                          <>
                            <label
                              className={styles.audioButton}
                              title="Enviar imagem"
                            >
                              <ImageIcon size={20} />
                              <input
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) sendImage(file);
                                  e.target.value = "";
                                }}
                              />
                            </label>
                            <label
                              className={styles.audioButton}
                              title="Enviar documento PDF"
                            >
                              <FileText size={20} />
                              <input
                                type="file"
                                accept="application/pdf"
                                hidden
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file && selectedChat) {
                                    try {
                                      const result = await enviarPDF(
                                        selectedChat.chatId,
                                        selectedChat.sessionName,
                                        file
                                      );
                                      console.log(
                                        "📄 Resultado envio PDF:",
                                        result
                                      );

                                      if (result.success) {
                                        fetchMessages(
                                          selectedChat.id,
                                          selectedChat.sessionName,
                                          false
                                        );
                                        fetchChats(false, false);
                                        setShowSuccessMessage(true);
                                        setTimeout(
                                          () => setShowSuccessMessage(false),
                                          2000
                                        );
                                      } else {
                                        alert(
                                          `Erro ao enviar PDF: ${
                                            result.error || result.details
                                          }`
                                        );
                                      }
                                    } catch (err) {
                                      console.error(
                                        "❌ Erro ao enviar PDF:",
                                        err
                                      );
                                      alert("Erro de conexão ao enviar PDF.");
                                    }
                                  }
                                  e.target.value = "";
                                }}
                              />
                            </label>
                            <label
                              className={styles.audioButton}
                              title="Enviar vídeo"
                            >
                              <Video size={20} />
                              <input
                                type="file"
                                accept="video/*"
                                hidden
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file && selectedChat) {
                                    try {
                                      const result = await enviarVideo(
                                        selectedChat.chatId,
                                        selectedChat.sessionName,
                                        file
                                      );
                                      console.log(
                                        "🎥 Resultado envio vídeo:",
                                        result
                                      );

                                      if (result.success) {
                                        fetchMessages(
                                          selectedChat.id,
                                          selectedChat.sessionName,
                                          false
                                        );
                                        fetchChats(false, false);
                                        setShowSuccessMessage(true);
                                        setTimeout(
                                          () => setShowSuccessMessage(false),
                                          2000
                                        );
                                      } else {
                                        alert(
                                          `Erro ao enviar vídeo: ${
                                            result.error || result.details
                                          }`
                                        );
                                      }
                                    } catch (err) {
                                      console.error(
                                        "❌ Erro ao enviar vídeo:",
                                        err
                                      );
                                      alert("Erro de conexão ao enviar vídeo.");
                                    }
                                  }
                                  e.target.value = "";
                                }}
                              />
                            </label>
                            <button
                              className={`${styles.audioButton} ${
                                isRecording ? styles.recording : ""
                              }`}
                              onClick={
                                isRecording ? stopRecording : startRecording
                              }
                              disabled={sending || sendingAudio}
                              title={
                                isRecording ? "Parar gravação" : "Gravar áudio"
                              }
                            >
                              {isRecording ? (
                                <StopCircle size={20} />
                              ) : (
                                <Mic size={20} />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div
                    className="d-flex flex-column align-items-center justify-content-center h-100"
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      minHeight: "400px",
                    }}
                  >
                    <div style={{ fontSize: "64px", marginBottom: "1rem" }}>
                      💬
                    </div>
                    <h5
                      style={{
                        color: "var(--gray-600)",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Selecione uma conversa
                    </h5>
                    <p style={{ color: "var(--gray-500)", fontSize: "14px" }}>
                      {isMobile
                        ? "Toque em uma conversa para começar a conversar"
                        : "Escolha uma conversa da lista ao lado para começar"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

WhatsAppChats.layout = "Contentlayout";

export default WhatsAppChats;
