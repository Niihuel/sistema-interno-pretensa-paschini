@echo off
title Configurar Sistema IT - Inicio Automatico
color 0B

echo ========================================
echo   SISTEMA IT - Configurar Inicio Automatico
echo ========================================
echo.

REM Obtener el directorio raíz (un nivel arriba de scripts)
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%.."
set "ROOT_DIR=%CD%"

echo Creando tarea en el Programador de Tareas de Windows...
echo.

REM Crear tarea programada que se ejecuta al iniciar sesion
schtasks /Create /TN "Sistema IT" /TR "wscript.exe \"%ROOT_DIR%\INICIAR.vbs\"" /SC ONLOGON /RL HIGHEST /F

if %errorlevel% equ 0 (
    echo.
    echo [92m[OK] Tarea creada exitosamente![0m
    echo.
    echo El sistema iniciara automaticamente cuando inicies sesion en Windows.
    echo No veras ninguna ventana CMD - todo correra en segundo plano.
    echo.
    echo Para verificar el estado: ejecuta "status-sistema.bat"
    echo Para detener: ejecuta "stop-sistema-hidden.vbs"
    echo Para reiniciar: ejecuta "restart-sistema-hidden.vbs"
) else (
    echo.
    echo [91m[ERROR] No se pudo crear la tarea.[0m
    echo Asegurate de ejecutar este script como Administrador.
)

echo.
echo Presiona cualquier tecla para salir...
pause > nul
