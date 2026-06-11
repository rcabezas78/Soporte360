@echo off
:: fix_protocolo.bat - Corrige el handler soporte360:// en la maquina del operador
:: Ejecutar como Administrador

net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit
)

echo Aplicando fix del protocolo soporte360://...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0registrar_protocolo.ps1" -Descargar

echo.
echo Cierra Chrome completamente y volvelo a abrir antes de probar Conectar.
pause
