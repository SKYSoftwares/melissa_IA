import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    
    // Teste simples: listar modelos disponíveis
    const models = await client.models.list();
    
    return NextResponse.json({
      success: true,
      models: models.data.map(m => m.id).slice(0, 5), // Primeiros 5 modelos
      message: "Conexão com OpenAI funcionando"
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      message: "Erro na conexão com OpenAI"
    }, { status: 500 });
  }
} 