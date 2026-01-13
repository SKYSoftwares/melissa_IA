// app/api/leadFiles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { uploadBase64ToFirebase } from "@/lib/uploadBase64ToFirebase";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { leadId, base64, fileName, mimeType } = await req.json();
    console.log(leadId, base64, fileName, mimeType);
    if (!leadId || !base64 || !fileName) {
      return NextResponse.json(
        { error: "leadId, base64 e fileName são obrigatórios" },
        { status: 400 }
      );
    }

    // Caminho único por lead
    const objectPath = `leads/${leadId}/${Date.now()}_${fileName}`;

    // Upload para o Firebase
    const url = await uploadBase64ToFirebase(base64, objectPath, mimeType);

    // Salvar no banco
    const file = await prisma.leadFile.create({
      data: {
        leadId,
        name: fileName,
        url,
        mimeType,
        originalName: fileName,
        size: Buffer.from(base64, "base64").length,
      },
    });

    return NextResponse.json(file, { status: 201 });
  } catch (err) {
    console.error("Erro ao salvar leadFile:", err);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
