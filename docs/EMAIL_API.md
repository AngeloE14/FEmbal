# API de Envío de Documento por Correo

Servidor Express que recibe un PDF desde el frontend y lo envía por correo mediante SMTP.

## Endpoints

### `POST /api/documents/email`

Envía un PDF adjunto a un correo destino.

#### Request

`multipart/form-data`

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `recipientEmail` | string | sí | Correo destino |
| `attachment` | file | sí | Archivo PDF (max 8 MB) |
| `message` | string | no | Texto del cuerpo (default: "Documento enviado por la pagina web.") |
| `subject` | string | no | Asunto del correo (default: "Documento ESAMS") |
| `cc` | string | no | Correo en copia (opcional) |

#### Respuestas

- **200** `{ "ok": true }`
- **400** `{ "message": "Correo destino inválido." }`
- **400** `{ "message": "El PDF adjunto no llegó correctamente." }`
- **500** `{ "message": "..." }` — error SMTP traducido al español

---

### `GET /api/documents/email/config`

Verifica si la configuración SMTP es válida **sin enviar un correo**.

#### Respuestas

- **200** `{ "configured": true }`
- **200** `{ "configured": false, "message": "Reemplaza los valores de ejemplo en .env por credenciales SMTP reales." }`

---

### `GET /health`

Health check básico. Devuelve el estado del servidor y la configuración SMTP.

#### Respuesta

```json
{
  "ok": true,
  "smtp": { "valid": true }
}
```

## Configuración

Variables de entorno en `.env`:

| Variable | Obligatoria | Descripción |
|---|---|---|
| `SMTP_HOST` | sí | Servidor SMTP (ej. `smtp.gmail.com`) |
| `SMTP_PORT` | sí | Puerto SMTP (ej. `587`) |
| `SMTP_SECURE` | no | `true` para TLS/SSL en puerto 465 |
| `SMTP_USER` | sí | Correo emisor |
| `SMTP_PASS` | sí | Contraseña o contraseña de aplicación |
| `SMTP_FROM` | no | Dirección de respuesta (default: `SMTP_USER`) |
| `EMAIL_API_PORT` | no | Puerto del servidor (default: `4180`) |
| `EMAIL_API_ALLOWED_ORIGIN` | no | Origen CORS (default: `*`) |
| `VITE_DOCUMENT_EMAIL_API_URL` | no | URL completa de la API en producción (variable del frontend, no del servidor) |

## Cómo ejecutar

```bash
# 1. Configurar credenciales SMTP reales en .env

# 2. Iniciar la API (puerto 4180)
npm run certificate:email-api

# 3. En desarrollo, Vite proxya automáticamente /api/documents/email
npm run dev
```

## Producción

- El servidor escucha en `0.0.0.0` para aceptar conexiones externas.
- Usa un proxy inverso (nginx, Caddy) o expón el puerto directamente con firewall.
- La variable `VITE_DOCUMENT_EMAIL_API_URL` debe apuntar a la URL pública del servidor.
- Considera configurar `EMAIL_API_ALLOWED_ORIGIN` para restringir CORS al origen del frontend.

## Arquitectura

```
Navegador (React)
  → fetch POST /api/documents/email (multipart/form-data)
    → [Vite proxy en dev] → Express server (puerto 4180)
      → Multer parsea el PDF
      → Nodemailer envía por SMTP
        → Proveedor de correo (Gmail, Outlook, etc.)
```

## Flujo de errores

1. El servidor valida la configuración SMTP al iniciar (endpoint `/config`).
2. Si falta configuración, el endpoint `POST /api/documents/email` responde con error antes de intentar enviar.
3. Los errores SMTP se traducen a mensajes en español legibles para el usuario.
4. Errores del servidor se registran en la consola con timestamp.
