import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// GET - lista segmentos do usuário
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json(
      { status: false, error: "Não autenticado" },
      { status: 401 }
    );
  }

  const segments = await prisma.segment.findMany({
    where: { userId: session.user.id, deletedAt: null },
    include: { contacts: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ status: true, segments });
}

// POST - cria novo segmento
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json(
      { status: false, error: "Não autenticado" },
      { status: 401 }
    );
  }

  const { name, description } = await req.json();

  const segment = await prisma.segment.create({
    data: {
      name,
      description,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ status: true, segment });
}
