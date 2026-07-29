# CAMBIOS REALIZADOS

Este documento explica los cambios que se hicieron para solucionar dos problemas:

1. **En celulares no se podían llenar todos los campos del formulario**
2. **El envío por correo del documento mostraba "not found"**

---

## PROBLEMA 1: Formulario en celulares

### ¿Qué pasaba?

Cuando abrías el módulo del documento en un celular y tocabas un campo cerca de la parte de abajo, el teclado del celular tapaba el campo y no se veía lo que escribías.

### ¿Cómo se solucionó?

Se hicieron dos cambios:

#### a) Scroll automático (archivo: `src/components/EmbalmingCertificateModule/index.tsx`)

Se agregó un código que detecta cuándo tocas un input, textarea o select en un celular. Cuando esto pasa, el formulario se desplaza automáticamente para que el campo que estás llenando quede visible, justo en medio de la pantalla.

```
Línea 26-48: useEffect que escucha el evento "focusin"
```

#### b) Más espacio abajo (archivo: `src/components/EmbalmingCertificateModule/EmbalmingCertificateModule.css`)

Se agregó un espacio extra de 45% de la pantalla en la parte de abajo del formulario. Esto hace que cuando el teclado se abre, todavía puedas ver los últimos campos.

```
Línea 1030-1036: padding-bottom: 45vh en pantallas pequeñas
```

---

## PROBLEMA 2: Envío por correo

### ¿Qué pasaba?

El sistema anterior usaba un servidor Express (Node.js) con Nodemailer para enviar correos. Este sistema necesitaba:

- Un servidor adicional corriendo (`npm run certificate:email-api`)
- Credenciales SMTP (servidor de correo saliente)
- Configuración en el archivo `.env`

Como los valores en `.env` eran de ejemplo (`smtp.example.com`, `app-password`, etc.), el sistema nunca podía conectarse al servidor de correo y mostraba el error "not found".

### ¿Cómo se solucionó?

Se cambió a **EmailJS**, un servicio que permite enviar correos directamente desde el navegador (sin necesidad de un servidor propio).

#### Archivos nuevos:

| Archivo | ¿Qué hace? |
|---|---|
| `src/components/EmbalmingCertificateModule/services/emailjs.ts` | Convierte el PDF a base64 y lo envía usando EmailJS |

#### Archivos modificados:

| Archivo | ¿Qué cambió? |
|---|---|
| `src/components/EmbalmingCertificateModule/hooks/useEmailSender.ts` | Ahora usa `emailjs.ts` en vez del servicio anterior |
| `src/components/EmbalmingCertificateModule/PdfActions.tsx` | Se eliminó el chequeo de configuración SMTP (ya no es necesario) |
| `.env` y `.env.example` | Se reemplazaron las variables SMTP por las de EmailJS |
| (sin cambios en package.json) | Se usa fetch directo a la API de EmailJS, no necesita SDK |

---

## CÓMO CONFIGURAR EMAILJS

EmailJS es un servicio gratis que permite enviar correos desde páginas web sin necesidad de un servidor propio. Tiene un límite de 200 correos por mes, suficiente para empezar.

### Paso 1: Crear una cuenta

1. Ve a https://www.emailjs.com/
2. Haz clic en "Sign Up" (Registrarse)
3. Puedes registrarte con Google, GitHub o tu correo

### Paso 2: Conectar un servicio de correo

1. Una vez dentro, ve a la sección **"Email Services"**
2. Haz clic en **"Add New Service"**
3. Elige el proveedor que quieras usar:
   - **Gmail** (necesitarás una contraseña de aplicación de Google)
   - **Outlook**
   - **Amazon SES**
   - Otros...
4. Sigue las instrucciones para conectar tu cuenta
5. Una vez creado, te aparecerá un **Service ID** (algo como `service_abc123def`). Cópialo.

### Paso 3: Crear una plantilla de correo

1. Ve a la sección **"Email Templates"**
2. Haz clic en **"Create New Template"**
3. En el editor, verás variables como `{{to_email}}`, `{{message}}`, `{{subject}}`
4. En la parte de "To Email", escribe: `{{to_email}}`
5. En "Subject", escribe: `{{subject}}`
6. En el cuerpo del mensaje, puedes escribir algo como:
   ```
   {{message}}

   Este correo contiene el documento adjunto.
   ```
7. Haz clic en **"Save"**
8. Copia el **Template ID** (algo como `template_abc123def`)

### Paso 4: Obtener tu Public Key

1. Ve a la sección **"Account"** > **"API Keys"**
2. Copia tu **Public Key** (algo como `abc123def456`)

### Paso 5: Configurar el proyecto

1. Abre el archivo `.env` de tu proyecto
2. Reemplaza los valores de ejemplo:
   ```
   VITE_EMAILJS_PUBLIC_KEY=tu_public_key
   VITE_EMAILJS_SERVICE_ID=tu_service_id
   VITE_EMAILJS_TEMPLATE_ID=tu_template_id
   ```
3. Guarda el archivo
4. Reinicia el servidor de desarrollo (`Ctrl + C` y luego `npm run dev`)

### Paso 6: ¡Listo!

Ahora cuando llenes el formulario del documento y le des clic a "Enviar documento", el PDF se enviará al correo que escribiste.

---

## ¿YA NO NECESITO EL SERVIDOR DE CORREO?

Correcto. El servidor anterior (`server/certificate-email-api.mjs`) ya no es necesario para el envío de correos. EmailJS funciona directamente desde el navegador.

Si quieres, puedes:
- Eliminar el servidor anterior: `rm server/certificate-email-api.mjs`
- Eliminar el servicio anterior: `rm src/components/EmbalmingCertificateModule/services/email.ts`
- Eliminar el comando del `package.json`: la línea `"certificate:email-api"`

Pero no es obligatorio. Dejarlos no afecta el funcionamiento del proyecto.

---

## ARCHIVOS QUE CAMBIARON

```
NUEVOS:
  src/components/EmbalmingCertificateModule/services/emailjs.ts
  docs/CAMBIOS.md

MODIFICADOS:
  src/components/EmbalmingCertificateModule/hooks/useEmailSender.ts
  src/components/EmbalmingCertificateModule/PdfActions.tsx
  src/components/EmbalmingCertificateModule/index.tsx
  src/components/EmbalmingCertificateModule/EmbalmingCertificateModule.css
  .env
  .env.example
  package.json (se agregó @emailjs/browser)
```

---

## SI ALGO SALE MAL

1. **"Falta configurar EmailJS"**: Revisa que los tres valores en `.env` estén escritos correctamente
2. **"Error al convertir el PDF"**: El PDF es muy grande o algo salió mal al generarlo
3. **El correo no llega**: Revisa la carpeta de Spam. Si usaste Gmail, asegúrate de haber creado una "Contraseña de aplicación" en lugar de usar tu contraseña normal
4. **En celular el campo sigue tapado**: Asegúrate de tener la última versión de los archivos (a veces el navegador guarda versiones viejas en la memoria)
