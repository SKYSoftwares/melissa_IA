// scripts/ingest-kb.ts
import fs from "fs";
import path from "path";
import { config } from "dotenv";

// 1) Carrega variáveis de ambiente (.env.local > .env)
if (fs.existsSync(".env.local")) config({ path: ".env.local" });
else config();

import OpenAI from "openai";

// Util: aceita um caminho (arquivo PDF ou pasta com PDFs)
function listFiles(inputPath: string): string[] {
  const abs = path.resolve(inputPath);
  if (!fs.existsSync(abs)) throw new Error(`Arquivo/pasta não encontrado: ${abs}`);
  const stat = fs.statSync(abs);
  if (stat.isDirectory()) {
    return fs
      .readdirSync(abs)
      .filter((f) => f.toLowerCase().endsWith(".pdf"))
      .map((f) => path.join(abs, f));
  }
  return [abs];
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY não encontrada (.env.local/.env).");
  }
  const client = new OpenAI({ apiKey });

  const input = process.argv[2];
  if (!input) {
    console.error("Uso: npx tsx scripts/ingest-kb.ts ./arquivo.pdf  # ou ./pasta");
    process.exit(1);
  }

  const files = listFiles(input);
  if (files.length === 0) {
    console.error("Nenhum PDF encontrado no caminho informado.");
    process.exit(1);
  }

  const name =
    process.argv[3] ?? `kb-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "")}`;

  // 1) Criar Vector Store
  const vs = await client.vectorStores.create({ name });
  console.log("🧠 Vector Store criado:", vs.id, `(${vs.name})`);

  // 2) Subir arquivo(s) e aguardar indexação
  const streams = files.map((fp) => fs.createReadStream(fp) as any);
  const batch = await client.vectorStores.fileBatches.uploadAndPoll(vs.id, { files: streams });

  console.log("✅ Indexação:", batch.status, "files:", batch.file_counts);
  console.log("VECTOR_STORE_ID=", vs.id);
}

main().catch((e) => {
  console.error("Erro na ingestão:", e?.message ?? e);
  process.exit(1);
});
