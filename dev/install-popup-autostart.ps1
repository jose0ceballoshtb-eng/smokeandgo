$ErrorActionPreference = "Stop"

$backendDir = "C:\Users\Cosmos\Desktop\smokeandgo\smokeandgo-backend"
$nodeExe = (Get-Command node).Source
$taskName = "SmokeAndGoPopupReceiver"
$serverUrl = "https://smokeandgo.onrender.com"

if (-not (Test-Path $backendDir)) {
  throw "No se encontró la carpeta backend en: $backendDir"
}

$actionArgs = "/c cd /d `"$backendDir`" && set SERVER_URL=$serverUrl && npm run receiver-local"
$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument $actionArgs
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Inicia receptor popup SmokeAndGo al iniciar sesión" -Force | Out-Null

Write-Host "✅ Tarea creada: $taskName" -ForegroundColor Green
Write-Host "Se iniciará automáticamente al iniciar sesión en Windows." -ForegroundColor Green
Write-Host "Para probar ahora: Start-ScheduledTask -TaskName $taskName" -ForegroundColor Yellow
