import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get('leadId');

    if (!leadId) {
      return NextResponse.json({ error: 'leadId é obrigatório' }, { status: 400 });
    }

    // Buscar reuniões do lead
    const meetings = await prisma.meeting.findMany({
      where: { 
        leadId: leadId,
        organizerEmail: session.user.email 
      },
      orderBy: { startDateTime: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        startDateTime: true,
        endDateTime: true,
        duration: true,
        type: true,
        status: true,
        meetLink: true,
        attendees: true,
        googleEventId: true,
        createdAt: true
      }
    });

    return NextResponse.json({ meetings });

  } catch (error) {
    console.error('Erro ao buscar reuniões:', error);
    return NextResponse.json({ 
      error: 'Erro ao buscar reuniões',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
