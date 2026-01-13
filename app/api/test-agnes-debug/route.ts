import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const ASSISTANT_ID = process.env.ASSISTANT_ID!;
    
    console.log("=== DEBUG AGNES ===");
    console.log("1. ASSISTANT_ID:", ASSISTANT_ID);
    
    // 1. Criar thread
    console.log("2. Criando thread...");
    const thread = await client.beta.threads.create();
    console.log("3. Thread criada:", thread);
    console.log("3a. Thread ID:", thread.id);
    console.log("3b. Thread ID type:", typeof thread.id);
    console.log("3c. Thread ID length:", thread.id ? thread.id.length : "undefined");
    
    // Verificar se thread.id existe
    if (!thread.id) {
      throw new Error("Thread criada mas sem ID");
    }
    
    // 2. Adicionar mensagem
    console.log("4. Criando mensagem...");
    const message = await client.beta.threads.messages.create(thread.id, {
      role: "user",
      content: "Teste simples",
    });
    console.log("5. Mensagem criada:", message.id);
    
    // 3. Criar run
    console.log("6. Criando run...");
    const run = await client.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
    });
    console.log("7. Run criado:", run.id);
    
    // 4. Testar retrieve simples
    console.log("8. Testando retrieve...");
    console.log("8a. Thread ID para retrieve:", thread.id);
    console.log("8b. Run ID para retrieve:", run.id);
    console.log("8c. Thread ID type:", typeof thread.id);
    console.log("8d. Run ID type:", typeof run.id);
    
    // Verificar se as variáveis ainda existem
    if (typeof thread.id === 'undefined') {
      throw new Error("Thread ID se tornou undefined");
    }
    
    if (typeof run.id === 'undefined') {
      throw new Error("Run ID se tornou undefined");
    }
    
    const retrievedRun = await client.beta.threads.runs.retrieve(thread.id, run.id);
    console.log("9. Retrieve bem-sucedido, status:", retrievedRun.status);
    
    return NextResponse.json({
      success: true,
      threadId: thread.id,
      messageId: message.id,
      runId: run.id,
      retrievedStatus: retrievedRun.status,
      message: "Debug Agnes completo com sucesso"
    });
    
  } catch (error: any) {
    console.error("=== ERRO NO DEBUG AGNES ===");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      message: "Erro no debug Agnes"
    }, { status: 500 });
  }
} 