import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { observations, tipeOfContact, date, dateNextContact } = body;
    const { id } = await params;
    const followup = await prisma.followup.update({
      where: { id: id },
      data: {
        observations,
        tipeOfContact,
        date: date ? new Date(date) : undefined,
        dateNextContact: dateNextContact
          ? new Date(dateNextContact)
          : undefined,
      },
    });

    return NextResponse.json(followup, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
