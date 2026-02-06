import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // ✅ OBRIGATÓRIO

    if (!id) {
      return NextResponse.json(
        { status: false, error: "ID do segmento não informado" },
        { status: 400 }
      );
    }

    await prisma.segment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      status: true,
      message: "Segmento marcado como deletado",
    });
  } catch (err: any) {
    console.error("❌ Erro ao deletar segmento:", err);
    return NextResponse.json(
      { status: false, error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
