import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const chats = await prisma.chat.findMany({
      orderBy: {
        timestamp: 'desc',
      },
    });
    return NextResponse.json(chats, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar chats:', error);
    return NextResponse.json({ error: 'Erro ao buscar chats' }, { status: 500 });
  }
} 