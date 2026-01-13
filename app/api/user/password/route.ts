import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const globalForPrisma = global as unknown as { prisma: PrismaClient }
const prisma = globalForPrisma.prisma || new PrismaClient()
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, currentPassword, newPassword } = body

    // Validações básicas
    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'A nova senha deve ter pelo menos 6 caracteres' }, { status: 400 })
    }

    // Buscar o usuário no banco
    const user = await prisma.team.findUnique({
      where: { id: userId }
    })

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Verificar se a senha atual está correta
    // Se a senha não estiver com hash, comparar diretamente (compatibilidade)
    let isCurrentPasswordValid = false
    
    if (user.password.startsWith('$2')) {
      // Senha já está com hash bcrypt
      isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    } else {
      // Senha em texto plano (compatibilidade com dados antigos)
      isCurrentPasswordValid = currentPassword === user.password
    }

    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 401 })
    }

    // Gerar hash da nova senha
    const saltRounds = 12
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

    // Atualizar a senha no banco
    await prisma.team.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Senha alterada com sucesso' 
    })

  } catch (error) {
    console.error('Erro ao alterar senha:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
} 