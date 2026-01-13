import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params

    if (!fileId) {
      return NextResponse.json({ error: 'fileId é obrigatório' }, { status: 400 })
    }

    // Buscar arquivo no banco de dados
    const file = await prisma.proposalFile.findUnique({
      where: { id: fileId },
      select: {
        name: true,
        originalName: true,
        mimeType: true,
        size: true,
        fileData: true,
        createdAt: true
      }
    })

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })
    }

    if (!file.fileData) {
      return NextResponse.json({ error: 'Dados do arquivo não disponíveis' }, { status: 404 })
    }

    // Preparar headers para download
    const headers = new Headers()
    
    // Definir tipo de conteúdo
    if (file.mimeType) {
      headers.set('Content-Type', file.mimeType)
    } else {
      headers.set('Content-Type', 'application/octet-stream')
    }
    
    // Definir nome do arquivo para download
    const fileName = file.originalName || file.name
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`)
    
    // Definir tamanho do arquivo
    if (file.size) {
      headers.set('Content-Length', file.size.toString())
    }

    // Cache control
    headers.set('Cache-Control', 'private, max-age=3600')

    // Retornar arquivo como response
    return new NextResponse(Buffer.from(file.fileData), {
      status: 200,
      headers: headers
    })

  } catch (error: any) {
    console.error('Erro ao servir arquivo:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Método para obter informações do arquivo sem baixar
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params

    const file = await prisma.proposalFile.findUnique({
      where: { id: fileId },
      select: {
        name: true,
        originalName: true,
        mimeType: true,
        size: true,
        createdAt: true
      }
    })

    if (!file) {
      return new NextResponse(null, { status: 404 })
    }

    const headers = new Headers()
    if (file.mimeType) {
      headers.set('Content-Type', file.mimeType)
    }
    if (file.size) {
      headers.set('Content-Length', file.size.toString())
    }
    
    const fileName = file.originalName || file.name
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`)

    return new NextResponse(null, {
      status: 200,
      headers: headers
    })

  } catch (error: any) {
    console.error('Erro ao obter informações do arquivo:', error)
    return new NextResponse(null, { status: 500 })
  }
}