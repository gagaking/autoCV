import https from 'https';

const req = https.request('https://lgw.lovart.ai/v1/chat/completions', { method: 'POST' }, (res) => {
  console.log('lgw.lovart.ai status:', res.statusCode);
});
req.end();

const req2 = https.request('https://api.lovart.ai/v1/chat/completions', { method: 'POST' }, (res) => {
  console.log('api.lovart.ai status:', res.statusCode);
}).on('error', e => console.error('api.lovart.ai error', e.message));
req2.end();
