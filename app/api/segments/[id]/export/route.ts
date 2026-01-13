// app/api/segments/[id]/export/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json(
      { status: false, error: "Não autenticado" },
      { status: 401 }
    );
  }

  try {
    // Buscar contatos do segmento
    const segment = await prisma.segment.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: { contacts: true },
    });

    if (!segment) {
      return NextResponse.json(
        { status: false, error: "Segmento não encontrado" },
        { status: 404 }
      );
    }

    // Converter contatos para formato Excel
    const worksheet = XLSX.utils.json_to_sheet(
      segment.contacts.map((c) => ({
        Nome: c.name || "",
        Telefone: c.phone || "",
        Email: c.email || "",
        Empresa: (c as any).empresa || "", // se existir no schema
        ...((c as any).extraData || {}), // mantém colunas extras
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contatos");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Disposition": `attachment; filename="segmento-${segment.name}.xlsx"`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Erro ao exportar Excel:", error);
    return NextResponse.json(
      { status: false, error: "Erro interno" },
      { status: 500 }
    );
  }
}
