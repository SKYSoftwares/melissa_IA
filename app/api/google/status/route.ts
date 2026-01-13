import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get('email');

    if (!userEmail) {
      return NextResponse.json({ error: 'Email do usuário não fornecido' }, { status: 400 });
    }

    let user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        googleAccessToken: true,
        googleRefreshToken: true,
        googleEmail: true
      }
    });

    // Se não encontrar na tabela User, busca na tabela Team
    if (!user) {
      const teamMember = await prisma.team.findUnique({
        where: { email: userEmail },
        select: {
          googleAccessToken: true,
          googleRefreshToken: true,
          googleEmail: true
        }
      });
      if (!teamMember) {
        return NextResponse.json({ error: 'Usuário ou membro da equipe não encontrado' }, { status: 404 });
      }
      user = teamMember;
    }

    const isConnected = !!(user.googleAccessToken && user.googleRefreshToken);

    return NextResponse.json({
      isConnected,
      googleEmail: user.googleEmail,
      hasAccessToken: !!user.googleAccessToken,
      hasRefreshToken: !!user.googleRefreshToken
    });

  } catch (error) {
    console.error('Erro ao verificar status do Google:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 