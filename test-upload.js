const fs = require('fs');

async function testUpload() {
  try {
    // Ler o arquivo CSV de teste
    const csvContent = fs.readFileSync('./public/template-contatos.csv');
    
    // Criar FormData manualmente
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2);
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="test-contatos.csv"',
      'Content-Type: text/csv',
      '',
      csvContent.toString(),
      `--${boundary}--`
    ].join('\r\n');

    // Fazer requisição para o endpoint
    const response = await fetch('http://localhost:3001/api/leads/upload', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: body
    });

    const result = await response.json();
    
    console.log('Status:', response.status);
    console.log('Resultado:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Upload realizado com sucesso!');
      console.log(`📊 Resumo: ${result.summary.total} total, ${result.summary.valid} válidos, ${result.summary.saved} salvos`);
    } else {
      console.log('❌ Erro no upload:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testUpload(); 