/**
 * Mini-servidor de desarrollo para el chatbot (Node >= 20).
 * Sirve POST /api/chat con la MISMA lógica que usa la Serverless
 * Function de producción (api/_chat-core.js), para poder probar
 * en local sin contratar nada adicional.
 *
 * Uso: npm run api   (lee GEMINI_API_KEY desde .env)
 */

import http from 'node:http';
import { handleChatRequest } from '../api/_chat-core.js';

const PORT = Number(process.env.PORT ?? 8787);
const MAX_BODY_BYTES = 20_000;

if (!process.env.GEMINI_API_KEY) {
  console.error('[api-dev] Falta GEMINI_API_KEY. Defínela en tu archivo .env');
  process.exit(1);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('payload_too_large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : null);
      } catch {
        reject(new Error('invalid_json'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET' && req.url === '/api/chat/health') {
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method !== 'POST' || !req.url.startsWith('/api/chat')) {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'not_found' }));
    return;
  }

  try {
    const body = await readJsonBody(req);
    const data = body ?? {};
    const result = await handleChatRequest({
      message: data.message,
      history: data.history,
      clientIp: req.socket.remoteAddress ?? 'unknown',
    });
    res.statusCode = result.status;
    res.end(JSON.stringify(result.payload));
  } catch (err) {
    const invalid =
      err instanceof Error && ['payload_too_large', 'invalid_json'].includes(err.message);
    res.statusCode = invalid ? 400 : 500;
    res.end(JSON.stringify({ error: invalid ? 'invalid_request' : 'server_error' }));
  }
});

server.listen(PORT, () => {
  console.log(`[api-dev] Endpoint de chat listo en http://localhost:${PORT}/api/chat`);
});
