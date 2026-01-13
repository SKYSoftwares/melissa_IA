import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // 👈 agora sim, await no params
    const { status } = await req.json();

    if (!["active", "paused", "finished"].includes(status)) {
      return NextResponse.json(
        { status: false, error: "Status inválido" },
        { status: 400 }
      );
    }

    const campaign = await prisma.campaing.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ status: true, campaign });
  } catch (err: any) {
    console.error("Erro ao atualizar status:", err);
    return NextResponse.json(
      { status: false, error: err.message },
      { status: 500 }
    );
  }
}
