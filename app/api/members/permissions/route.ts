import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function PUT(req: NextRequest) {
  try {
    const { teamId, permissionKey, value } = await req.json();
    
    if (!teamId || !permissionKey) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    // Verificar se já existe uma permissão para este membro
    const existingPermission = await prisma.teamPermission.findFirst({
      where: { teamId }
    });

    if (existingPermission) {
      // Atualizar permissão existente
      const updated = await prisma.teamPermission.update({
        where: { id: existingPermission.id },
        data: { [permissionKey]: value }
      });
      return NextResponse.json(updated);
    } else {
      // Criar nova permissão com valores padrão
      const newPermission = await prisma.teamPermission.create({
        data: {
          teamId,
          role: "usuario",
          dashboard: false,
          whatsapp: false,
          propostas: false,
          simuladores: false,
          relatorios: false,
          campanhas: false,
          equipe: false,
          configuracoes: false,
          [permissionKey]: value
        }
      });
      return NextResponse.json(newPermission);
    }
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar permissão", details: String(error) }, { status: 500 });
  }
} 