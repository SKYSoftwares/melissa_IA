const fs = require('fs');

async function testSimple() {
  try {
    // Ler o arquivo CSV
    const csvContent = fs.readFileSync('./public/template-contatos.csv', 'utf-8');
    console.log('Conteúdo do CSV:');
    console.log(csvContent);
    
    // Processar manualmente
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    console.log('Headers:', headers);
    
    const contacts = [];
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',');
        const contact = {
          nome: values[0] || '',
          telefone: values[1] || '',
          empresa: values[2] || '',
          email: values[3] || '',
          link: values[4] || ''
        };
        contacts.push(contact);
        console.log('Contato:', contact);
      }
    }
    
    console.log('Total de contatos:', contacts.length);
    
  } catch (error) {
    console.error('Erro:', error);
  }
}

testSimple(); 