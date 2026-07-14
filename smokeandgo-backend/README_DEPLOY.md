# 🚀 SmokeAndGo - Despliegue en Render

## Arquitectura

```
📱 APK (usuarios) ──HTTPS──> 🌐 Render (smokeandgo.onrender.com)
                                    │
                                    ├── API REST (Fastify)
                                    ├── WebSocket (Socket.IO)
                                    │
                                    └── Emite eventos ──WebSocket──> 🖥️ Tu PC (receiverLocal.js)
                                                                        │
                                                                        └── Guarda en: C:\Users\Cosmos\Desktop\mujeres desesperadas temp 1-7\
```

## 1. Desplegar Backend en Render

1. Crea una cuenta en [Render](https://render.com) y conecta tu GitHub.
2. Crea un **Web Service**:
   - **Repo**: smokeandgo-backend
   - **Environment**: Node
   - **Build Command**: `npm ci`
   - **Start Command**: `npm start`
   - **Port**: 3000 (Render asigna automáticamente el puerto via `$PORT`)

3. Variables de entorno en Render:
   ```
   JWT_SECRET=tu_secreto_jwt_aqui
   DATABASE_URL=postgresql://...
   # opcional si no usas DATABASE_URL:
   # DB_HOST=...
   # DB_USER=...
   # DB_PASSWORD=...
   # DB_NAME=...
   # DB_PORT=5432
   NODE_ENV=production
   ```

4. Render te dará una URL como: `https://smokeandgo.onrender.com`
   (o puedes usar un dominio propio apuntando a tu backend)

## 2. En tu PC - Receptor de Notificaciones

Para recibir notificaciones **pop-up en Windows** cuando alguien se registre:

```bash
cd smokeandgo-backend
npm run receiver-local
```

O haz doble clic en: `dev/start-receiver.bat`

Esto se conecta vía WebSocket a Render y:
- ✅ Muestra notificación en la bandeja del sistema
- ✅ Guarda el registro en `C:\Users\Cosmos\Desktop\mujeres desesperadas temp 1-7\registrations.txt`
- ✅ Crea un archivo JSON individual por cada registro

## 3. Generar APK

Para generar un APK listo para que cualquiera pueda descargarlo, usa Expo EAS con tu proyecto móvil.

1. Instala el CLI de EAS si aún no lo tienes:

```bash
npm install -g eas-cli
```

2. Entra en la carpeta del proyecto móvil:

```bash
cd mobile
npm install
```

3. Ejecuta el build de producción:

```bash
eas build --platform android --profile production
```

4. Cuando el build termine, Expo te dará un enlace público de descarga.

> Este enlace es el que puedes compartir para que cualquiera descargue el APK.

La APK de producción debe conectar a `https://smokeandgo.onrender.com` como backend.

## 4. Router (para desarrollo local)

Si quieres exponer tu backend desde tu red local hacia Internet usando `mi-dominio.example.com:3000` (por ejemplo porque has configurado tu DNS/servicio de dominio dinámico y mapeado al IP de tu router):

- Abre el puerto `3000` en tu router y haz un forward al puerto `3000` de la IP local de la máquina que ejecuta el backend.
- Asegúrate de que el firewall de Windows permita conexiones al puerto `3000`.
- En la máquina que corre el backend, exporta estas variables de entorno si deseas que la aplicación publique el dominio y puerto:

```bash
export PUBLIC_HOST=mi-dominio.example.com
export PUBLIC_PORT=3000
export PUBLIC_PROTOCOL=http
```

o en Windows PowerShell:

```powershell
$env:PUBLIC_HOST = "mi-dominio.example.com"
$env:PUBLIC_PORT = "3000"
$env:PUBLIC_PROTOCOL = "http"
```

Luego reinicia el backend (`npm start`). El receptor local puede conectarse por defecto a `https://smokeandgo.onrender.com`.

Si quieres probar localmente, el puerto 3000 debe estar abierto en el router apuntando a tu PC.