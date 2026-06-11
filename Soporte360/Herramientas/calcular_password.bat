@echo off
setlocal enabledelayedexpansion
title Soporte360 - Calculadora de Contrasenas

echo ======================================
echo  SOPORTE360 - CALCULADORA DE CLAVES
echo  Copyright (C) 2026 FRCM
echo ======================================
echo.

:loop
set EQUIPO=
set /p EQUIPO="Nombre del equipo (o SALIR para cerrar): "

if /i "!EQUIPO!"=="SALIR" exit
if "!EQUIPO!"=="" goto loop

powershell -NoProfile -Command "$s = 'FRCM2026-' + '!EQUIPO!'; $h = [System.Security.Cryptography.SHA256]::Create(); $b = $h.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($s)); $chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'; $r = ''; for ($i=0; $i -lt 8; $i++) { $r += $chars[$b[$i] %% $chars.Length] }; Write-Host ''; Write-Host ' Equipo   :' '!EQUIPO!'; Write-Host ' Contrasena:' $r; Write-Host ''"

goto loop
