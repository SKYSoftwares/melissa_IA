import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const total = await prisma.whatsAppMessage.count(); // ou WhatsAppMessage, depende do seu model

  return NextResponse.json({ total });
}
