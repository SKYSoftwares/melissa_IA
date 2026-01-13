import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { contactId, tagId } = await request.json();

    if (!contactId || !tagId) {
      return NextResponse.json(
        {
          error: "contactId e tagId são obrigatórios",
        },
        { status: 400 }
      );
    }

    console.log(`🏷️ Adicionando tag ${tagId} ao contato ${contactId}`);

    console.log(contactId);
    const contact = await prisma.whatsAppContact.findFirst({
      where: { phone: contactId },
    });

    if (!contact) {
      return NextResponse.json(
        { error: "Contato não encontrado" },
        { status: 404 }
      );
    }

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

    const existingRelation = await prisma.whatsAppContactTag.findUnique({
      where: {
        contactId_tagId: {
          contactId: contact.id,
          tagId: tagId,
        },
      },
    });

    if (existingRelation) {
      return NextResponse.json(
        {
          error: "Tag já está atribuída a este contato",
        },
        { status: 400 }
      );
    }

    // Criar a relação
    const newRelation = await prisma.whatsAppContactTag.create({
      data: {
        contactId: contact.id,
        tagId: tagId,
      },
      include: {
        tag: true,
      },
    });

    console.log(`✅ Tag "${tag.name}" adicionada ao contato ${contact.phone}`);
    return NextResponse.json(
      {
        message: "Tag adicionada com sucesso",
        relation: newRelation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Erro ao gerenciar tags de contato:", error);
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
    const { contactId, tagId } = await request.json();

    if (!contactId || !tagId) {
      return NextResponse.json(
        {
          error: "contactId e tagId são obrigatórios",
        },
        { status: 400 }
      );
    }

    console.log(`🗑️ Removendo tag ${tagId} do contato ${contactId}`);

    // Verificar se a relação existe
    const relation = await prisma.whatsAppContactTag.findUnique({
      where: {
        contactId_tagId: {
          contactId: contactId,
          tagId: tagId,
        },
      },
      include: {
        tag: true,
        contact: true,
      },
    });

    if (!relation) {
      return NextResponse.json(
        {
          error: "Tag não está atribuída a este contato",
        },
        { status: 404 }
      );
    }

    // Deletar a relação
    await prisma.whatsAppContactTag.delete({
      where: {
        contactId_tagId: {
          contactId: contactId,
          tagId: tagId,
        },
      },
    });

    console.log(
      `✅ Tag "${relation.tag.name}" removida do contato ${relation.contact.phone}`
    );
    return NextResponse.json({ message: "Tag removida com sucesso" });
  } catch (error) {
    console.error("❌ Erro ao gerenciar tags de contato:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get("contactId");

    if (!contactId) {
      return NextResponse.json(
        { error: "contactId é obrigatório" },
        { status: 400 }
      );
    }

    console.log(`🏷️ Buscando tags do contato ${contactId}`);

    const contactTags = await prisma.whatsAppContactTag.findMany({
      where: { contactId: contactId as string },
      include: {
        tag: true,
      },
      orderBy: {
        tag: {
          name: "asc",
        },
      },
    });

    const tags = contactTags.map((ct) => ct.tag);

    console.log(`✅ ${tags.length} tags encontradas para o contato`);
    return NextResponse.json(tags);
  } catch (error) {
    console.error("❌ Erro ao gerenciar tags de contato:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
