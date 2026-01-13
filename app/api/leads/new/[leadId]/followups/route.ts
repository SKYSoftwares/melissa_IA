import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { leadId: string } }
) {
  try {
    const body = await req.json();
    const { observation, type, date, dateNextContact } = body;

    if (!observation || !type || !date) {
      return NextResponse.json(
        { error: "Campos obrigatórios: observation, type, date" },
        { status: 400 }
      );
    }

    const data: any = {
      observations: observation,
      tipeOfContact: type,
      date: new Date(date),
      leadId: params.leadId,
    };

    if (dateNextContact) {
      data.dateNextContact = new Date(dateNextContact);
    }

    const followup = await prisma.followup.create({ data });

    return NextResponse.json(followup, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar follow-up:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
