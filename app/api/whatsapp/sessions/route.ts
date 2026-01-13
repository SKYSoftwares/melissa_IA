import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Listar todas as sessões
export async function GET() {
  const nextSession = await getServerSession(authOptions);
  try {
    const sessions = await prisma.whatsAppSession.findMany({
      where: {
        userId: nextSession?.user.id,
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      status: true,
      sessions,
    });
  } catch (error) {
    console.error("Erro ao buscar sessões:", error);
    return NextResponse.json(
      {
        status: false,
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}

// POST - Criar nova sessão
export async function POST(request: NextRequest) {
  const nextSession = await getServerSession(authOptions);
  try {
    const { sessionName } = await request.json();

    if (!sessionName) {
      return NextResponse.json(
        {
          status: false,
          error: "sessionName é obrigatório",
        },
        { status: 400 }
      );
    }

    // Verificar se já existe uma sessão com esse nome
    const existingSession = await prisma.whatsAppSession.findUnique({
      where: { sessionName },
    });

    if (existingSession) {
      return NextResponse.json({
        status: true,
        session: existingSession,
        message: "Sessão já existe",
      });
    }

    // Criar nova sessão
    const session = await prisma.whatsAppSession.create({
      data: {
        sessionName,
        connectionStatus: "DISCONNECTED",
        isActive: true,
        userId: nextSession?.user.id,
      },
    });

    return NextResponse.json({
      status: true,
      session,
      message: "Sessão criada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao criar sessão:", error);
    return NextResponse.json(
      {
        status: false,
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}

// PUT - Atualizar status da sessão
export async function PUT(request: NextRequest) {
  try {
    const { sessionName, connectionStatus, qrCode, numberInfo } =
      await request.json();
    console.log(numberInfo, sessionName, connectionStatus, qrCode);

    if (!sessionName) {
      return NextResponse.json(
        {
          status: false,
          error: "sessionName é obrigatório",
        },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (connectionStatus) {
      updateData.connectionStatus = connectionStatus;
    }

    if (qrCode !== undefined) {
      updateData.qrCode = qrCode;
    }

    if (connectionStatus === "CONNECTED") {
      updateData.lastConnected = new Date();
    }
    if (numberInfo !== undefined) {
      updateData.phoneNumber = numberInfo.id;
      updateData.formattedNumber = numberInfo.id;
    }
    console.log(numberInfo);
    console.log(updateData);

    const session = await prisma.whatsAppSession.update({
      where: { sessionName },
      data: updateData,
    });

    return NextResponse.json({
      status: true,
      session,
      message: "Sessão atualizada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao atualizar sessão:", error);
    return NextResponse.json(
      {
        status: false,
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}

// DELETE - Deletar sessão
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionName = searchParams.get("sessionName");

    if (!sessionName) {
      return NextResponse.json(
        {
          status: false,
          error: "sessionName é obrigatório",
        },
        { status: 400 }
      );
    }

    await prisma.whatsAppSession.delete({
      where: { sessionName },
    });

    return NextResponse.json({
      status: true,
      message: "Sessão deletada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao deletar sessão:", error);
    return NextResponse.json(
      {
        status: false,
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}
