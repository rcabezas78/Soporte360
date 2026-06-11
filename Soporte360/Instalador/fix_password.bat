@echo off
setlocal enabledelayedexpansion
net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit
)

echo Calculando contrasena para este equipo...

set PS_TEMP=%TEMP%\fix_pass.ps1
del /f "%PS_TEMP%" >nul 2>&1
>>"%PS_TEMP%" echo $s = 'FRCM2026-' + $env:COMPUTERNAME
>>"%PS_TEMP%" echo $h = [System.Security.Cryptography.SHA256]::Create()
>>"%PS_TEMP%" echo $b = $h.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($s))
>>"%PS_TEMP%" echo $chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
>>"%PS_TEMP%" echo $r = ''
>>"%PS_TEMP%" echo for ($i = 0; $i -lt 8; $i++) { $r += $chars[$b[$i] %% $chars.Length] }
>>"%PS_TEMP%" echo Write-Output $r
for /f "delims=" %%P in ('powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "%PS_TEMP%" 2^>nul') do set RD_PASS=%%P
del "%PS_TEMP%" >nul 2>&1

if "!RD_PASS!"=="" (
    echo ERROR: No se pudo calcular la contrasena.
    pause
    exit
)

echo Contrasena calculada para !COMPUTERNAME!: !RD_PASS!

:: Escribir en perfil SYSTEM (donde el servicio lee)
set SYS_CONFIG=C:\Windows\System32\config\systemprofile\AppData\Roaming\Soporte360\config
mkdir "!SYS_CONFIG!" >nul 2>&1
(
echo [options]
echo approve-mode = "password"
echo verification-method = "use-fixed-password"
echo password = "!RD_PASS!"
) > "!SYS_CONFIG!\Soporte3602.toml"
echo Config escrita en perfil SYSTEM.

:: Quitar soporte360.exe del autostart (causa hook de teclado y bloquea captura de sesion)
reg delete "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "Soporte360" /f >nul 2>&1
:: Matar proceso si esta corriendo
taskkill /IM soporte360.exe /F >nul 2>&1
echo Autostart del UI eliminado.

:: Reiniciar el servicio para que lea la nueva config
echo Reiniciando servicio Soporte360...
net stop Soporte360 >nul 2>&1
timeout /t 3 >nul
net start Soporte360 >nul 2>&1
timeout /t 3 >nul

echo.
echo ======================================
echo  Equipo:    !COMPUTERNAME!
echo  Contrasena: !RD_PASS!
echo  Servicio reiniciado OK
echo  Autostart UI: eliminado
echo ======================================
pause
