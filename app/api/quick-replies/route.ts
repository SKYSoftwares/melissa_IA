import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { bucket } from "@/lib/firebaseAdmin"; // 👈 já tem isso pronto
import { v4 as uuid } from "uuid";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";

  // Upload de arquivo
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // image | audio | video | document
    const title = formData.get("title") as string;

    if (!file || !type) {
      return NextResponse.json(
        { error: "Arquivo ou tipo não enviado" },
        { status: 400 }
      );
    }

    // Upload para Firebase
    const bytes = Buffer.from(await file.arrayBuffer());
    const fileName = `${uuid()}-${file.name}`;
    const fileUpload = bucket.file(
      `quickReplies/${session.user.id}/${fileName}`
    );
    await fileUpload.save(bytes, {
      metadata: { contentType: file.type },
      resumable: false,
    });
    const [url] = await fileUpload.getSignedUrl({
      action: "read",
      expires: "03-01-2030",
    });

    const fieldMap: Record<string, string> = {
      image: "imageUrl",
      audio: "audioUrl",
      video: "videoUrl",
      document: "documentUrl",
    };

    const fieldName = fieldMap[type];
    if (!fieldName) {
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
    }

    const reply = await prisma.quickReply.create({
      data: {
        userId: session.user.id,
        title,
        [fieldName]: url,
      },
    });

    return NextResponse.json(reply);
  }

  // Se não for arquivo → texto simples
  const { title, content } = await req.json();

  const reply = await prisma.quickReply.create({
    data: {
      userId: session.user.id,
      title,
      content,
    },
  });

  return NextResponse.json(reply);
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const replies = await prisma.quickReply.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(replies);
}
