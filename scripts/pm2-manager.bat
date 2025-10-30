@echo off
chcp 65001 > nul
title Sistema IT - Gestor PM2
color 0B

:menu
cls
echo ╔══════════════════════════════════════════╗
echo ║     SISTEMA IT - Gestor PM2              ║
echo ╚══════════════════════════════════════════╝
echo.
echo  [1] Iniciar Backend (Producción)
echo  [2] Iniciar Backend (Desarrollo)
echo  [3] Detener Backend
echo  [4] Reiniciar Backend
echo  [5] Ver Estado y Logs
echo  [6] Ver Logs en Tiempo Real
echo  [7] Limpiar Logs
echo  [8] Ver Información Detallada
echo  [9] Actualizar Backend (rebuild + restart)
echo  [0] Salir
echo.
echo ════════════════════════════════════════════
set /p option="Selecciona una opción: "

if "%option%"=="1" goto start_prod
if "%option%"=="2" goto start_dev
if "%option%"=="3" goto stop
if "%option%"=="4" goto restart
if "%option%"=="5" goto status
if "%option%"=="6" goto logs
if "%option%"=="7" goto clear_logs
if "%option%"=="8" goto info
if "%option%"=="9" goto update
if "%option%"=="0" goto end
goto menu

:start_prod
cls
echo ════════════════════════════════════════════
echo  Iniciando Backend en modo PRODUCCIÓN...
echo ════════════════════════════════════════════
echo.
cd /d "%~dp0.."
pm2 start scripts/ecosystem.config.js --env production
if %errorlevel% equ 0 (
    echo.
    echo ✓ Backend iniciado exitosamente
) else (
    echo.
    echo ✗ Error al iniciar el backend
)
echo.
pause
goto menu

:start_dev
cls
echo ════════════════════════════════════════════
echo  Iniciando Backend en modo DESARROLLO...
echo ════════════════════════════════════════════
echo.
cd /d "%~dp0.."
pm2 start scripts/ecosystem.config.js --env development
if %errorlevel% equ 0 (
    echo.
    echo ✓ Backend iniciado exitosamente
) else (
    echo.
    echo ✗ Error al iniciar el backend
)
echo.
pause
goto menu

:stop
cls
echo ════════════════════════════════════════════
echo  Deteniendo Backend...
echo ════════════════════════════════════════════
echo.
pm2 stop sistema-it-backend
if %errorlevel% equ 0 (
    echo.
    echo ✓ Backend detenido exitosamente
) else (
    echo.
    echo ✗ Error al detener el backend
)
echo.
pause
goto menu

:restart
cls
echo ════════════════════════════════════════════
echo  Reiniciando Backend...
echo ════════════════════════════════════════════
echo.
pm2 restart sistema-it-backend
if %errorlevel% equ 0 (
    echo.
    echo ✓ Backend reiniciado exitosamente
) else (
    echo.
    echo ✗ Error al reiniciar el backend
)
echo.
pause
goto menu

:status
cls
echo ════════════════════════════════════════════
echo  Estado Actual del Backend
echo ════════════════════════════════════════════
echo.
pm2 list
echo.
echo ────────────────────────────────────────────
echo  Últimos 30 registros del log
echo ────────────────────────────────────────────
echo.
pm2 logs sistema-it-backend --lines 30 --nostream
echo.
pause
goto menu

:logs
cls
echo ════════════════════════════════════════════
echo  Logs en Tiempo Real
echo ════════════════════════════════════════════
echo  Presiona Ctrl+C para salir
echo ════════════════════════════════════════════
echo.
pm2 logs sistema-it-backend
goto menu

:clear_logs
cls
echo ════════════════════════════════════════════
echo  Limpiar Logs
echo ════════════════════════════════════════════
echo.
set /p confirm="¿Estás seguro? (S/N): "
if /i "%confirm%"=="S" (
    pm2 flush
    echo.
    echo ✓ Logs limpiados exitosamente
) else (
    echo.
    echo ✗ Operación cancelada
)
echo.
pause
goto menu

:info
cls
echo ════════════════════════════════════════════
echo  Información Detallada del Backend
echo ════════════════════════════════════════════
echo.
pm2 describe sistema-it-backend
echo.
echo ────────────────────────────────────────────
echo  Uso de Recursos
echo ────────────────────────────────────────────
echo.
pm2 monit
goto menu

:update
cls
echo ════════════════════════════════════════════
echo  Actualizando Backend...
echo ════════════════════════════════════════════
echo.
echo [1/4] Compilando backend...
cd /d "%~dp0..\backend"
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ✗ Error al compilar el backend
    pause
    goto menu
)
echo ✓ Backend compilado exitosamente
echo.

echo [2/4] Deteniendo proceso actual...
pm2 stop sistema-it-backend
echo.

echo [3/4] Iniciando nuevo proceso...
cd /d "%~dp0.."
pm2 start scripts/ecosystem.config.js --env production
echo.

echo [4/4] Verificando estado...
pm2 list
echo.

if %errorlevel% equ 0 (
    echo ✓ Backend actualizado y reiniciado exitosamente
) else (
    echo ✗ Error durante la actualización
)
echo.
pause
goto menu

:end
cls
echo.
echo ════════════════════════════════════════════
echo  Gracias por usar el Gestor PM2
echo ════════════════════════════════════════════
echo.
timeout /t 2 > nul
exit
