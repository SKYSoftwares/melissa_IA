import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { bucket } from "@/lib/firebaseAdmin";
import { v4 as uuid } from "uuid";

const prisma = new PrismaClient();

export async function POST(
  req: Request,
  { params }: { params: { proposalId: string } }
) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Content-Type inválido, use multipart/form-data" },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const documentType = (formData.get("documentType") as string) || "outro";

    if (!file) {
      return NextResponse.json(
        { error: "Arquivo não enviado" },
        { status: 400 }
      );
    }

    // Upload para Firebase
    const bytes = Buffer.from(await file.arrayBuffer());
    const fileName = `${uuid()}-${file.name}`;
    const fileUpload = bucket.file(
      `proposals/${params.proposalId}/${fileName}`
    );

    await fileUpload.save(bytes, {
      metadata: { contentType: file.type },
      resumable: false,
    });

    const [url] = await fileUpload.getSignedUrl({
      action: "read",
      expires: "03-01-2030",
    });

    // Salva no banco
    const savedFile = await prisma.proposalFile.create({
      data: {
        url,
        name: file.name,
        proposalId: params.proposalId,
        documentType,
        mimeType: file.type,
        size: file.size,
        originalName: file.name,
      },
    });

    return NextResponse.json(savedFile, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao fazer upload do arquivo:", error);
    return NextResponse.json(
      { error: "Erro ao fazer upload do arquivo" },
      { status: 500 }
    );
  }
}
