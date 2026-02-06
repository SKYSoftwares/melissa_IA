import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // ✅ OBRIGATÓRIO

    const template = await prisma.template.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    await prisma.templateMessage.updateMany({
      where: { templateId: id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      status: true,
      message: "Template marcado como deletado",
      template,
    });
  } catch (err: any) {
    console.error("❌ Erro ao deletar template:", err);
    return NextResponse.json(
      { status: false, error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
