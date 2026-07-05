@echo off
title SmokeAndGo - Receptor de registros
echo ============================================
echo   SmokeAndGo - Receptor de Notificaciones
echo ============================================
echo.
echo Conectando a: http://smokeandgo.orender.com:3000
echo.
cd /d "%~dp0..\smokeandgo-backend"
node src/receiverLocal.js
pause
