import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Buscar equipes dos gerentes de um diretor
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const directorId = searchParams.get('directorId');
    
    if (!directorId) {
      return NextResponse.json({ error: "ID do diretor é obrigatório" }, { status: 400 });
    }

    // Buscar o diretor
    const director = await prisma.team.findUnique({
      where: { id: directorId },
      include: {
        managedTeams: {
          include: {
            manager: true,
            members: {
              include: {
                permissions: true
              }
            }
          }
        }
      }
    });

    if (!director) {
      return NextResponse.json({ error: "Diretor não encontrado" }, { status: 404 });
    }

    // Buscar todos os gerentes e suas equipes
    const allTeams = await prisma.teamGroup.findMany({
      include: {
        manager: true,
        members: {
          include: {
            permissions: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      director,
      teams: allTeams
    });

  } catch (error) {
    console.error('Erro ao buscar equipes do diretor:', error);
    return NextResponse.json({ 
      error: "Erro ao buscar equipes", 
      details: String(error) 
    }, { status: 500 });
  }
} 