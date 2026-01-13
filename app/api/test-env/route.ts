import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "Configurada" : "Não configurada",
    ASSISTANT_ID: process.env.ASSISTANT_ID || "Não configurado",
    ALLOW_PUBLIC_AGNES: process.env.ALLOW_PUBLIC_AGNES || "Não configurado"
  });
} 