import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const ASSISTANT_ID = process.env.ASSISTANT_ID!;
    
    console.log("=== TESTE AGNES SIMPLES ===");
    console.log("1. ASSISTANT_ID:", ASSISTANT_ID);
    
    // 1. Criar thread
    console.log("2. Criando thread...");
    const thread = await client.beta.threads.create();
    console.log("3. Thread criada com ID:", thread.id);
    
    // Armazenar IDs em variáveis separadas
    const threadId = thread.id;
    console.log("3a. Thread ID armazenado:", threadId);
    
    // 2. Adicionar mensagem
    console.log("4. Criando mensagem...");
    const message = await client.beta.threads.messages.create(threadId, {
      role: "user",
      content: "Teste simples",
    });
    console.log("5. Mensagem criada com ID:", message.id);
    
    // 3. Criar run
    console.log("6. Criando run...");
    const run = await client.beta.threads.runs.create(threadId, {
      assistant_id: ASSISTANT_ID,
    });
    console.log("7. Run criado com ID:", run.id);
    
    // Armazenar Run ID em variável separada
    const runId = run.id;
    console.log("7a. Run ID armazenado:", runId);
    
    // 4. Poll status
    console.log("8. Iniciando polling...");
    console.log("8a. Thread ID antes do polling:", threadId);
    console.log("8b. Run ID antes do polling:", runId);
    
    let status = run.status;
    let pollCount = 0;
    
    while (status === "queued" || status === "in_progress" || status === "cancelling") {
      pollCount++;
      console.log(`9. Poll ${pollCount}: status atual = ${status}`);
      console.log(`9a. Poll ${pollCount}: threadId = ${threadId}`);
      console.log(`9b. Poll ${pollCount}: runId = ${runId}`);
      
      await new Promise((r) => setTimeout(r, 600));
      
      console.log(`10. Poll ${pollCount}: recuperando run...`);
      console.log(`10a. Poll ${pollCount}: usando threadId = ${threadId}`);
      console.log(`10b. Poll ${pollCount}: usando runId = ${runId}`);
      
      const retrievedRun = await client.beta.threads.runs.retrieve(threadId, runId);
      status = retrievedRun.status;
      console.log(`11. Poll ${pollCount}: novo status = ${status}`);
      
      if (pollCount > 10) {
        console.log("12. Poll limitado a 10 tentativas, parando...");
        break;
      }
    }
    
    console.log("13. Polling finalizado. Status final:", status);
    
    return NextResponse.json({
      success: true,
      threadId: thread.id,
      messageId: message.id,
      runId: run.id,
      finalStatus: status,
      pollCount: pollCount,
      message: "Teste Agnes completo com sucesso"
    });
    
  } catch (error: any) {
    console.error("=== ERRO NO TESTE AGNES ===");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      message: "Erro no teste Agnes"
    }, { status: 500 });
  }
} 