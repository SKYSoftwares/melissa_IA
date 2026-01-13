import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { podeAcessar, getAuthenticatedUser, Role } from "@/lib/permissions";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function GET() {
  try {
    // Busca a primeira empresa cadastrada
    const company = await prisma.company.findFirst();
    return NextResponse.json(company);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar empresa", details: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, cnpj, phone, address, email, website } = await req.json();
    
    // Verificar se já existe uma empresa
    const existingCompany = await prisma.company.findFirst();
    
    if (existingCompany) {
      // Atualizar empresa existente
      const updated = await prisma.company.update({
        where: { id: existingCompany.id },
        data: { name, cnpj, phone, address, email, website },
      });
      return NextResponse.json(updated, { status: 200 });
    } else {
      // Criar nova empresa
      const created = await prisma.company.create({
        data: { name, cnpj, phone, address, email, website },
      });
      return NextResponse.json(created, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Erro ao salvar empresa", details: String(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    // Buscar permissões do banco (mockado aqui)
    // Substitua por busca real do banco usando user.teamId
    const permissoes = {
      usuario: { dashboard: true, whatsapp: true, propostas: true, simuladores: true, relatorios: true, campanhas: true, equipe: false, configuracoes: false },
      gerente: { dashboard: true, whatsapp: true, propostas: true, simuladores: true, relatorios: true, campanhas: true, equipe: true, configuracoes: true },
    };
    if (!podeAcessar(user.role as Role, 'configuracoes', permissoes)) {
      return NextResponse.json({ error: "Sem permissão para alterar configurações." }, { status: 403 });
    }
    const { id, name, cnpj, phone, address } = await req.json();
    if (!id || !name || !cnpj || !phone || !address) {
      return NextResponse.json({ error: "Preencha todos os campos." }, { status: 400 });
    }
    const updated = await prisma.company.update({
      where: { id },
      data: { name, cnpj, phone, address },
    });
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar empresa", details: String(error) }, { status: 500 });
  }
} 