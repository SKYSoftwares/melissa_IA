import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 🔎 checa se existe antes
    const quickReply = await prisma.quickReply.findUnique({ where: { id } });
    if (!quickReply) {
      return NextResponse.json(
        { ok: false, error: "Resposta rápida não encontrada" },
        { status: 404 }
      );
    }

    await prisma.quickReply.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ Erro ao excluir resposta rápida:", err);
    return NextResponse.json(
      { ok: false, error: "Erro interno ao excluir resposta rápida" },
      { status: 500 }
    );
  }
}
