import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Buscar todas as tags do WhatsApp
    console.log("🏷️ Buscando tags do WhatsApp...");

    const tags = await prisma.whatsAppTag.findMany({
      include: {
        _count: {
          select: {
            contacts: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    console.log(`✅ ${tags.length} tags encontradas`);
    return NextResponse.json(tags);
  } catch (error) {
    console.error("❌ Erro ao gerenciar tags do WhatsApp:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Criar nova tag
    const { name, color } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Nome da tag é obrigatório" },
        { status: 400 }
      );
    }

    console.log(`🏷️ Criando nova tag: ${name}`);

    // Verificar se a tag já existe
    const existingTag = await prisma.whatsAppTag.findUnique({
      where: { name: name.trim() },
    });

    if (existingTag) {
      return NextResponse.json(
        { error: "Tag com este nome já existe" },
        { status: 400 }
      );
    }

    const newTag = await prisma.whatsAppTag.create({
      data: {
        name: name.trim(),
        color: color || "#007bff",
      },
      include: {
        _count: {
          select: {
            contacts: true,
          },
        },
      },
    });

    console.log(`✅ Tag criada: ${newTag.name}`);
    return NextResponse.json(newTag, { status: 201 });
  } catch (error) {
    console.error("❌ Erro ao gerenciar tags do WhatsApp:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Deletar tag
    const { tagId } = await request.json();

    if (!tagId) {
      return NextResponse.json(
        { error: "ID da tag é obrigatório" },
        { status: 400 }
      );
    }

    console.log(`🗑️ Deletando tag: ${tagId}`);

    // Verificar se a tag existe
    const tag = await prisma.whatsAppTag.findUnique({
      where: { id: tagId },
    });

    if (!tag) {
      return NextResponse.json(
        { error: "Tag não encontrada" },
        { status: 404 }
      );
    }

    // Deletar tag (as relações com contatos serão deletadas automaticamente devido ao onDelete: Cascade)
    await prisma.whatsAppTag.delete({
      where: { id: tagId },
    });

    console.log(`✅ Tag deletada: ${tag.name}`);
    return NextResponse.json({ message: "Tag deletada com sucesso" });
  } catch (error) {
    console.error("❌ Erro ao gerenciar tags do WhatsApp:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
