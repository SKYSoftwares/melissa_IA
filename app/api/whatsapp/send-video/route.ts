import { NextRequest, NextResponse } from "next/server";
import mime from "mime-types";
import axios from "axios";
import { uploadBase64ToFirebase } from "@/lib/upload";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const WHATSAPP_SERVER_URL =
  process.env.BACKEND_WPP_CONNECT || "https://wpp.melissaia.com.br";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const contactId = formData.get("contactId") as string; // <- UUID do banco
    const sessionName = formData.get("sessionName") as string;
    const caption = (formData.get("caption") as string) || "";

    const videoFile = formData.get("video") as File | null;
    const videoUrl = formData.get("videoUrl") as string | null;

    if (!contactId || !sessionName || (!videoFile && !videoUrl)) {
      return NextResponse.json(
        {
          error:
            "contactId, sessionName e (arquivo OU videoUrl) são obrigatórios",
        },
        { status: 400 }
      );
    }

    // 🔍 Buscar número real do contato no banco
    const contact = await prisma.whatsAppContact.findUnique({
      where: { id: contactId },
    });

    if (!contact || !contact.phone) {
      return NextResponse.json(
        { error: "Contato não encontrado ou sem número válido" },
        { status: 404 }
      );
    }

    const realNumber = contact.phone.replace(/\D/g, ""); // só números
    console.log("📞 Número real para envio:", realNumber);

    let publicUrl = "";
    let filename = "";

    if (videoFile) {
      // 📦 Converte para base64
      const arrayBuffer = await videoFile.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const contentType = videoFile.type || "video/mp4";
      const ext = mime.extension(contentType) || "mp4";

      const objectPath = `whatsapp/${sessionName}/outbox/${Date.now()}.${ext}`;

      // 🚀 Upload para Firebase
      publicUrl = await uploadBase64ToFirebase(base64, objectPath, contentType);
      filename = videoFile.name || `video.${ext}`;
    } else if (videoUrl) {
      // 🚀 Já tenho URL pronta (Quick Reply)
      publicUrl = videoUrl;
      filename = `quickreply-${Date.now()}.mp4`;
    }

    // 🚀 Chama servidor WPP com o número correto
    const response = await axios.post(
      `${WHATSAPP_SERVER_URL}/${encodeURIComponent(sessionName)}/sendvideo`,
      {
        telnumber: realNumber,
        videoPath: publicUrl,
        filename,
        caption,
      }
    );

    return NextResponse.json({ success: true, data: response.data });
  } catch (err: any) {
    console.error("❌ Erro na rota send-video:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
