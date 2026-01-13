import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    // Buscar dados do usuário para verificar conexão Google
    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        googleAccessToken: true,
        googleRefreshToken: true,
        googleEmail: true,
      },
    });

    if (!user) {
      const teamMember = await prisma.team.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          googleAccessToken: true,
          googleRefreshToken: true,
          googleEmail: true,
        },
      });

      if (teamMember) {
        user = {
          id: teamMember.id,
          googleAccessToken: teamMember.googleAccessToken,
          googleRefreshToken: teamMember.googleRefreshToken,
          googleEmail: teamMember.googleEmail,
        };
      }
    }

    const isConnected = !!(user?.googleAccessToken && user?.googleRefreshToken);

    return NextResponse.json({
      isConnected,
      googleEmail: user?.googleEmail,
      needsReconnection: !isConnected,
    });
  } catch (error) {
    console.error("Erro ao verificar conexão Google:", error);
    return NextResponse.json(
      {
        error: "Erro ao verificar conexão Google",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
