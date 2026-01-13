import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    
    console.log("Tentativa de login:", { email, password: password ? "***" : "undefined" });
    
    if (!email || !password) {
      console.log("Campos obrigatórios faltando");
      return NextResponse.json({ error: "Email e senha são obrigatórios." }, { status: 400 });
    }

    // Verificar se o Prisma está conectado
    try {
      await prisma.$connect();
      console.log("Prisma conectado com sucesso");
    } catch (dbError) {
      console.error("Erro ao conectar com o banco:", dbError);
      return NextResponse.json({ error: "Erro de conexão com o banco de dados" }, { status: 500 });
    }

    // Buscar membro pelo email
    const member = await prisma.team.findUnique({
      where: { email }
    });

    console.log("Membro encontrado:", member ? "Sim" : "Não");

    if (!member) {
      console.log("Membro não encontrado para o email:", email);
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    if (!member.password) {
      console.log("Membro sem senha");
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    // Verificar senha (compatível com hash bcrypt e texto plano)
    let isPasswordValid = false;
    const storedPassword = member.password;
    
    console.log("Tipo de senha armazenada:", storedPassword.startsWith('$2') ? "Hash bcrypt" : "Texto plano");
    
    if (storedPassword.startsWith('$2')) {
      // Senha com hash bcrypt
      isPasswordValid = await bcrypt.compare(password, storedPassword);
    } else {
      // Senha em texto plano (compatibilidade com dados antigos)
      isPasswordValid = password === storedPassword;
    }

    console.log("Senha válida:", isPasswordValid);

    if (!isPasswordValid) {
      console.log("Senha inválida para o usuário:", email);
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    // Função para mapear position para role
    function mapPositionToRole(position: string): string {
      const positionLower = position.toLowerCase();
      
      if (positionLower.includes('gerente')) return 'gerente';
      if (positionLower.includes('administrador')) return 'administrador';
      if (positionLower.includes('consultor')) return 'usuario';
      if (positionLower.includes('diretor')) return 'diretor';
      
      return 'usuario'; // padrão
    }

    // Login bem-sucedido
    const userData = {
        id: member.id,
        name: member.name,
        email: member.email,
        role: mapPositionToRole(member.position),
    };

    console.log("Login bem-sucedido para:", userData);

    return NextResponse.json({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json({ error: "Erro interno do servidor", details: String(error) }, { status: 500 });
  } finally {
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error("Erro ao desconectar Prisma:", disconnectError);
    }
  }
} 