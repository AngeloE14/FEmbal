// ===== CERTIFICATE MODULE =====
// API desacoplada para envío real del certificado.
// Recibe multipart/form-data:
// - recipientEmail: correo destino
// - certificate: JSON con los datos del certificado
// - attachment: PDF generado en el cliente

import express from 'express';
import fs from 'node:fs';
import multer from 'multer';
import nodemailer from 'nodemailer';

// Carga .env local sin agregar otro runtime dependency. Esto evita el caso común
// donde el endpoint "funciona" pero no envía porque SMTP_* nunca llegó a process.env.
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
const upload = multer({
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 1,
  },
  storage: multer.memoryStorage(),
});

const port = Number(process.env.EMAIL_API_PORT || 4180);
const allowedOrigin = process.env.EMAIL_API_ALLOWED_ORIGIN || '*';

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}.`);
  }

  return value;
}

function createTransporter() {
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

function getCertificateSubject(certificate) {
  const deceasedName = certificate?.deceasedName?.trim();
  return deceasedName
    ? `Certificado de embalsamamiento - ${deceasedName}`
    : 'Certificado de embalsamamiento';
}

app.use((request, response, next) => {
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

app.post('/api/certificates/email', upload.single('attachment'), async (request, response) => {
  try {
    const recipientEmail = String(request.body.recipientEmail || '').trim();
    const certificate = JSON.parse(String(request.body.certificate || '{}'));
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
    await transporter.sendMail({
      attachments: [
        {
          content: attachment.buffer,
          contentType: 'application/pdf',
          filename: attachment.originalname || 'certificado-embalsamamiento.pdf',
        },
      ],
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      subject: getCertificateSubject(certificate),
      text: [
        'Se adjunta el certificado de embalsamamiento generado desde EAMS.',
        '',
        certificate?.deceasedName ? `Fallecido: ${certificate.deceasedName}` : '',
        certificate?.procedureDate ? `Fecha: ${certificate.procedureDate}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      to: recipientEmail,
    });

    response.json({ ok: true });
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'No se pudo enviar el correo.',
    });
  }
});

app.listen(port, '127.0.0.1', () => {
  console.log(`Certificate email API listening at http://127.0.0.1:${port}`);
});
