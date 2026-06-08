<#
Run_all.ps1
Ejecuta automáticamente el receptor backend y el proyecto mobile (Expo).
Abrirá dos ventanas de PowerShell separadas: una para el receptor (puerto 4000)
y otra para la app mobile (`expo start`).

Uso: ejecutar desde PowerShell con permisos de usuario:
  cd C:\Users\Cosmos\Desktop\smokeandgo
  .\run_all.ps1

Si PowerShell bloquea la ejecución, permite scripts con:
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

#>

function Ensure-NodeModules($path) {
  $nm = Join-Path $path 'node_modules'
  if (-not (Test-Path $nm)) {
    Write-Output "Instalando dependencias en: $path"
    Push-Location $path
    npm install
    Pop-Location
  }
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition

# Backend receiver
$backend = Join-Path $root 'smokeandgo-backend'
if (Test-Path $backend) {
  Ensure-NodeModules $backend
  Write-Output "Lanzando servidor backend y receptor (puerto por defecto 3000) en ventanas nuevas..."
  Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$backend'; npm run dev"
  Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$backend'; npm run receiver"
} else {
  Write-Output "No se encontró carpeta: $backend"
}

# Mobile (Expo)
$mobile = Join-Path $root 'mobile'
if (Test-Path $mobile) {
  Ensure-NodeModules $mobile
  Write-Output "Lanzando Expo (app mobile) en ventana nueva..."
  Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$mobile'; npx expo start"
} else {
  Write-Output "No se encontró carpeta: $mobile"
}

Write-Output "run_all.ps1: procesos iniciados (receptor + expo). Comprueba las ventanas nuevas."
