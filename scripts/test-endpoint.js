const fetch = require('node-fetch');

async function testEndpoint() {
  try {
    const response = await fetch('http://localhost:3000/api/leads/cmddr5c9m0001v4ycyv4y8eoi/followups');
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Dados retornados:', JSON.stringify(data, null, 2));
    
    if (Array.isArray(data)) {
      console.log(`\nEncontrados ${data.length} follow ups:`);
      data.forEach((f, i) => {
        console.log(`${i + 1}. ${f.observations} (${f.tipeOfContact}) - ${new Date(f.date).toLocaleString()}`);
      });
    }
  } catch (error) {
    console.error('Erro ao testar endpoint:', error);
  }
}

testEndpoint(); 