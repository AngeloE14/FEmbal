// ===== API DE CORREO DEL DOCUMENTO =====
// Este archivo levanta un servidor pequeño con Express.
// El frontend le manda un PDF y un correo destino, y este servidor usa SMTP
// para enviar el archivo como adjunto.

import express from 'express';
import fs from 'node:fs';
import multer from 'multer';
import nodemailer from 'nodemailer';

// Cargamos el archivo .env manualmente para no agregar otra dependencia.
// Cada línea con formato CLAVE=VALOR se copia a process.env.
// Esto permite leer SMTP_PASS, SMTP_HOST y las demás variables al iniciar.
function loadLocalEnv() {
  if (!fs.existsSync('.env')) {
    return;
  }

  const lines = fs.readFileSync('.env', 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, '');

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadLocalEnv();

const app = express();

// Multer lee multipart/form-data. Lo usamos porque el navegador envía el PDF
// como archivo adjunto, no como texto normal.
const upload = multer({
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 1,
  },
  storage: multer.memoryStorage(),
});

const port = Number(process.env.EMAIL_API_PORT || 4180);
const allowedOrigin = process.env.EMAIL_API_ALLOWED_ORIGIN || '*';
const placeholderValues = new Set([
  '...',
  'app-password',
  'password',
  'smtp.example.com',
  'usuario@example.com',
]);

function requireEnv(name) {
  const value = process.env[name];

  // Aquí leemos variables como SMTP_PASS desde .env.
  // Si falta una, Nodemailer no sabrá cómo conectarse al correo emisor.
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}.`);
  }

  return value;
}

function validateSmtpConfig() {
  const requiredNames = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  const missingNames = requiredNames.filter((name) => !process.env[name]);

  if (missingNames.length > 0) {
    throw new Error(`Faltan variables SMTP en .env: ${missingNames.join(', ')}.`);
  }

  const placeholderNames = requiredNames.filter((name) => placeholderValues.has(String(process.env[name]).trim()));

  if (placeholderNames.length > 0) {
    throw new Error(`Reemplaza los valores de ejemplo en .env: ${placeholderNames.join(', ')}.`);
  }
}

function createTransporter() {
  validateSmtpConfig();

  // Nodemailer usa estas variables para abrir sesión en el servidor SMTP.
  // process.env.SMTP_PASS es la contraseña o contraseña de aplicación.
  return nodemailer.createTransport({
    auth: {
      pass: requireEnv('SMTP_PASS'),
      user: requireEnv('SMTP_USER'),
    },
    host: requireEnv('SMTP_HOST'),
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
  });
}

function getReadableMailError(error) {
  if (!(error instanceof Error)) {
    return 'No se pudo enviar el correo por un error desconocido.';
  }

  const code = 'code' in error ? String(error.code) : '';
  const command = 'command' in error ? String(error.command) : '';

  if (code === 'EAUTH') {
    return 'No se pudo autenticar el correo emisor. Revisa SMTP_USER y SMTP_PASS en .env.';
  }

  if (code === 'ENOTFOUND' || code === 'ECONNECTION' || code === 'ETIMEDOUT' || code === 'ESOCKET') {
    return 'No se pudo conectar al servidor SMTP. Revisa SMTP_HOST, SMTP_PORT y tu conexión a internet.';
  }

  if (code === 'EENVELOPE' || command === 'RCPT TO') {
    return 'El servidor SMTP rechazó el correo destino. Revisa que la dirección sea válida.';
  }

  return `No se pudo enviar el correo: ${error.message}`;
}

app.use((request, response, next) => {
  // CORS permite que Vite, que corre en otro puerto durante desarrollo,
  // pueda llamar a esta API sin que el navegador bloquee la petición.
  response.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (request.method === 'OPTIONS') {
    response.sendStatus(204);
    return;
  }

  next();
});

app.get('/health', (_request, response) => {
  response.json({ ok: true });
});

app.post('/api/documents/email', upload.single('attachment'), async (request, response) => {
  try {
    // Normalizamos el correo para validar lo que escribió el usuario.
    const recipientEmail = String(request.body.recipientEmail || '').trim();
    const message = String(request.body.message || 'Documento enviado por la pagina web.').trim();
    const attachment = request.file;

    if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      response.status(400).json({ message: 'Correo destino inválido.' });
      return;
    }

    if (!attachment?.buffer || attachment.mimetype !== 'application/pdf') {
      response.status(400).json({ message: 'El PDF adjunto no llegó correctamente.' });
      return;
    }

    const transporter = createTransporter();

    // sendMail es la operación que realmente habla con el servidor SMTP.
    // Si las credenciales o el host están mal, el catch de abajo devuelve
    // un mensaje entendible para mostrarlo en la interfaz.
    await transporter.sendMail({
      attachments: [
        {
          content: attachment.buffer,
          contentType: 'application/pdf',
          filename: attachment.originalname || 'documento-embalsamamiento.pdf',
        },
      ],
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      subject: 'Documento ESAMS',
      text: message || 'Documento enviado por la pagina web.',
      to: recipientEmail,
    });

    response.json({ ok: true });
  } catch (error) {
    response.status(500).json({
      message: getReadableMailError(error),
    });
  }
});

app.listen(port, '127.0.0.1', () => {
  console.log(`Document email API listening at http://127.0.0.1:${port}`);
});
