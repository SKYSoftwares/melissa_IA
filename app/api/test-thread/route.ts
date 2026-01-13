import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const ASSISTANT_ID = process.env.ASSISTANT_ID!;
    
    console.log("DEBUG: Testing thread creation...");
    
    // 1. Criar thread
    const thread = await client.beta.threads.create();
    console.log("DEBUG: Thread created with ID:", thread.id);
    
    // 2. Adicionar mensagem
    const message = await client.beta.threads.messages.create(thread.id, {
      role: "user",
      content: "Teste simples",
    });
    console.log("DEBUG: Message created with ID:", message.id);
    
    // 3. Criar run
    const run = await client.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
    });
    console.log("DEBUG: Run created with ID:", run.id);
    
    return NextResponse.json({
      success: true,
      threadId: thread.id,
      messageId: message.id,
      runId: run.id,
      message: "Thread, mensagem e run criados com sucesso"
    });
  } catch (error: any) {
    console.error("DEBUG: Error in test-thread:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      message: "Erro ao criar thread/mensagem/run"
    }, { status: 500 });
  }
} 