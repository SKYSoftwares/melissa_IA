import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const proposalId = formData.get('proposalId') as string
    const documentType = formData.get('documentType') as string
    
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    if (!proposalId) {
      return NextResponse.json({ error: 'proposalId é obrigatório' }, { status: 400 })
    }

    // Validar tipo de arquivo
    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ]
    
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.webp']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)
    
    if (!isValidType) {
      return NextResponse.json({ 
        error: 'Tipo de arquivo não permitido. Apenas PDF, DOC, DOCX, JPG, PNG, GIF são aceitos.' 
      }, { status: 400 })
    }

    // Validar tamanho (máximo 25MB)
    const maxSize = 25 * 1024 * 1024 // 25MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'Arquivo muito grande. Tamanho máximo: 25MB' 
      }, { status: 400 })
    }

    // Verificar se a proposta existe
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId }
    })

    if (!proposal) {
      return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 })
    }

    // Converter arquivo para buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Salvar arquivo no banco de dados
    const savedFile = await prisma.proposalFile.create({
      data: {
        name: `${documentType}_${file.name}`,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        fileData: buffer,
        documentType: documentType,
        proposalId: proposalId,
        url: null // Não usar URL para arquivos no banco
      }
    })

    return NextResponse.json({ 
      success: true, 
      fileId: savedFile.id,
      fileName: savedFile.name,
      originalName: savedFile.originalName,
      size: savedFile.size,
      mimeType: savedFile.mimeType
    }, { status: 201 })

  } catch (error: any) {
    console.error('Erro no upload:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}