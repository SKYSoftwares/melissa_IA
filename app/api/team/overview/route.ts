// app/api/team/overview/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const totalTeams = await prisma.team.count();
    const totalManagers = await prisma.team.count({
      where: { position: "Gerente" },
    });
    const totalConsultants = await prisma.team.count({
      where: { position: "Consultor" },
    });
    const totalMembers = await prisma.user.count();

    return NextResponse.json({
      totalTeams,
      totalManagers,
      totalConsultants,
      totalMembers,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao carregar métricas" },
      { status: 500 }
    );
  }
}
