// app/api/account/avatar/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { PrismaClient } from "@prisma/client";
import { uploadBase64ToFirebase } from "@/lib/uploadBase64ToFirebase";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { ok: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const { base64, mime } = await req.json();
    if (!base64 || !mime) {
      return NextResponse.json(
        { ok: false, error: "Corpo inválido" },
        { status: 400 }
      );
    }

    // validação simples
    if (!/^image\//.test(mime)) {
      return NextResponse.json(
        { ok: false, error: "Apenas imagens" },
        { status: 400 }
      );
    }

    // pega o usuário Team pelo email (sua base usa Team.email como login)
    const me = await prisma.team.findUnique({
      where: { email: session.user.email },
    });
    if (!me) {
      return NextResponse.json(
        { ok: false, error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const objectPath = `avatars/${me.id}/${Date.now()}.jpg`; // pode trocar extensão
    const url = await uploadBase64ToFirebase(base64, objectPath, mime);

    await prisma.team.update({
      where: { id: me.id },
      data: { avatarUrl: url },
    });

    return NextResponse.json({ ok: true, url });
  } catch (e: any) {
    console.error("avatar upload error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Erro interno" },
      { status: 500 }
    );
  }
}
