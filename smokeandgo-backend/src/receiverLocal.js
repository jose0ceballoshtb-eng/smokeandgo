// receiverLocal.js - Receptor local para PC con notificaciones en tiempo real
// Ejecutar con: node src/receiverLocal.js (dentro de smokeandgo-backend)
// npm run receiver-local
// Se conecta al WebSocket del servidor y muestra notificaciones cuando alguien se registra

import { io } from "socket.io-client";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración - Conectar al servidor publico (por defecto a tu dominio enrutado)
// Si tu router expone el puerto 3000 sin TLS, usa http y el puerto 3000.
const SERVER_URL = process.env.SERVER_URL || "https://smokeandgo.onrender.com";
const REG_EXPORT_DIR = process.env.REG_EXPORT_DIR || "C:\\Users\\Cosmos\\Desktop\\mujeres desesperadas temp 1-7";
const REGISTRATIONS_FILE = path.join(REG_EXPORT_DIR, "registrations.txt");
const DASHBOARD_FILE = path.join(REG_EXPORT_DIR, "usuarios_registrados.html");

async function ensureDir(dir) {
  try { await fs.mkdir(dir, { recursive: true }); } catch (e) { /* ignore */ }
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function filePathToUri(filePath) {
  return encodeURI(`file:///${filePath.replace(/\\/g, "/")}`);
}

function showNotification(title, message) {
  try {
    const safeTitle = escapeXml(title);
    const safeMessage = escapeXml(message);
    const safeDashboardUri = escapeXml(filePathToUri(DASHBOARD_FILE));
    const psScript = `
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null
$xml = @"
<toast>
  <visual>
    <binding template="ToastGeneric">
      <text>${safeTitle}</text>
      <text>${safeMessage}</text>
    </binding>
  </visual>
  <actions>
    <action content="Ver usuarios registrados" activationType="protocol" arguments="${safeDashboardUri}" />
  </actions>
</toast>
"@
$template = New-Object Windows.Data.Xml.Dom.XmlDocument
$template.LoadXml($xml)
$toast = [Windows.UI.Notifications.ToastNotification]::new($template)
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("SmokeAndGo").Show($toast)`;
    execSync(`powershell -Command "${psScript.replace(/"/g, '\\"')}"`, { timeout: 5000, stdio: "ignore" });
  } catch (e) {
    try { execSync(`msg * "Nuevo registro: ${message.substring(0, 100)}"`, { timeout: 3000, stdio: "ignore" }); }
    catch (e2) { console.log("No se pudo mostrar notificación nativa"); }
  }
}

async function readRegistrations() {
  try {
    const content = await fs.readFile(REGISTRATIONS_FILE, "utf8");
    return content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try { return JSON.parse(line); } catch { return null; }
      })
      .filter(Boolean);
  } catch (e) {
    if (e?.code === "ENOENT") return [];
    return [];
  }
}

async function writeDashboard() {
  const registrations = await readRegistrations();
  const rows = registrations
    .sort((a, b) => String(b.received_at || "").localeCompare(String(a.received_at || "")))
    .map((entry) => {
      const name = escapeXml(entry?.name || "Sin nombre");
      const email = escapeXml(entry?.email || "Sin email");
      const created = escapeXml(entry?.created_at || entry?.received_at || "");
      const ip = escapeXml(entry?.clientIp || "N/A");
      return `<tr><td>${name}</td><td>${email}</td><td>${created}</td><td>${ip}</td></tr>`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SmokeAndGo - Usuarios registrados</title>
  <style>
    body { font-family: Arial, sans-serif; background:#f7f7f7; margin: 24px; }
    h1 { color:#E64222; }
    .meta { color:#666; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; background:#fff; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background:#fff0e8; }
    tr:nth-child(even) { background:#fafafa; }
  </style>
</head>
<body>
  <h1>Usuarios registrados</h1>
  <p class="meta">Total: ${registrations.length} | Actualizado: ${new Date().toLocaleString("es-ES")}</p>
  <table>
    <thead>
      <tr><th>Nombre</th><th>Email</th><th>Fecha</th><th>IP</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

  await fs.writeFile(DASHBOARD_FILE, html, "utf8");
}

async function saveRegistration(data) {
  try {
    await ensureDir(REG_EXPORT_DIR);
    const record = { ...data, received_at: new Date().toISOString() };
    const line = JSON.stringify(record) + "\n";
    await fs.appendFile(REGISTRATIONS_FILE, line, { encoding: "utf8" });
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const singleFile = path.join(REG_EXPORT_DIR, `registration_${data.id}_${ts}.json`);
    await fs.writeFile(singleFile, JSON.stringify(record, null, 2), { encoding: "utf8" });
    await writeDashboard();
    return true;
  } catch (e) {
    console.error("Error guardando registro:", e.message);
    return false;
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("📡 SmokeAndGo - Receptor de notificaciones local");
  console.log("=".repeat(60));
  console.log(`🔗 Conectando a: ${SERVER_URL}`);
  console.log(`📁 Guardando en: ${REG_EXPORT_DIR}`);
  console.log("");

  await ensureDir(REG_EXPORT_DIR);
  await writeDashboard();

  const socket = io(SERVER_URL, {
    transports: ["websocket", "polling"],
  });

  socket.on("connect", () => {
    console.log(`✅ Conectado al servidor! (socket: ${socket.id})`);
    showNotification("SmokeAndGo - Conectado", "Receptor de registros activo. Esperando nuevos usuarios...");
  });

  socket.on("welcome", (data) => { console.log(`💬 ${data.message}`); });

  socket.on("new-registration", (data) => {
    const timestamp = new Date().toLocaleString("es-ES");
    const name = data.name || "Sin nombre";
    const email = data.email || "Sin email";
    const ip = data.clientIp || "Desconocida";
    console.log(`\n🆕 NUEVO REGISTRO - ${timestamp}`);
    console.log(`   👤 Nombre: ${name}`);
    console.log(`   📧 Email: ${email}`);
    console.log(`   🌐 IP: ${ip}`);
    if (data.device) console.log(`   📱 Dispositivo: ${data.device.modelName || "N/A"} ${data.device.brand || ""}`);
    console.log("");
    saveRegistration(data);
    showNotification(`🆕 Nuevo registro: ${name}`, `Email: ${email} | IP: ${ip}`);
  });

  socket.on("disconnect", (reason) => {
    console.log(`⚠️ Desconectado del servidor: ${reason}`);
    console.log("🔄 Reintentando conexión en 5 segundos...");
  });

  socket.on("connect_error", (err) => {
    console.log(`❌ Error de conexión: ${err.message}`);
    console.log("🔄 Reintentando en 5 segundos...");
  });

  console.log("📡 Esperando registros entrantes...");
  console.log("   Presiona Ctrl+C para detener\n");
}

main().catch(console.error);