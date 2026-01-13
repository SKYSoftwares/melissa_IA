const https = require('https');

async function testGetEvents() {
  try {
    console.log('=== TESTANDO ENDPOINT GET EVENTS ===');
    
    const userEmail = 'eduardomartinspereira20@gmail.com'; // Email do usuário conectado
    const startDate = new Date();
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias
    
    const url = `http://localhost:3000/api/google/get-events?email=${userEmail}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
    
    console.log('URL:', url);
    
    const response = await new Promise((resolve, reject) => {
      const req = https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        });
      });
      req.on('error', reject);
    });
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log(`\n✅ Encontrados ${response.data.events.length} eventos:`);
      response.data.events.forEach((event, index) => {
        console.log(`${index + 1}. ${event.title} - ${event.date} ${event.time}`);
        console.log(`   Cliente: ${event.client}`);
        console.log(`   Tipo: ${event.type}`);
        console.log(`   Duração: ${event.duration} min`);
        console.log(`   Link Meet: ${event.meetLink || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('❌ Erro:', response.data.error);
    }
    
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testGetEvents(); 