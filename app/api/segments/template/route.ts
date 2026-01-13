// /app/api/segments/template/route.ts
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  // Cabeçalho do Excel
  const data = [
    {
      Nome: "Exemplo João",
      Telefone: "5511999999999",
      Email: "joao@email.com",
      Empresa: "Empresa X",
    },
    {
      Nome: "Exemplo Maria",
      Telefone: "5541998888888",
      Email: "maria@email.com",
      Empresa: "Empresa Y",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Contatos");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Disposition": "attachment; filename=segmento-modelo.xlsx",
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
