import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Listar leads (filtrado por usuário e equipe)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("userEmail");
    const userRole = searchParams.get("userRole");

    console.log("Buscando leads para:", { userEmail, userRole });

    let whereClause: any = {
      deletedAt: null, // Filtrar leads não deletados
    };

    if (userRole === "administrador") {
      // Administrador vê todos os leads
      console.log("Administrador - vendo todos os leads");
    } else if (userRole === "diretor") {
      // Diretor vê leads dos gerentes que gerencia e dos consultores dessas equipes
      console.log(
        "Diretor - buscando leads dos gerentes e equipes que gerencia"
      );

      // Buscar o diretor
      const diretor = await prisma.team.findUnique({
        where: { email: userEmail || "" },
      });

      let allIds: string[] = [];

      if (diretor) {
        // Adicionar o próprio diretor (sempre pode ver seus próprios leads)
        allIds.push(diretor.id);

        // Buscar gerentes que têm este diretor como directorId
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
          // Para cada gerente sob o diretor
          gerentesSobDiretor.forEach((gerente) => {
            // O gerente
            allIds.push(gerente.id);
            // Os consultores das equipes do gerente
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
      // Gerente vê apenas leads dos consultores da sua equipe e os próprios
      console.log("Gerente - buscando leads da equipe");
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
      // Consultor vê apenas seus próprios leads
      console.log("Consultor - vendo apenas próprios leads");
      const user = await prisma.team.findUnique({
        where: { email: userEmail || "" },
        select: { id: true },
      });
      if (user) {
        whereClause.createdBy = user.id;
      }
    }

    const leads = await prisma.lead.findMany({
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
      orderBy: { id: "desc" },
    });

    console.log(`Encontrados ${leads.length} leads`);
    return NextResponse.json(leads);
  } catch (error) {
    console.error("Erro ao buscar leads:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST - Criar novo lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      ocupation,
      potentialValue,
      observations,
      product,
      status,
      userEmail,
    } = body;

    // Validações básicas
    if (!name || !email || !phone || !userEmail) {
      return NextResponse.json(
        { error: "Nome, email, telefone e userEmail são obrigatórios" },
        { status: 400 }
      );
    }

    // Buscar o ID do usuário pelo email
    const user = await prisma.team.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone,
        ocupation: ocupation || "",
        potentialValue: potentialValue || "",
        observations: observations || "",
        product: product || "",
        status: status || "novos_leads",
        createdBy: user.id,
      } as any,
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar lead:", error);

    // Verificar se é erro de email duplicado
    if (error.code === "P2002" && error.meta?.target?.includes("email")) {
      return NextResponse.json(
        { error: "Este email já está cadastrado" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar status do lead
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, followUp } = body;

    // Validações básicas
    if (!id || !status) {
      return NextResponse.json(
        { error: "ID e status são obrigatórios" },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: { status } as any,
    });

    // Se veio followUp, salva na tabela
    if (followUp) {
      try {
        await prisma.followup.create({
          data: {
            observations: followUp.observations || followUp.observation,
            tipeOfContact: followUp.tipeOfContact || followUp.type,
            date: new Date(followUp.date),
            dateNextContact: followUp.dateNextContact
              ? new Date(followUp.dateNextContact)
              : new Date(),
            leadId: id,
          },
        });
      } catch (err) {
        console.error("Erro ao criar followup:", err);
      }
    }

    return NextResponse.json(lead);
  } catch (error: any) {
    console.error("Erro ao atualizar lead:", error);

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

// DELETE - Soft delete de lead (enviar para lixeira)
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

    // Verificar se o lead existe e não está deletado
    const existingLead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!existingLead) {
      return NextResponse.json(
        { error: "Lead não encontrado" },
        { status: 404 }
      );
    }

    if (existingLead.deletedAt) {
      return NextResponse.json(
        { error: "Lead já está na lixeira" },
        { status: 400 }
      );
    }

    // Soft delete - apenas marca como deletado
    const deletedLead = await prisma.lead.update({
      where: { id: leadId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: "Lead movido para a lixeira",
      lead: deletedLead,
    });
  } catch (error: any) {
    console.error("Erro ao deletar lead:", error);

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
