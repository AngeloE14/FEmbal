/**
 * Serverless Function de Vercel: POST /api/chat
 * Frontend → /api/chat → Gemini API → respuesta.
 * La API key (GEMINI_API_KEY) vive únicamente en el servidor.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleChatRequest } from './_chat-core.js';

const MAX_BODY_BYTES = 20_000;

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
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

function clientIpFrom(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress ?? 'unknown';
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'method_not_allowed' }));
    return;
  }

  try {
    const body = await readJsonBody(req);
    const data = (body ?? {}) as { message?: unknown; history?: unknown };
    const result = await handleChatRequest({
      message: data.message,
      history: data.history,
      clientIp: clientIpFrom(req),
    });
    res.statusCode = result.status;
    res.end(JSON.stringify(result.payload));
  } catch (err) {
    const invalid =
      err instanceof Error && ['payload_too_large', 'invalid_json'].includes(err.message);
    res.statusCode = invalid ? 400 : 500;
    res.end(JSON.stringify({ error: invalid ? 'invalid_request' : 'server_error' }));
  }
}
