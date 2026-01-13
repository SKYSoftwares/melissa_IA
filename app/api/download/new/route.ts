// app/api/download/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fileUrl = searchParams.get("url");
  const fileName = searchParams.get("name") || "arquivo";

  if (!fileUrl) {
    return NextResponse.json(
      { error: "URL do arquivo não informada" },
      { status: 400 }
    );
  }

  const response = await fetch(fileUrl); // servidor do Next pode buscar direto
  if (!response.ok) {
    return NextResponse.json(
      { error: "Erro ao baixar arquivo do storage" },
      { status: 500 }
    );
  }

  const buffer = await response.arrayBuffer();
  const contentType =
    response.headers.get("content-type") || "application/octet-stream";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
