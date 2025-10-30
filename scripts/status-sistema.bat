@echo off
title Sistema IT - Estado de Servicios
color 0A
echo ========================================
echo   SISTEMA IT - Estado de Servicios
echo ========================================
echo.
pm2 list
echo.
echo ========================================
echo   Logs recientes
echo ========================================
echo.
pm2 logs --lines 20 --nostream
echo.
echo Presiona cualquier tecla para salir...
pause > nul
