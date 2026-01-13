import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
const prisma = new PrismaClient();

// GET - Listar todas as campanhas
export async function GET() {
  try {
    const campaigns = await prisma.campaing.findMany({
      include: {
        templates: {
          include: {
            template: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      status: true,
      campaigns,
    });
  } catch (error) {
    console.error("Erro ao buscar campanhas:", error);
    return NextResponse.json(
      {
        status: false,
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}

// POST - Criar nova campanha
export async function POST(request: NextRequest) {
  try {
    const { name, delay, templateIds } = await request.json();

    if (!name) {
      return NextResponse.json(
        {
          status: false,
          error: "name é obrigatório",
        },
        { status: 400 }
      );
    }
    const nextSession = await getServerSession(authOptions);

    if (!nextSession || !nextSession.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Criar campanha
    const campaign = await prisma.campaing.create({
      data: {
        name,
        delay: delay || 30000,
        userId: nextSession.user.id,
      },
    });

    // Se foram fornecidos templates, criar as relações
    if (templateIds && templateIds.length > 0) {
      const campaignTemplates = templateIds.map((templateId: string) => ({
        campaingId: campaign.id,
        templateId,
      }));

      await prisma.campaingTemplate.createMany({
        data: campaignTemplates,
      });
    }

    // Buscar campanha com templates
    const campaignWithTemplates = await prisma.campaing.findUnique({
      where: { id: campaign.id },
      include: {
        templates: {
          include: {
            template: true,
          },
        },
      },
    });

    return NextResponse.json({
      status: true,
      campaign: campaignWithTemplates,
      message: "Campanha criada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao criar campanha:", error);
    return NextResponse.json(
      {
        status: false,
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}

// PUT - Atualizar campanha
export async function PUT(request: NextRequest) {
  try {
    const { id, name, delay, templateIds } = await request.json();

    if (!id) {
      return NextResponse.json(
        {
          status: false,
          error: "id é obrigatório",
        },
        { status: 400 }
      );
    }

    // Atualizar campanha
    const campaign = await prisma.campaing.update({
      where: { id },
      data: {
        name,
        delay,
      },
    });

    // Se foram fornecidos templates, atualizar as relações
    if (templateIds !== undefined) {
      // Remover todas as relações existentes
      await prisma.campaingTemplate.deleteMany({
        where: { campaingId: id },
      });

      // Criar novas relações
      if (templateIds.length > 0) {
        const campaignTemplates = templateIds.map((templateId: string) => ({
          campaingId: id,
          templateId,
        }));

        await prisma.campaingTemplate.createMany({
          data: campaignTemplates,
        });
      }
    }

    // Buscar campanha atualizada com templates
    const campaignWithTemplates = await prisma.campaing.findUnique({
      where: { id },
      include: {
        templates: {
          include: {
            template: true,
          },
        },
      },
    });

    return NextResponse.json({
      status: true,
      campaign: campaignWithTemplates,
      message: "Campanha atualizada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao atualizar campanha:", error);
    return NextResponse.json(
      {
        status: false,
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}

// DELETE - Deletar campanha
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          status: false,
          error: "id é obrigatório",
        },
        { status: 400 }
      );
    }

    await prisma.campaing.delete({
      where: { id },
    });

    return NextResponse.json({
      status: true,
      message: "Campanha deletada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao deletar campanha:", error);
    return NextResponse.json(
      {
        status: false,
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}
