// Função utilitária para upload de arquivos
export async function uploadFileToDatabase(
  file: File, 
  proposalId: string, 
  documentType: string
): Promise<{ success: boolean; fileId?: string; error?: string }> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('proposalId', proposalId)
    formData.append('documentType', documentType)

    const response = await fetch('/api/files/upload', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()

    if (!response.ok) {
      return { success: false, error: result.error || 'Erro no upload' }
    }

    return { success: true, fileId: result.fileId }
  } catch (error) {
    console.error('Erro no upload:', error)
    return { success: false, error: 'Erro de conexão' }
  }
}

// Função para obter URL de download do arquivo
export function getFileDownloadUrl(fileId: string): string {
  return `/api/files/${fileId}`
}

// Função para validar arquivo antes do upload
export function validateFile(file: File): { valid: boolean; error?: string } {
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
    return { 
      valid: false, 
      error: 'Tipo de arquivo não permitido. Apenas PDF, DOC, DOCX, JPG, PNG, GIF são aceitos.' 
    }
  }

  // Validar tamanho (máximo 25MB)
  const maxSize = 25 * 1024 * 1024 // 25MB
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: 'Arquivo muito grande. Tamanho máximo: 25MB' 
    }
  }

  return { valid: true }
}

// Função para formatar tamanho do arquivo
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Função para obter ícone baseado no tipo de arquivo
export function getFileIcon(mimeType: string | null): string {
  if (!mimeType) return '📄'
  
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType === 'application/pdf') return '📕'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
  
  return '📄'
}