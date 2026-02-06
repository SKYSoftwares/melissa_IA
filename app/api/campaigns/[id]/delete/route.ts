import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // ✅ OBRIGATÓRIO

    // Marca campanha como deletada (soft delete)
    const campaign = await prisma.campaing.update({
      where: { id },
      data: { deletedAt: new Date(), status: "paused" },
    });

    // Atualiza todos os dispatches dessa campanha
    await prisma.campaignDispatch.updateMany({
      where: {
        campaignId: campaign.id,
      },
      data: {
        status: "failed",
        error: "Campanha deletada pelo usuário",
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ status: true, message: "Campanha deletada" });
  } catch (err: any) {
    console.error("Erro ao deletar campanha:", err);
    return NextResponse.json(
      { status: false, error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}
