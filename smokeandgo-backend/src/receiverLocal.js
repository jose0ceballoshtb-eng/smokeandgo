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
const SERVER_URL = process.env.SERVER_URL || "http://smokeandgo.orender.com:3000";
const REG_EXPORT_DIR = process.env.REG_EXPORT_DIR || "C:\\Users\\Cosmos\\Desktop\\mujeres desesperadas temp 1-7";

async function ensureDir(dir) {
  try { await fs.mkdir(dir, { recursive: true }); } catch (e) { /* ignore */ }
}

function showNotification(title, message) {
  try {
    const safeTitle = title.replace(/'/g, "''");
    const safeMessage = message.replace(/'/g, "''");
    const psScript = `
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null
$template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
$textNodes = $template.GetElementsByTagName("text")
$textNodes.Item(0).AppendChild($template.CreateTextNode('${safeTitle}')) > $null
$textNodes.Item(1).AppendChild($template.CreateTextNode('${safeMessage}')) > $null
$toast = [Windows.UI.Notifications.ToastNotification]::new($template)
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("SmokeAndGo").Show($toast)`;
    execSync(`powershell -Command "${psScript.replace(/"/g, '\\"')}"`, { timeout: 5000, stdio: "ignore" });
  } catch (e) {
    try { execSync(`msg * "Nuevo registro: ${message.substring(0, 100)}"`, { timeout: 3000, stdio: "ignore" }); }
    catch (e2) { console.log("No se pudo mostrar notificación nativa"); }
  }
}

async function saveRegistration(data) {
  try {
    await ensureDir(REG_EXPORT_DIR);
    const outFile = path.join(REG_EXPORT_DIR, "registrations.txt");
    const record = { ...data, received_at: new Date().toISOString() };
    const line = JSON.stringify(record) + "\n";
    await fs.appendFile(outFile, line, { encoding: "utf8" });
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const singleFile = path.join(REG_EXPORT_DIR, `registration_${data.id}_${ts}.json`);
    await fs.writeFile(singleFile, JSON.stringify(record, null, 2), { encoding: "utf8" });
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