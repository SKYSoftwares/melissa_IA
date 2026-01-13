import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'
import csvParser from 'csv-parser'
import { Readable } from 'stream'

const prisma = new PrismaClient()

interface ContactData {
  nome: string
  telefone: string
  empresa?: string
  link?: string
  email?: string
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// Função para validar formato de telefone brasileiro
function validatePhoneNumber(phone: string): boolean {
  // Remove todos os caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '')
  
  // Verifica se tem entre 10 e 13 dígitos (com DDI)
  if (cleanPhone.length < 10 || cleanPhone.length > 13) {
    return false
  }
  
  // Se começa com 55 (DDI Brasil), deve ter 12-13 dígitos
  if (cleanPhone.startsWith('55')) {
    return cleanPhone.length === 12 || cleanPhone.length === 13
  }
  
  // Se não tem DDI, deve ter 10-11 dígitos
  return cleanPhone.length === 10 || cleanPhone.length === 11
}

// Função para formatar telefone
function formatPhoneNumber(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '')
  
  // Se tem DDI (55)
  if (cleanPhone.startsWith('55')) {
    const ddd = cleanPhone.substring(2, 4)
    const number = cleanPhone.substring(4)
    return `+55 ${ddd} ${number.substring(0, 4)}-${number.substring(4)}`
  }
  
  // Se não tem DDI, assume que é brasileiro
  const ddd = cleanPhone.substring(0, 2)
  const number = cleanPhone.substring(2)
  return `+55 ${ddd} ${number.substring(0, 4)}-${number.substring(4)}`
}

// Função para validar dados do contato
function validateContactData(data: ContactData, existingEmails: Set<string>, existingPhones: Set<string>): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Validar nome
  if (!data.nome || data.nome.trim().length < 2) {
    errors.push('Nome deve ter pelo menos 2 caracteres')
  }
  
  // Validar telefone
  if (!data.telefone) {
    errors.push('Telefone é obrigatório')
  } else if (!validatePhoneNumber(data.telefone)) {
    errors.push(`Telefone inválido: ${data.telefone}`)
  } else {
    // Verificar duplicidade de telefone
    const formattedPhone = formatPhoneNumber(data.telefone)
    if (existingPhones.has(formattedPhone)) {
      errors.push(`Telefone duplicado: ${formattedPhone}`)
    }
  }
  
  // Validar email (se fornecido)
  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      errors.push(`Email inválido: ${data.email}`)
    } else if (existingEmails.has(data.email.toLowerCase())) {
      errors.push(`Email duplicado: ${data.email}`)
    }
  }
  
  // Avisos
  if (!data.empresa) {
    warnings.push('Empresa não informada')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Função para processar arquivo CSV
async function processCSV(fileBuffer: Buffer): Promise<ContactData[]> {
  console.log('Iniciando processamento CSV...')
  
  try {
    const csvContent = fileBuffer.toString('utf-8')
    const lines = csvContent.split('\n')
    const contacts: ContactData[] = []
    
    // Pular a primeira linha (headers)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line) {
        const values = line.split(',')
        const contact: ContactData = {
          nome: values[0] || '',
          telefone: values[1] || '',
          empresa: values[2] || '',
          email: values[3] || '',
          link: values[4] || ''
        }
        
        // Limpar caracteres especiais
        contact.nome = contact.nome.replace(/\r/g, '').trim()
        contact.telefone = contact.telefone.replace(/\r/g, '').trim()
        contact.empresa = (contact.empresa || '').replace(/\r/g, '').trim()
        contact.email = (contact.email || '').replace(/\r/g, '').trim()
        contact.link = (contact.link || '').replace(/\r/g, '').trim()
        
        console.log('Contato processado:', contact)
        contacts.push(contact)
      }
    }
    
    console.log('Processamento CSV concluído. Contatos encontrados:', contacts.length)
    return contacts
  } catch (error) {
    console.error('Erro no processamento CSV:', error)
    throw error
  }
}

// Função para processar arquivo Excel
function processExcel(fileBuffer: Buffer): ContactData[] {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
  
  // Encontrar índices das colunas
  const headers = jsonData[0] as string[]
  const nomeIndex = headers.findIndex(h => 
    h?.toLowerCase().includes('nome') || h?.toLowerCase().includes('name')
  )
  const telefoneIndex = headers.findIndex(h => 
    h?.toLowerCase().includes('telefone') || h?.toLowerCase().includes('phone')
  )
  const empresaIndex = headers.findIndex(h => 
    h?.toLowerCase().includes('empresa') || h?.toLowerCase().includes('company')
  )
  const linkIndex = headers.findIndex(h => 
    h?.toLowerCase().includes('link') || h?.toLowerCase().includes('url')
  )
  const emailIndex = headers.findIndex(h => 
    h?.toLowerCase().includes('email')
  )
  
  const contacts: ContactData[] = []
  
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i] as any[]
    if (row && row.length > 0) {
      contacts.push({
        nome: row[nomeIndex] || '',
        telefone: row[telefoneIndex] || '',
        empresa: row[empresaIndex] || '',
        link: row[linkIndex] || '',
        email: row[emailIndex] || ''
      })
    }
  }
  
  return contacts
}

export async function POST(request: NextRequest) {
  try {
    console.log('Iniciando upload de contatos...')
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userEmail = formData.get('userEmail') as string | null
    
    console.log('Arquivo recebido:', file?.name, file?.size, file?.type)
    console.log('E-mail do consultor:', userEmail)
    
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }
    
    // Buscar o ID do consultor
    let createdById: string | null = null;
    if (userEmail) {
      const teamMember = await prisma.team.findUnique({ where: { email: userEmail } });
      if (teamMember) createdById = teamMember.id;
    }
    if (!createdById) {
      return NextResponse.json({ error: 'Consultor não encontrado para o e-mail informado.' }, { status: 400 })
    }
    
    // Validar tipo de arquivo
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    const allowedExtensions = ['.csv', '.xls', '.xlsx']
    
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)
    
    if (!isValidType) {
      return NextResponse.json({ 
        error: 'Tipo de arquivo não permitido. Apenas CSV, XLS e XLSX são aceitos.' 
      }, { status: 400 })
    }
    
    // Validar tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'Arquivo muito grande. Tamanho máximo: 5MB' 
      }, { status: 400 })
    }
    
    // Converter arquivo para buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    
    // Processar arquivo baseado na extensão
    console.log('Processando arquivo com extensão:', fileExtension)
    let contacts: any[]
    if (fileExtension === '.csv') {
      console.log('Processando como CSV...')
      contacts = await processCSV(fileBuffer)
    } else {
      console.log('Processando como Excel...')
      contacts = processExcel(fileBuffer)
    }
    
    console.log('Contatos processados:', contacts.length)
    if (contacts.length === 0) {
      return NextResponse.json({ 
        error: 'Nenhum contato encontrado no arquivo' 
      }, { status: 400 })
    }
    
    // Buscar contatos existentes para validação de duplicidade
    const existingLeads = await prisma.lead.findMany({
      select: { email: true, phone: true }
    })
    
    const existingEmails = new Set(existingLeads.map(lead => lead.email.toLowerCase()))
    const existingPhones = new Set(existingLeads.map(lead => lead.phone))
    
    // Validar todos os contatos
    const validationResults = contacts.map((contact, index) => {
      const result = validateContactData(contact, existingEmails, existingPhones)
      return {
        row: index + 2, // +2 porque começamos do cabeçalho
        contact,
        ...result
      }
    })
    
    // Separar válidos e inválidos
    const validContacts = validationResults.filter(result => result.isValid)
    const invalidContacts = validationResults.filter(result => !result.isValid)
    
    // Salvar contatos válidos
    const savedLeads = []
    console.log(`Iniciando salvamento de ${validContacts.length} contatos válidos`)
    
    for (const result of validContacts) {
      try {
        // Gerar email único se não fornecido
        let email = result.contact.email
        if (!email) {
          const timestamp = Date.now()
          const random = Math.random().toString(36).substr(2, 9)
          email = `contato_${timestamp}_${random}@temp.com`
        }

        const leadData = {
          name: result.contact.nome,
          email: email,
          phone: formatPhoneNumber(result.contact.telefone),
          ocupation: result.contact.empresa || 'Não informado',
          potentialValue: 'R$ 0',
          observations: result.contact.link ? `Link: ${result.contact.link}` : '',
          status: 'novos_leads',
          createdBy: createdById // <-- vincula ao consultor
        }

        console.log('Salvando lead:', leadData)

        const lead = await prisma.lead.create({
          data: leadData
        })
        
        console.log('Lead salvo com sucesso:', lead.id)
        savedLeads.push(lead)
        
        // Adicionar aos sets para evitar duplicidade no mesmo upload
        existingEmails.add(email.toLowerCase())
        existingPhones.add(formatPhoneNumber(result.contact.telefone))
      } catch (error) {
        console.error('Erro ao salvar lead:', error)
        console.error('Dados do lead que falhou:', result.contact)
        result.errors.push('Erro interno ao salvar contato')
        result.isValid = false
        invalidContacts.push(result)
        validContacts.splice(validContacts.indexOf(result), 1)
      }
    }
    
    console.log(`Salvamento concluído. ${savedLeads.length} leads salvos com sucesso`)
    
    return NextResponse.json({
      success: true,
      summary: {
        total: contacts.length,
        valid: validContacts.length,
        invalid: invalidContacts.length,
        saved: savedLeads.length
      },
      validContacts: validContacts.map(result => ({
        row: result.row,
        contact: result.contact,
        warnings: result.warnings
      })),
      invalidContacts: invalidContacts.map(result => ({
        row: result.row,
        contact: result.contact,
        errors: result.errors,
        warnings: result.warnings
      })),
      savedLeads
    })
    
  } catch (error) {
    console.error('Erro no upload de contatos:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
} 