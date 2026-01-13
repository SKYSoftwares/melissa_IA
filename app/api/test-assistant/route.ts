import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const ASSISTANT_ID = process.env.ASSISTANT_ID!;
    
    // Teste: recuperar informações do Assistant
    const assistant = await client.beta.assistants.retrieve(ASSISTANT_ID);
    
    return NextResponse.json({
      success: true,
      assistant: {
        id: assistant.id,
        name: assistant.name,
        model: assistant.model,
        instructions: assistant.instructions,
        tools: assistant.tools
      },
      message: "Assistant encontrado com sucesso"
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      message: "Erro ao acessar o Assistant"
    }, { status: 500 });
  }
} 