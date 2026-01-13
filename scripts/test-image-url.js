const fetch = require('node-fetch');

async function testImageUrl() {
  const testUrl = "https://mmg.whatsapp.net/o1/v/t24/f2/m231/AQOADLuGkCUws5E6NKs2I8e4y9HuH-6qe4r_3FQTOFPQR0yvV2B6ux3hLvwREncWPAT9CapZ8fwdQ3BsoBUiEip1RPakwnk4ucSSxDbADg?ccb=9-4&oh=01_Q5Aa2AGUo9dt5a3i_QIwONHlQNN1Zm1000yRn6Yq025PZ8TSIA&oe=68BDB51C&_nc_sid=e6ed6c&mms3=true";

  try {
    console.log("🧪 Testando URL da imagem...");
    console.log("📤 URL:", testUrl);

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    console.log("📥 Status:", response.status);
    console.log("📥 Headers:", Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      console.log("✅ URL está acessível!");
      const contentType = response.headers.get('content-type');
      console.log("📄 Content-Type:", contentType);
    } else {
      console.log("❌ URL não está acessível:", response.statusText);
    }
  } catch (error) {
    console.error("❌ Erro ao testar URL:", error.message);
  }
}

testImageUrl(); 