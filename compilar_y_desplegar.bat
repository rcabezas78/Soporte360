@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
title Soporte360 - Compilar y Desplegar

set VCPKG_ROOT=C:\vcpkg
set LIBCLANG_PATH=C:\Program Files\LLVM\bin
set PATH=%LIBCLANG_PATH%;C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin;%PATH%
set DESTINO=C:\Sistemas\Soporte360\Instalador

cd /d "%~dp0"
set INICIO=%TIME%

echo.
echo ============================================================
echo   Soporte360 - Compilacion y Despliegue
echo ============================================================
echo   Maquina  : %COMPUTERNAME%
echo   Fuente   : %~dp0
echo   Destino  : %DESTINO%
echo   Inicio   : %INICIO%
echo ============================================================
echo.

echo [1/2] Compilando...
cargo build --release
if errorlevel 1 ( echo. & echo ERROR: Compilacion fallida. & pause & exit /b 1 )

echo.
echo [2/2] Copiando a Instalador...
if not exist "%DESTINO%" mkdir "%DESTINO%"
copy /y "target\release\soporte360.exe" "%DESTINO%\soporte360.exe" >nul
if errorlevel 1 ( echo ERROR: No se pudo copiar. & pause & exit /b 1 )
echo   OK - soporte360.exe copiado

if exist "target\release\sciter.dll" (
    copy /y "target\release\sciter.dll" "%DESTINO%\sciter.dll" >nul
    echo   OK - sciter.dll copiado
)

echo.
echo ============================================================
echo   BUILD COMPLETADO - %TIME%
echo   Archivo: %DESTINO%\soporte360.exe
echo ============================================================
pause >nul