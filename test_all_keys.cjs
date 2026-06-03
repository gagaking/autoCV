async function testModels() {
  const apiKey = 'sk-ci037ealwgdgw6cadb3cc4hxzvm2fgfbw2clwc1gvuma1k3k';
  
  const endpoints = [
    'https://api.siliconflow.cn/v1/models',
    'https://api.chatanywhere.org/v1/models',
    'https://api.chatanywhere.tech/v1/models',
    'https://api.openai-hk.com/v1/models',
    'https://api.closeai-china.com/v1/models',
    'https://dashscope.aliyuncs.com/compatible-mode/v1/models',
    'https://api.deepinfra.com/v1/openai/models',
    'https://openrouter.ai/api/v1/models',
    'https://lgw.lovart.ai/v1/models'
  ];

  for (const url of endpoints) {
    console.log(`\nTesting: ${url}`);
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`Status: ${response.status} ${response.statusText}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`Success! Models count: ${data.data?.length || 0}`);
        const names = (data.data || []).map(m => m.id);
        console.log(`Some models: ${names.slice(0, 15).join(', ')}`);
        const matching = names.filter(n => n.toLowerCase().includes('mimo') || n.toLowerCase().includes('milm'));
        if (matching.length > 0) {
          console.log(`👉 MATCHING MODELS found: ${matching.join(', ')}`);
        }
      } else {
        const text = await response.text();
        console.log(`Failed response snippet: ${text.slice(0, 200)}`);
      }
    } catch (err) {
      console.error(`Error with ${url}:`, err.message);
    }
  }
}

testModels();
