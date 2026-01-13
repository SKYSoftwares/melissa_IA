import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Listar leads deletados (lixeira)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("userEmail");
    const userRole = searchParams.get("userRole");

    console.log("Buscando leads na lixeira para:", { userEmail, userRole });

    let whereClause: any = {
      deletedAt: { not: null }, // Apenas leads deletados
    };

    if (userRole === "administrador") {
      // Administrador vê todos os leads deletados
      console.log("Administrador - vendo todos os leads deletados");
    } else if (userRole === "diretor") {
      // Diretor vê leads deletados dos gerentes que gerencia e dos consultores dessas equipes
      console.log(
        "Diretor - buscando leads deletados dos gerentes e equipes que gerencia"
      );

      const diretor = await prisma.team.findUnique({
        where: { email: userEmail || "" },
      });

      let allIds: string[] = [];

      if (diretor) {
        allIds.push(diretor.id);

        const gerentesSobDiretor = await prisma.team.findMany({
          where: {
            directorId: diretor.id,
            permissions: {
              some: {
                role: "gerente",
              },
            },
          },
          include: {
            managedTeams: {
              include: {
                members: {
                  select: { id: true },
                },
              },
            },
          },
        });

        if (gerentesSobDiretor.length > 0) {
          gerentesSobDiretor.forEach((gerente) => {
            allIds.push(gerente.id);
            gerente.managedTeams.forEach((team) => {
              team.members.forEach((member) => {
                allIds.push(member.id);
              });
            });
          });
        }

        whereClause.createdBy = { in: allIds };
        console.log(whereClause);
      } else {
        // Se não encontrou o diretor, não mostra nenhum lead
        console.log("cai aqui");
        whereClause.createdBy = { in: [] };
      }
    } else if (userRole === "gerente") {
      // Gerente vê apenas leads deletados dos consultores da sua equipe e os próprios
      console.log("Gerente - buscando leads deletados da equipe");
      const gerente = await prisma.team.findUnique({
        where: { email: userEmail || "" },
        include: {
          managedTeams: {
            include: {
              members: {
                select: { id: true },
              },
            },
          },
        },
      });
      if (gerente && gerente.managedTeams.length > 0) {
        const memberIds = gerente.managedTeams.flatMap((team) =>
          team.members.map((member) => member.id)
        );
        memberIds.push(gerente.id);
        whereClause.createdBy = { in: memberIds };
      } else {
        whereClause.createdBy = gerente?.id;
      }
    } else {
      // Consultor vê apenas seus próprios leads deletados
      console.log("Consultor - vendo apenas próprios leads deletados");
      const user = await prisma.team.findUnique({
        where: { email: userEmail || "" },
        select: { id: true },
      });
      if (user) {
        whereClause.createdBy = user.id;
      }
    }

    const deletedLeads = await prisma.lead.findMany({
      where: whereClause,
      include: {
        creator: {
          select: {
            name: true,
            email: true,
            position: true,
          },
        },
        simulations: {
          orderBy: { createdAt: "desc" },
        },
        files: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { deletedAt: "desc" }, // Mais recentemente deletados primeiro
    });

    console.log(`Encontrados ${deletedLeads.length} leads na lixeira`);
    return NextResponse.json(deletedLeads);
  } catch (error) {
    console.error("Erro ao buscar leads na lixeira:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST - Restaurar lead da lixeira
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId } = body;

    if (!leadId) {
      return NextResponse.json(
        { error: "ID do lead é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o lead existe e está deletado
    const existingLead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        deletedAt: { not: null },
      },
    });

    if (!existingLead) {
      return NextResponse.json(
        { error: "Lead não encontrado na lixeira" },
        { status: 404 }
      );
    }

    // Restaurar o lead - remover deletedAt
    const restoredLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        deletedAt: null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Lead restaurado com sucesso",
      lead: restoredLead,
    });
  } catch (error: any) {
    console.error("Erro ao restaurar lead:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Lead não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Deletar permanentemente da lixeira
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get("id");

    if (!leadId) {
      return NextResponse.json(
        { error: "ID do lead é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o lead existe e está deletado
    const existingLead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        deletedAt: { not: null },
      },
    });

    if (!existingLead) {
      return NextResponse.json(
        { error: "Lead não encontrado na lixeira" },
        { status: 404 }
      );
    }

    // Deletar permanentemente (hard delete)
    await prisma.lead.delete({
      where: { id: leadId },
    });

    return NextResponse.json({
      success: true,
      message: "Lead deletado permanentemente",
    });
  } catch (error: any) {
    console.error("Erro ao deletar permanentemente:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Lead não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
