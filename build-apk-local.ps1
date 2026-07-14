Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     SMOKEANDGO - BUILD LOCAL APK (sin Expo Cloud)       ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 1. Configurar JAVA_HOME con el JDK de Android Studio
$JAVA_PATH = "C:\Program Files\Android\Android Studio\jbr"
$env:JAVA_HOME = $JAVA_PATH
$env:Path = "$JAVA_PATH\bin;$env:Path"

Write-Host "[1/4] JAVA_HOME configurado: $JAVA_PATH" -ForegroundColor Green

# 2. Verificar Java
$javaVer = & java -version 2>&1
Write-Host "[2/4] Java detectado: $javaVer" -ForegroundColor Green

# 3. Ir al directorio android y ejecutar gradle
$ANDROID_DIR = Join-Path $PSScriptRoot "android"
Set-Location $ANDROID_DIR
Write-Host "[3/4] Directorio: $ANDROID_DIR" -ForegroundColor Green
Write-Host ""

Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║     Generando APK... (puede tardar 5-15 minutos)       ║" -ForegroundColor Yellow
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
Write-Host ""

# Ejecutar gradlew para generar APK de release
& .\gradlew assembleRelease

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ BUILD EXITOSO!" -ForegroundColor Green
    Write-Host ""
    
    # Buscar el APK generado
    $APK_PATH = Join-Path $ANDROID_DIR "app\build\outputs\apk\release"
    $APK_FILES = Get-ChildItem "$APK_PATH\*.apk" -ErrorAction SilentlyContinue
    
    if ($APK_FILES) {
        Write-Host "APK GENERADO:" -ForegroundColor Cyan
        foreach ($apk in $APK_FILES) {
            $sizeInMB = [math]::Round($apk.Length / 1MB, 2)
            Write-Host "  📦 $($apk.Name) - $sizeInMB MB" -ForegroundColor White
            Write-Host "  📁 $($apk.FullName)" -ForegroundColor Gray
        }
        
        # Copiar al escritorio
        $DESKTOP = [Environment]::GetFolderPath("Desktop")
        foreach ($apk in $APK_FILES) {
            $dest = Join-Path $DESKTOP $apk.Name
            Copy-Item $apk.FullName $dest -Force
            Write-Host "  ✅ Copiado a: $dest" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠️  No se encontraron archivos APK en $APK_PATH" -ForegroundColor Yellow
        Write-Host "   Buscando en toda la carpeta app..." -ForegroundColor Yellow
        Get-ChildItem -Path (Join-Path $ANDROID_DIR "app") -Filter "*.apk" -Recurse | ForEach-Object {
            Write-Host "  📦 $($_.FullName)" -ForegroundColor White
        }
    }
} else {
    Write-Host ""
    Write-Host "❌ ERROR EN EL BUILD" -ForegroundColor Red
    Write-Host "Revisa los errores arriba." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "⚠️  Si ves errores de Java, asegúrate de que Android Studio" -ForegroundColor Yellow
    Write-Host "   tenga el JDK en: C:\Program Files\Android\Android Studio\jbr" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Presiona cualquier tecla para salir..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")