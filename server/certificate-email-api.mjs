import express from 'express';
import fs from 'node:fs';
import multer from 'multer';
import nodemailer from 'nodemailer';

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

const placeholderValues = new Set([
  '...',
  'app-password',
  'password',
  'smtp.example.com',
  'usuario@example.com',
]);

function isPlaceholder(value) {
  return placeholderValues.has(String(value).trim().toLowerCase());
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST || '';
  const portStr = process.env.SMTP_PORT || '587';
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  const from = process.env.SMTP_FROM || user;
  const secure = process.env.SMTP_SECURE === 'true';

  return { host, port: Number(portStr), user, pass, from, secure };
}

function validateSmtpConfig() {
  const { host, port, user, pass } = getSmtpConfig();
  const errors = [];

  if (!host) errors.push('SMTP_HOST');
  if (!port || isNaN(port)) errors.push('SMTP_PORT');
  if (!user) errors.push('SMTP_USER');
  if (!pass) errors.push('SMTP_PASS');

  if (errors.length > 0) {
    return { valid: false, message: `Faltan variables SMTP en .env: ${errors.join(', ')}.` };
  }

  if (isPlaceholder(host) || isPlaceholder(user) || isPlaceholder(pass)) {
    return { valid: false, message: 'Reemplaza los valores de ejemplo en .env por credenciales SMTP reales.' };
  }

  return { valid: true };
}

function createTransporter() {
  const { host, port, user, pass, secure } = getSmtpConfig();
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
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

  if (['ENOTFOUND', 'ECONNECTION', 'ETIMEDOUT', 'ESOCKET'].includes(code)) {
    return 'No se pudo conectar al servidor SMTP. Revisa SMTP_HOST, SMTP_PORT y tu conexión a internet.';
  }

  if (code === 'EENVELOPE' || command === 'RCPT TO') {
    return 'El servidor SMTP rechazó el correo destino. Revisa que la dirección sea válida.';
  }

  return `No se pudo enviar el correo: ${error.message}`;
}

function logError(context, error) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [${context}]`, error instanceof Error ? error.stack || error.message : error);
}

app.use((request, response, next) => {
  response.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');

  if (request.method === 'OPTIONS') {
    response.sendStatus(204);
    return;
  }

  next();
});

const configStatus = validateSmtpConfig();

app.get('/health', (_request, response) => {
  response.json({ ok: true, smtp: configStatus });
});

app.get('/api/documents/email/config', (_request, response) => {
  if (!configStatus.valid) {
    response.json({ configured: false, message: configStatus.message });
    return;
  }

  response.json({ configured: true });
});

app.post('/api/documents/email', upload.single('attachment'), async (request, response) => {
  try {
    const recipientEmail = String(request.body.recipientEmail || '').trim();
    const message = String(request.body.message || 'Documento enviado por la pagina web.').trim();
    const subject = String(request.body.subject || 'Documento ESAMS').trim();
    const ccEmail = String(request.body.cc || '').trim();
    const attachment = request.file;

    if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      response.status(400).json({ message: 'Correo destino inválido.' });
      return;
    }

    if (ccEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ccEmail)) {
      response.status(400).json({ message: 'Correo CC inválido.' });
      return;
    }

    if (!attachment?.buffer || attachment.mimetype !== 'application/pdf') {
      response.status(400).json({ message: 'El PDF adjunto no llegó correctamente.' });
      return;
    }

    if (!configStatus.valid) {
      logError('send-email', configStatus.message);
      response.status(500).json({ message: configStatus.message });
      return;
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: recipientEmail,
      subject,
      text: message,
      attachments: [
        {
          content: attachment.buffer,
          contentType: 'application/pdf',
          filename: attachment.originalname || 'documento-embalsamamiento.pdf',
        },
      ],
    };

    if (ccEmail) {
      mailOptions.cc = ccEmail;
    }

    await transporter.sendMail(mailOptions);

    console.log(`[${new Date().toISOString()}] Email sent to ${recipientEmail}`);
    response.json({ ok: true });
  } catch (error) {
    logError('send-email', error);
    response.status(500).json({
      message: getReadableMailError(error),
    });
  }
});

app.listen(port, '0.0.0.0', () => {
  const status = configStatus.valid ? 'SMTP configurado' : `SMTP no configurado: ${configStatus.message}`;
  console.log(`Document email API listening at http://0.0.0.0:${port}`);
  console.log(`  ${status}`);
});
