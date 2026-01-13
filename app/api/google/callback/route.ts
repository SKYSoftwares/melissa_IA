import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    console.error("Erro no OAuth:", error);
    return NextResponse.redirect(new URL("/agenda?error=auth_failed", req.url));
  }

  if (!code) {
    console.error("Código de autorização não fornecido");
    return NextResponse.redirect(new URL("/agenda?error=no_code", req.url));
  }

  try {
    console.log("Iniciando processo de autenticação Google...");

    // Obter sessão do usuário logado
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      console.error("Usuário não está logado");
      return NextResponse.redirect(
        new URL("/login?error=not_logged_in", req.url)
      );
    }

    console.log("Usuário logado:", session.user.email);

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    console.log("Obtendo tokens...");
    const { tokens } = await oauth2Client.getToken(code);
    console.log("Tokens recebidos:", tokens);

    if (!tokens || !tokens.access_token) {
      console.error("Tokens inválidos recebidos do Google:", tokens);
      return NextResponse.redirect(
        new URL("/agenda?error=invalid_tokens", req.url)
      );
    }

    oauth2Client.setCredentials(tokens);

    console.log("Obtendo informações do usuário Google...");
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    console.log("Email do Google:", userInfo.data.email);

    // Se não encontrar na tabela User, buscar na tabela Team

    const teamMember = await prisma.team.findUnique({
      where: { email: session.user.email },
    });

    if (!teamMember) {
      console.error("Usuário não encontrado no sistema:", session.user.email);
      return NextResponse.redirect(
        new URL("/dashboard/agenda?error=user_not_found", req.url)
      );
    }

    console.log("Atualizando membro da equipe com tokens Google...");
    await prisma.team.update({
      where: { id: teamMember.id },
      data: {
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token,
        googleEmail: userInfo.data.email,
      },
    });

    console.log("Autenticação Google concluída com sucesso");
    return NextResponse.redirect(
      new URL("/dashboard/agenda?success=google_connected", req.url)
    );
  } catch (error) {
    console.error("Erro no callback do Google:", error);
    return NextResponse.redirect(
      new URL("/dashboard/agenda?error=auth_error", req.url)
    );
  }
}
