import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { uploadBase64ToFirebase } from "@/lib/upload";

const prisma = new PrismaClient();
const WHATSAPP_SERVER_URL = process.env.BACKEND_WPP_CONNECT;

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const contactId = formData.get("contactId") as string;
    const sessionName = formData.get("sessionName") as string;
    const audioFile = formData.get("audio") as File | null;
    const audioUrl = formData.get("audioUrl") as string | null;

    if (!contactId || !sessionName || (!audioFile && !audioUrl)) {
      return NextResponse.json(
        {
          error:
            "contactId, sessionName e arquivo de áudio ou URL são obrigatórios",
        },
        { status: 400 }
      );
    }

    // 🔹 Busca contato
    const contact = await prisma.whatsAppContact.findUnique({
      where: { id: contactId },
      include: { session: true },
    });

    if (!contact)
      return NextResponse.json(
        { error: "Contato não encontrado" },
        { status: 404 }
      );

    if (contact.session.connectionStatus !== "CONNECTED")
      return NextResponse.json(
        {
          error: "Sessão não está conectada",
          details: contact.session.connectionStatus,
        },
        { status: 400 }
      );

    let publicUrl: string;
    let base64Audio: string;

    if (audioUrl) {
      // 🔹 Caso venha uma URL já pronta (reenvio ou resposta rápida)
      publicUrl = audioUrl;

      // 🔹 Faz o download do arquivo remoto e converte para base64
      const resp = await axios.get(publicUrl, { responseType: "arraybuffer" });
      base64Audio = Buffer.from(resp.data).toString("base64");

      console.log("☁️ Usando URL existente, baixando e convertendo...");
    } else if (audioFile) {
      // 🔹 Caso venha arquivo direto do input
      const bytes = await audioFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = "ogg";
      const contentType = "audio/ogg";
      const objectPath = `whatsapp/${sessionName}/outbox/${Date.now()}.${ext}`;

      // 🔹 Sobe para Firebase
      publicUrl = await uploadBase64ToFirebase(
        buffer.toString("base64"),
        objectPath,
        contentType
      );

      console.log("☁️ Upload concluído:", publicUrl);

      // 🔹 Converte o mesmo arquivo para Base64 inline (sem depender da URL)
      base64Audio = buffer.toString("base64");
    } else {
      return NextResponse.json(
        { error: "Nenhum áudio fornecido" },
        { status: 400 }
      );
    }

    // 🔹 Envia para o backend WPP (em base64)
    const response = await axios.post(
      `${WHATSAPP_SERVER_URL}/${encodeURIComponent(sessionName)}/sendptt`,
      {
        telnumber: contact.phone,
        audioPath: `data:audio/ogg;base64,${base64Audio}`, // << base64 inline
      },
      { timeout: 60000 }
    );

    const result = response.data;
    console.log("🔍 Resultado do envio:", result);

    if (result.status) {
      await prisma.whatsAppContact.update({
        where: { id: contactId },
        data: { lastMessageAt: new Date() },
      });

      console.log("✅ Áudio enviado com sucesso!");
      return NextResponse.json({
        success: true,
        data: {
          messageId: result.message,
          contactPhone: contact.phone,
          sessionName,
          audioUrl: publicUrl, // link salvo
          fileName: audioFile?.name || "from-url",
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Erro ao enviar áudio",
          details: result.message,
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("❌ Erro ao enviar áudio:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Erro interno" },
      { status: 500 }
    );
  }
}
