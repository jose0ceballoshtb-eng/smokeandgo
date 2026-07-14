@echo off
setlocal enabledelayedexpansion
echo ========================================
echo  SMOKEANDGO - BUILD LOCAL APK
echo ========================================
echo.

REM Set Java from Android Studio (use short path to avoid space issues)
set "JAVA_HOME=C:\PROGRA~1\Android\Android Studio\jbr"
set "PATH=%JAVA_HOME%\bin;%PATH%"

REM Show Java version
echo [1/2] Java:
java -version 2>&1

echo.
echo [2/2] Building APK with Gradle (may take 5-15 minutes)...
echo.

cd /d "%~dp0android"

REM Run gradle build
call .\gradlew assembleRelease --no-daemon

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================
    echo  BUILD EXITOSO!
    echo ========================================
    echo.
    echo Buscando APK generado...
    for /r "%~dp0android\app\build\outputs" %%i in (*.apk) do (
        echo   APK: %%i
        copy "%%i" "%USERPROFILE%\Desktop\" >nul
        echo   COPIADO AL ESCRITORIO: %%i
    )
    if not exist "%~dp0android\app\build\outputs\apk\release\*.apk" (
        echo No se encontraron APK en release. Buscando en toda la carpeta...
        dir /s /b "%~dp0android\app\build\*.apk" 2>nul
    )
) else (
    echo.
    echo ========================================
    echo  ERROR EN EL BUILD ^(codigo: %ERRORLEVEL%^)
    echo ========================================
    echo.
    echo Posibles causas:
    echo - Falta Android SDK Platform (revisa C:\Users\Cosmos\AppData\Local\Android\Sdk\platforms)
    echo - Problema con las credenciales de firma
    echo - Error de compilacion en el codigo
    echo.
    echo Revisa los mensajes de error arriba para mas detalles.
)

echo.
echo Presiona cualquier tecla para salir...
pause >nul