// app/api/download/all/route.ts
import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";

export async function POST(req: NextRequest) {
  try {
    const { arquivos, defesa } = await req.json();

    if (!arquivos || !Array.isArray(arquivos)) {
      return NextResponse.json(
        { error: "Arquivos não informados" },
        { status: 400 }
      );
    }

    const zip = new JSZip();

    // Defesa comercial → arquivo TXT
    if (defesa) {
      zip.file("defesa-comercial.txt", defesa);
    }

    // Baixar cada arquivo e salvar nas pastas certas
    for (const arquivo of arquivos) {
      try {
        const response = await fetch(arquivo.url);
        if (!response.ok) continue;

        const buffer = await response.arrayBuffer();

        // Decide pasta: proponente ou imovel
        const pasta = arquivo.documentType?.startsWith("imovel")
          ? "imoveis"
          : "proponentes";

        zip.file(`${pasta}/${arquivo.name}`, buffer);
      } catch (err) {
        console.error("Erro ao baixar arquivo:", err);
      }
    }

    const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="proposta-completa.zip"`,
      },
    });
  } catch (err) {
    console.error("Erro ao gerar ZIP:", err);
    return NextResponse.json(
      { error: "Erro interno ao gerar ZIP" },
      { status: 500 }
    );
  }
}
