import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  try {
    // Obter sessão do usuário logado
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Usuário não está logado" },
        { status: 401 }
      );
    }

    console.log("Desconectando Google para usuário:", session.user.email);

    // Buscar o usuário na tabela Team
    const teamMember = await prisma.team.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        googleAccessToken: true,
        googleRefreshToken: true,
        googleEmail: true,
      },
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    if (!teamMember.googleAccessToken) {
      return NextResponse.json(
        { error: "Usuário não está conectado ao Google" },
        { status: 400 }
      );
    }

    // Tentar revogar o token no Google (opcional)
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      oauth2Client.setCredentials({
        access_token: teamMember.googleAccessToken,
        refresh_token: teamMember.googleRefreshToken,
      });

      // Revogar o token no Google
      await oauth2Client.revokeToken(teamMember.googleAccessToken);
      console.log("Token revogado no Google com sucesso");
    } catch (revokeError) {
      console.warn(
        "Erro ao revogar token no Google (continuando):",
        revokeError
      );
      // Continuamos mesmo se a revogação falhar
    }

    // Limpar os tokens do banco de dados
    await prisma.team.update({
      where: { id: teamMember.id },
      data: {
        googleAccessToken: null,
        googleRefreshToken: null,
        googleEmail: null,
      },
    });

    console.log("Desconexão do Google concluída com sucesso");

    return NextResponse.json({
      success: true,
      message: "Conta Google desconectada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao desconectar Google:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
