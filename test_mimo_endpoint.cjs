async function testEndpoint() {
  const apiKey = 'sk-ci037ealwgdgw6cadb3cc4hxzvm2fgfbw2clwc1gvuma1k3k';
  const model = 'mimo-2.5';
  
  const endpoints = [
    'https://lgw.lovart.ai/v1/chat/completions',
    'https://api.lovart.ai/v1/chat/completions',
    'https://api.siliconflow.cn/v1/chat/completions'
  ];

  for (const url of endpoints) {
    console.log(`\nTesting endpoint: ${url}`);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'user', content: 'Say hi' }
          ],
          max_tokens: 50
        })
      });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log(`Response snippet: ${text.slice(0, 500)}`);
    } catch (err) {
      console.error(`Error with ${url}:`, err.message);
    }
  }
}

testEndpoint();
