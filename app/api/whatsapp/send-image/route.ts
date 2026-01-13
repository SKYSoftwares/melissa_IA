import { NextRequest, NextResponse } from "next/server";
import mime from "mime-types";
import axios from "axios";
import { uploadBase64ToFirebase } from "@/lib/upload";
import { prisma } from "@/lib/prisma";

const WHATSAPP_SERVER_URL =
  process.env.BACKEND_WPP_CONNECT || "https://seu-servidor-wpp.com";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const contactId = formData.get("contactId") as string;
    const sessionName = formData.get("sessionName") as string;
    const caption = (formData.get("caption") as string) || "";

    const imageFile = formData.get("image") as File | null;
    const imageUrl = formData.get("imageUrl") as string | null;

    if (!contactId || !sessionName || (!imageFile && !imageUrl)) {
      return NextResponse.json(
        {
          error:
            "contactId, sessionName e (arquivo OU imageUrl) são obrigatórios",
        },
        { status: 400 }
      );
    }

    // 🔹 Busca o contato no banco para pegar o número real
    const contact = await prisma.whatsAppContact.findUnique({
      where: { id: contactId },
    });
    if (!contact) {
      return NextResponse.json(
        { error: "Contato não encontrado" },
        { status: 404 }
      );
    }

    const phone = contact.phone.replace(/\D/g, ""); // só números
    let publicUrl = "";
    let filename = "";

    if (imageFile) {
      // 🔹 Converte arquivo em base64
      const arrayBuffer = await imageFile.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const contentType = imageFile.type || "image/jpeg";
      const ext = mime.extension(contentType) || "jpg";

      const objectPath = `whatsapp/${sessionName}/outbox/${Date.now()}.${ext}`;

      // 🔹 Upload para Firebase → gera URL pública
      publicUrl = await uploadBase64ToFirebase(base64, objectPath, contentType);
      filename = imageFile.name || `image.${ext}`;
    } else if (imageUrl) {
      // 🔹 Já tenho URL pronta (Quick Reply)
      publicUrl = imageUrl;
      filename = `quickreply-${Date.now()}.jpg`; // nome fictício
    }

    // 🔹 Chama seu servidor WPP passando o telefone correto
    const response = await axios.post(
      `${WHATSAPP_SERVER_URL}/${encodeURIComponent(sessionName)}/sendimage`,
      {
        telnumber: phone,
        imagePath: publicUrl, // ✅ aqui pode ser Firebase ou URL direta
        filename,
        caption,
      }
    );

    return NextResponse.json({ success: true, data: response.data });
  } catch (err: any) {
    console.error("❌ Erro na rota send-image:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
