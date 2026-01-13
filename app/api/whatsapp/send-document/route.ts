import { NextRequest, NextResponse } from "next/server";
import mime from "mime-types";
import axios from "axios";
import { uploadBase64ToFirebase } from "@/lib/upload";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const WHATSAPP_SERVER_URL =
  process.env.BACKEND_WPP_CONNECT || "https://marcelo.solidtech.digital";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const contactId = formData.get("contactId") as string; // <- UUID
    const sessionName = formData.get("sessionName") as string;
    const caption = (formData.get("caption") as string) || "";

    const pdfFile = formData.get("file") as File | null;
    const fileUrl = formData.get("fileUrl") as string | null;
    console.log(pdfFile, fileUrl);
    if (!contactId || !sessionName || (!pdfFile && !fileUrl)) {
      return NextResponse.json(
        {
          error:
            "contactId, sessionName e (arquivo OU fileUrl) são obrigatórios",
        },
        { status: 400 }
      );
    }

    // 🔍 Buscar número real do contato
    const contact = await prisma.whatsAppContact.findUnique({
      where: { id: contactId },
    });

    if (!contact || !contact.phone) {
      return NextResponse.json(
        { error: "Contato não encontrado ou sem número válido" },
        { status: 404 }
      );
    }

    const phoneNumber = contact.phone.replace(/\D/g, ""); // só dígitos
    console.log("📞 Enviando documento para número:", phoneNumber);

    let publicUrl = "";
    let filename = "";

    if (pdfFile) {
      // 📦 Converte para base64
      const arrayBuffer = await pdfFile.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const contentType = pdfFile.type || "application/pdf";
      const ext = mime.extension(contentType) || "pdf";

      const objectPath = `whatsapp/${sessionName}/outbox/${Date.now()}.${ext}`;

      // 🚀 Upload para Firebase
      publicUrl = await uploadBase64ToFirebase(base64, objectPath, contentType);
      filename = pdfFile.name || `document.${ext}`;
    } else if (fileUrl) {
      // 🚀 Quick Reply com documento já hospedado
      publicUrl = fileUrl;
      filename = `quickreply-${Date.now()}.pdf`;
    }

    // 🚀 Envia para servidor WhatsApp
    const response = await axios.post(
      `${WHATSAPP_SERVER_URL}/${encodeURIComponent(sessionName)}/senddocument`,
      {
        telnumber: phoneNumber,
        filePath: publicUrl,
        filename,
        caption,
      }
    );

    return NextResponse.json({ success: true, data: response.data });
  } catch (err: any) {
    console.error("❌ Erro na rota send-document:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
