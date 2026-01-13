import { uploadBase64ToFirebase } from "@/lib/upload";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import mime from "mime-types";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();
function normalizePhone(phone: string): string {
  if (!phone) return "";

  // remove tudo que não for número
  let normalized = phone.replace(/\D/g, "");

  // remove o sufixo do WhatsApp se tiver (@c.us ou @g.us)
  normalized = normalized.replace(/(@c\.us|@g\.us)$/i, "");

  // regra para números brasileiros: se começar com 55 e tiver 13 dígitos,
  // normaliza para 13 dígitos (DDI + DDD + número com 9)
  if (normalized.startsWith("55")) {
    if (normalized.length === 12) {
      // adiciona o 9 na frente do número se faltar
      normalized = normalized.slice(0, 4) + "9" + normalized.slice(4);
    }
  }

  return normalized;
}

function normalizeChatId(chatId?: string, sessionId?: string): string {
  if (!chatId) return "";

  const isGroup = chatId.endsWith("@g.us");
  const isUser = chatId.endsWith("@c.us");

  // remove sufixo
  let raw = chatId.replace(/(@c\.us|@g\.us)$/i, "");

  // normaliza como se fosse número de telefone
  raw = normalizePhone(raw);

  if (isGroup) return `${raw}@g.us-${sessionId}`;
  if (isUser) return `${raw}@c.us-${sessionId}`;

  return raw; // fallback se vier algo diferente
}

/* ----------------------- helpers de JID/Grupo ----------------------- */
function getSenderJid(msg: any): string | null {
  return msg?.sender?.id || msg?.author || msg?.from || null;
}
function isGroupJid(jidOrFrom?: string) {
  return Boolean(jidOrFrom && String(jidOrFrom).endsWith("@g.us"));
}
function parseJid(jid?: string): { phone: string | null; isGroup: boolean } {
  if (!jid) return { phone: null, isGroup: false };
  const isGroup = jid.endsWith("@g.us");
  if (isGroup) {
    // para grupos, usamos o próprio JID como “phone”
    return { phone: jid, isGroup: true };
  }
  const at = jid.indexOf("@");
  const phone = at > 0 ? jid.slice(0, at) : jid;
  return { phone, isGroup: false };
}

/* ----------------------- in-flight guard ----------------------- */
const g = globalThis as any;
g.__inFlightMsgs ??= new Set<string>();
export const inFlight: Set<string> = g.__inFlightMsgs;

/* ----------------------- upload/cache de avatar ----------------------- */
async function cacheAvatarToStorage(
  avatarUrl: string,
  jid: string,
  session: string
): Promise<string> {
  const resp = await axios.get<ArrayBuffer>(avatarUrl, {
    responseType: "arraybuffer",
  });
  const contentType = resp.headers["content-type"] || "image/jpeg";
  const ext = (mime.extension(contentType) || "jpg").toString();
  const base64 = Buffer.from(resp.data).toString("base64");
  const objectPath = `whatsapp/${session}/avatars/${encodeURIComponent(
    jid
  )}.${ext}`;
  const publicUrl = await uploadBase64ToFirebase(
    base64,
    objectPath,
    contentType
  );
  return publicUrl; // string (estável)
}

function normalizeMime(m?: string) {
  if (!m) return "";
  return m.split(";")[0].trim().toLowerCase(); // "audio/ogg; codecs=opus" -> "audio/ogg"
}

/* ----------------------- util de mime -> ext ----------------------- */
function extFromMime(m?: string, fallback = "bin") {
  const mt = normalizeMime(m);
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "audio/ogg": "ogg",
    "audio/opus": "ogg", // alguns backends mandam "audio/opus"
    "audio/mpeg": "mp3",
    "application/pdf": "pdf",
  };
  if (mt && map[mt]) return map[mt];
  if (mt && mt.includes("/")) {
    const sub = mt.split("/")[1].toLowerCase();
    return sub.replace("jpeg", "jpg");
  }
  return fallback;
}

function safeName(name: string) {
  return name.replace(/[^a-z0-9._-]/gi, "_");
}

/* ----------------------- baixa mídia do seu backend WPP ----------------------- */
async function fetchMediaBase64(
  sessionName: string,
  messageId: string
): Promise<{ base64: string; mimetype: string }> {
  const base = process.env.BACKEND_WPP_CONNECT;
  if (!base) throw new Error("BACKEND_WPP_CONNECT não configurado");

  const url = `${base}/${encodeURIComponent(sessionName)}/download-media`;
  const resp = await axios.post(url, { messageId });

  if (!resp.data?.status) {
    throw new Error(
      `download-media falhou: ${resp.data?.reason || "unknown"} - ${
        resp.data?.message || ""
      }`
    );
  }
  const base64 = resp.data?.data as string;
  const mimetype = resp.data?.mimetype as string;
  if (!base64) throw new Error("download-media retornou base64 vazio");

  return { base64, mimetype };
}

/* ----------------------- PROCESSADORES ----------------------- */
export async function processReceivedMessage(
  message: any,
  sessionName: string,
  sessionId: string
) {
  try {
    console.log("📥 Processando mensagem recebida...");

    const userIdFromSession = await prisma.whatsAppSession.findUnique({
      where: { sessionName },
      select: { userId: true, id: true },
    });

    const {
      id: messageId,
      chatId,
      from,
      fromMe,
      timestamp,
      type,
      body,
      quotedMsgId,
      isGroupMsg,
      author,
      isForwarded,
      isStatus,
      sender,
      caption,
    } = message;

    if (!messageId || !from) {
      console.log("❌ Dados obrigatórios ausentes na mensagem");
      return;
    }

    if (inFlight.has(messageId)) {
      console.log("⏭️ Mensagem já em processamento, pulando:", messageId);
      return;
    }
    inFlight.add(messageId);

    const phoneNumber = normalizePhone(from);
    const chatIdNormalized = normalizeChatId(
      chatId || `${phoneNumber}@c.us`,
      userIdFromSession?.id
    );
    const isGroupChat = chatIdNormalized.endsWith("@g.us");

    // contato (cria/atualiza)
    let contact = await prisma.whatsAppContact.findFirst({
      where: {
        phone: phoneNumber,
        session: { userId: userIdFromSession?.userId ?? "" },
      },
    });

    const stableAvatar =
      sender?.profilePicUrlStable || sender?.profilePicThumbObj?.eurl || null;
    const contactName = sender?.pushname || sender?.name || null;
    const lastDate = new Date(
      (timestamp || Math.floor(Date.now() / 1000)) * 1000
    );

    if (!contact) {
      contact = await prisma.whatsAppContact.create({
        data: {
          phone: phoneNumber,
          formattedPhone: from,
          name: contactName,
          profilePic: stableAvatar,
          isGroup: isGroupChat,
          sessionId,
          lastMessageAt: lastDate,
        },
      });
      console.log(`✅ Novo contato criado: ${phoneNumber}`);
    } else {
      await prisma.whatsAppContact.update({
        where: { id: contact.id },
        data: {
          lastMessageAt: lastDate,
          name: contactName ?? contact.name,
          profilePic: stableAvatar ?? contact.profilePic,
          isGroup: isGroupChat,
        },
      });
    }

    if (!isGroupChat) {
      const existingLead = await prisma.lead.findFirst({
        where: { 
          phone: phoneNumber,
          deletedAt: null, // Não considerar leads deletados
        },
      });

      if (!existingLead) {
        await prisma.lead.create({
          data: {
            name: contactName || phoneNumber,
            phone: phoneNumber,
            email: null,
            ocupation: "whatsapp",
            potentialValue: "0",
            observations: "Lead criado automaticamente via mensagem recebida",
            status: "novos_leads",
            createdBy: userIdFromSession?.userId ?? undefined,
          },
        });
        console.log(`📝 Lead criado para ${phoneNumber}`);
      }
    }

    if (!timestamp) {
      console.log("❌ Timestamp ausente na mensagem");
      return;
    }

    // mídia (se houver)
    let mediaUrl: string | null = null;
    let mediaType: string | null = null;
    let fileName: string | null = null;

    console.log(`🔍 Tipo: ${type}`);
    // console.log(`🔍 Estrutura:`, JSON.stringify(message, null, 2)); // pode habilitar se precisar

    const shouldDownload =
      type &&
      type !== "chat" &&
      ["image", "video", "audio", "ptt", "document"].includes(type);

    if (shouldDownload) {
      try {
        const { base64, mimetype } = await fetchMediaBase64(
          sessionName,
          messageId
        );

        mediaType = type === "ptt" ? "audio" : type;

        const fallback: "jpg" | "mp4" | "ogg" | "pdf" | "bin" | "mp3" =
          type === "image"
            ? "jpg"
            : type === "video"
            ? "mp4"
            : type === "audio" || type === "ptt"
            ? "ogg"
            : type === "document"
            ? "pdf"
            : type === "somethingThatCanBeMp3" // se tiver um caso que de fato gere mp3
            ? "mp3"
            : "bin";

        const cleanMime = normalizeMime(mimetype);

        const effectiveMime =
          cleanMime === "audio/opus"
            ? "audio/ogg"
            : cleanMime ||
              (fallback === "ogg"
                ? "audio/ogg"
                : fallback === "mp3"
                ? "audio/mpeg"
                : "");

        const ext = extFromMime(effectiveMime, fallback);
        fileName = safeName(`${mediaType}_${timestamp}.${ext}`);

        mediaUrl = await uploadBase64ToFirebase(
          base64,
          fileName,
          effectiveMime || "application/octet-stream"
        );

        console.log(`☁️ Upload ok → ${mediaUrl} (mime=${mimetype})`);
      } catch (e: any) {
        console.error("⚠️ Falha ao baixar/uploadar mídia:", e?.message || e);
      }
    }

    // salva/upserta mensagem
    const messageData = {
      messageId,
      chatId: chatIdNormalized,
      sessionId,
      contactId: contact.id,
      contactPhone: phoneNumber,
      fromMe: fromMe || false,
      timestamp: new Date(timestamp * 1000),
      type: type || "text",
      body: body || caption || null,
      quotedMsgId: quotedMsgId || null,
      mediaUrl,
      mediaType,
      fileName,
      caption: caption || null,
      isForwarded: isForwarded || false,
      isStatus: isStatus || false,
      isGroupMsg: isGroupMsg || false,
      author: author || null,
    };

    await prisma.whatsAppMessage.upsert({
      where: { messageId },
      create: messageData,
      update: {
        mediaUrl: messageData.mediaUrl ?? undefined,
        mediaType: messageData.mediaType ?? undefined,
        fileName: messageData.fileName ?? undefined,
        caption: messageData.caption ?? undefined,
        body: messageData.body ?? undefined,
        timestamp: messageData.timestamp ?? undefined,
      },
    });

    console.log(`✅ Mensagem salva/atualizada: ${messageId} de ${phoneNumber}`);
  } catch (error) {
    console.error("❌ Erro ao processar mensagem recebida:", error);
    throw error;
  } finally {
    try {
      if (message?.id) inFlight.delete(message.id);
    } catch {}
  }
}

async function processSentMessage(
  message: any,
  telnumber: string | undefined,
  result: any,
  sessionId: string,
  sessionName: string
) {
  try {
    console.log("📤 Processando mensagem enviada...", {
      typeofMessage: typeof message,
    });

    // 🔒 normaliza número (apenas dígitos)
    const phoneNumber = normalizePhone(telnumber || "");
    if (!phoneNumber) {
      console.log('❌ Telefone ausente no evento "sent"');
      return;
    }
    const formattedPhone = normalizeChatId(`${phoneNumber}@c.us`, sessionId);

    let contact = await prisma.whatsAppContact.findFirst({
      where: { phone: phoneNumber, sessionId },
    });

    if (!contact) {
      contact = await prisma.whatsAppContact.create({
        data: {
          phone: phoneNumber,
          formattedPhone,
          sessionId,
          lastMessageAt: new Date(),
        },
      });
      console.log(`✅ Novo contato criado para envio: ${phoneNumber}`);
    } else {
      await prisma.whatsAppContact.update({
        where: { id: contact.id },
        data: { lastMessageAt: new Date() },
      });
    }

    const messageId =
      result?.id?.id || result?.id || `sent_${Date.now()}_${phoneNumber}`;

    // corpo/caption
    const bodyText =
      typeof message === "string"
        ? message
        : message?.caption ??
          message?.body ??
          message?.text ??
          result?.caption ??
          result?.body ??
          result?.text ??
          null;

    // tipo
    const rawType =
      (typeof message === "object" ? message?.type : undefined) ||
      result?.type ||
      (message?.filePath ? "video" : undefined); // fallback
    const type = rawType || "text";

    // ======== mídia enviada: usar diretamente o que veio do payload ========
    let mediaUrl: string | null = null;
    let mediaType: string | null = null;
    let fileName: string | null = null;

    if (type === "document") {
      fileName = message?.filename || result?.filename || "document.pdf";
      mediaUrl = message?.filePath || result?.filePath || null;
      mediaType = "document";
    } else if (type === "video") {
      fileName = message?.filename || result?.filename || "video.mp4";
      mediaUrl =
        message?.filePath || result?.videoPath || result?.filePath || null;
      mediaType = "video";
    } else if (type === "image") {
      fileName = message?.filename || result?.filename || "image.jpg";
      mediaUrl =
        message?.filePath || result?.imagePath || result?.filePath || null;
      mediaType = "image";
    } else if (type === "audio" || type === "ptt") {
      fileName = message?.filename || result?.filename || "audio.ogg";
      mediaUrl =
        message?.filePath || result?.audioPath || result?.filePath || null;
      mediaType = "audio";
    }

    // ⚠️ Se não veio URL de mídia no payload, opcionalmente tente baixar (nem sempre disponível)
    if (
      !mediaUrl &&
      ["image", "video", "audio", "ptt", "document"].includes(type)
    ) {
      try {
        const { base64, mimetype } = await fetchMediaBase64(
          sessionName,
          messageId
        );
        const cleanMime = (mimetype || "").split(";")[0].trim().toLowerCase();
        const ext = extFromMime(
          cleanMime,
          type === "video"
            ? "mp4"
            : type === "image"
            ? "jpg"
            : type === "audio" || type === "ptt"
            ? "ogg"
            : type === "document"
            ? "pdf"
            : "bin"
        );
        fileName = fileName || safeName(`${type}_${Date.now()}.${ext}`);
        mediaUrl = await uploadBase64ToFirebase(
          base64,
          fileName,
          cleanMime || "application/octet-stream"
        );
        mediaType = type === "ptt" ? "audio" : type;
      } catch (e: any) {
        console.error(
          "⚠️ Falha no fallback de download de mídia:",
          e?.message || e
        );
      }
    }

    await prisma.whatsAppMessage.create({
      data: {
        messageId,
        chatId: formattedPhone,
        sessionId,
        contactId: contact.id,
        contactPhone: phoneNumber,
        fromMe: true,
        timestamp: new Date(),
        type,
        body: bodyText,
        mediaUrl,
        mediaType,
        fileName,
      },
    });

    console.log(`✅ Mensagem enviada salva: ${messageId} para ${phoneNumber}`);
  } catch (error) {
    console.error("❌ Erro ao processar mensagem enviada:", error);
    throw error;
  }
}

/* ----------------------- ROTA POST ----------------------- */
export async function POST(request: NextRequest) {
  try {
    console.log("=== WEBHOOK WhatsApp RECEBIDO ===");
    const body = await request.json();
    console.log("Body:", JSON.stringify(body, null, 2));

    const { event, session, message, telnumber, result } = body as {
      event: string;
      session: string;
      message?: any;
      telnumber?: string;
      result?: any;
    };

    if (!event || !session) {
      console.log("❌ Dados incompletos no webhook");
      return NextResponse.json(
        { error: "Dados obrigatórios ausentes: event e session" },
        { status: 400 }
      );
    }

    // upsert da sessão
    const existing = await prisma.whatsAppSession.findUnique({
      where: { sessionName: session },
      select: { id: true },
    });

    const whatsappSession = existing
      ? await prisma.whatsAppSession.update({
          where: { sessionName: session },
          data: {
            connectionStatus: "CONNECTED",
            lastConnected: new Date(),
          },
        })
      : await prisma.whatsAppSession.create({
          data: {
            sessionName: session,
            connectionStatus: "CONNECTED",
            lastConnected: new Date(),
          },
        });

    // cache de avatar (somente no evento "received")
    if (event === "received" && message) {
      // 1) remetente
      const senderJid = getSenderJid(message) || undefined;
      const { phone: senderPhoneKey, isGroup: isSenderGroup } =
        parseJid(senderJid);
      const avatarEurl: string | undefined =
        message?.sender?.profilePicUrl ||
        message?.sender?.profilePicThumbObj?.eurl;
      const nameForDb: string | null =
        message?.sender?.name ?? message?.sender?.pushname ?? null;

      if (senderPhoneKey && avatarEurl) {
        try {
          const publicUrl = await cacheAvatarToStorage(
            avatarEurl,
            senderJid!,
            session
          );

          // anexa no payload para usar já no processReceivedMessage
          message.sender = {
            ...(message.sender || {}),
            profilePicUrlStable: publicUrl,
          };

          // contato (pessoa) via unique composta
          await prisma.whatsAppContact.upsert({
            where: {
              phone_sessionId: {
                phone: senderPhoneKey,
                sessionId: whatsappSession.id,
              },
            },
            update: {
              name: nameForDb ?? undefined,
              profilePic: publicUrl,
              isGroup: isSenderGroup,
              lastMessageAt: new Date(),
            },
            create: {
              phone: senderPhoneKey,
              formattedPhone: senderPhoneKey,
              name: nameForDb,
              profilePic: publicUrl,
              isGroup: isSenderGroup,
              sessionId: whatsappSession.id,
              lastMessageAt: new Date(),
            },
          });

          console.log("📷 Avatar cacheado do remetente →", {
            key: senderPhoneKey,
            publicUrl,
          });
        } catch (e: any) {
          console.error(
            "⚠️ Falha ao cachear avatar do remetente:",
            e?.message || e
          );
        }
      }

      // 2) grupo (se a mensagem veio de grupo)
      if (isGroupJid(message?.from)) {
        const groupJid = message.from as string;
        const { phone: groupKey } = parseJid(groupJid); // o próprio JID
        const groupAvatarEurl: string | undefined =
          message?.chat?.profilePicUrl;

        if (groupKey && groupAvatarEurl) {
          try {
            const groupUrl = await cacheAvatarToStorage(
              groupAvatarEurl,
              groupJid,
              session
            );

            // anexa no payload p/ front
            message.chat = {
              ...(message.chat || {}),
              profilePicUrlStable: groupUrl,
            };

            // salva grupo como contato (isGroup: true)
            await prisma.whatsAppContact.upsert({
              where: {
                phone_sessionId: {
                  phone: groupKey,
                  sessionId: whatsappSession.id,
                },
              },
              update: {
                profilePic: groupUrl,
                isGroup: true,
                name: message.chat?.name ?? undefined,
                lastMessageAt: new Date(),
              },
              create: {
                phone: groupKey,
                formattedPhone: groupKey,
                name: message.chat?.name ?? null,
                profilePic: groupUrl,
                isGroup: true,
                sessionId: whatsappSession.id,
                lastMessageAt: new Date(),
              },
            });

            console.log("👥 Avatar cacheado do grupo →", {
              groupKey,
              groupUrl,
            });
          } catch (e: any) {
            console.error(
              "⚠️ Falha ao cachear avatar do grupo:",
              e?.message || e
            );
          }
        }
      }
    }

    // delega processamento
    if (event === "received") {
      await processReceivedMessage(message, session, whatsappSession.id);
    } else if (event === "sent") {
      await processSentMessage(
        message,
        telnumber,
        result,
        whatsappSession.id,
        session
      );
    }

    console.log("========================");
    return NextResponse.json({
      success: true,
      message: `Webhook ${event} processado com sucesso`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("❌ Erro ao processar webhook:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        message: error?.message || "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
