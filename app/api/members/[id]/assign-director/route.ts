import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { directorId } = await request.json();

    if (!directorId) {
      return NextResponse.json(
        { error: "ID do diretor é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o gerente existe
    const manager = await prisma.team.findUnique({
      where: { id },
      include: { permissions: true }
    });

    if (!manager) {
      return NextResponse.json(
        { error: "Gerente não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se é realmente um gerente
    const isManager = manager.permissions.some(p => p.role === 'gerente');
    if (!isManager) {
      return NextResponse.json(
        { error: "Usuário não é um gerente" },
        { status: 400 }
      );
    }

    // Verificar se o diretor existe
    const director = await prisma.team.findUnique({
      where: { id: directorId },
      include: { permissions: true }
    });

    if (!director) {
      return NextResponse.json(
        { error: "Diretor não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se é realmente um diretor
    const isDirector = director.permissions.some(p => p.role === 'diretor');
    if (!isDirector) {
      return NextResponse.json(
        { error: "Usuário não é um diretor" },
        { status: 400 }
      );
    }

    // Atualizar o gerente com o directorId
    const updatedManager = await prisma.team.update({
      where: { id },
      data: { directorId },
      include: {
        permissions: true,
        managedTeams: {
          include: {
            members: {
              select: {
                id: true,
                name: true,
                email: true,
                position: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(updatedManager);
  } catch (error) {
    console.error("Erro ao associar gerente ao diretor:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 