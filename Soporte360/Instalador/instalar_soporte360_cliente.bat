@echo off
setlocal enabledelayedexpansion
title Soporte360 - Instalador Cliente

:: ================================
:: AUTO ADMIN
:: ================================
net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit
)

echo ======================================
echo  SOPORTE360 - INSTALADOR CLIENTE
echo  Copyright (C) 2026 FRCM
echo ======================================

:: ================================
:: ANTIVIRUS - PAUSA DURANTE INSTALACION
:: ================================
echo Pausando antivirus para instalacion...
powershell -NoProfile -Command "Add-MpPreference -ExclusionPath '%~dp0' -ErrorAction SilentlyContinue" >nul 2>&1
powershell -NoProfile -Command "Add-MpPreference -ExclusionPath 'C:\Program Files\Soporte360' -ErrorAction SilentlyContinue" >nul 2>&1
powershell -NoProfile -Command "Set-MpPreference -DisableRealtimeMonitoring $true -ErrorAction SilentlyContinue" >nul 2>&1
echo   OK - Proteccion en tiempo real pausada
echo.

:: ================================
:: VERIFICAR ARCHIVOS FUENTE
:: ================================
if not exist "%~dp0soporte360.exe" (
    echo ERROR: No se encuentra soporte360.exe en esta carpeta.
    echo Ruta buscada: %~dp0soporte360.exe
    pause & exit /b 1
)
if not exist "%~dp0sciter.dll" (
    echo ERROR: No se encuentra sciter.dll en esta carpeta.
    pause & exit /b 1
)

:: ================================
:: GENERAR CONTRASENA UNICA POR EQUIPO
:: ================================
for /f "delims=" %%C in ('powershell -NoProfile -Command "[System.Net.Dns]::GetHostName()"') do set EQUIPO=%%C

set PS_TEMP=%TEMP%\gen_pass.ps1
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

echo.
echo Equipo: !EQUIPO!
echo Contrasena generada para este equipo.
echo.

:: ================================
:: 1 - INSTALAR TAILSCALE
:: ================================
echo [1/6] Instalando Tailscale...
if exist "%~dp0tailscale-setup.exe" (
    start /wait "" "%~dp0tailscale-setup.exe" /quiet /norestart
    timeout /t 5 >nul
    net start Tailscale >nul 2>&1
    timeout /t 10 >nul
    start "" /B "C:\Program Files\Tailscale\tailscale.exe" up --authkey tskey-auth-k3HenyVJxC21CNTRL-WsR3zGRcBABSGTuJpbez9B4W82Si8mqe --advertise-tags=tag:clientes --unattended
    timeout /t 15 >nul
    echo   OK - Tailscale instalado
) else (
    echo   AVISO: tailscale-setup.exe no encontrado, omitiendo Tailscale.
)

:: Habilitar RDP
reg add "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Terminal Server" /v fDenyTSConnections /t REG_DWORD /d 0 /f >nul 2>&1
netsh advfirewall firewall set rule group="Remote Desktop" new enable=Yes >nul 2>&1
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" /v LocalAccountTokenFilterPolicy /t REG_DWORD /d 1 /f >nul 2>&1

:: ================================
:: 2 - DETENER SERVICIO ANTERIOR
:: ================================
echo [2/6] Deteniendo servicio anterior...
sc stop Soporte360 >nul 2>&1
taskkill /IM soporte360.exe /F >nul 2>&1
timeout /t 5 >nul
net stop Soporte360 >nul 2>&1
timeout /t 3 >nul

:: ================================
:: 3 - COPIAR ARCHIVOS
:: ================================
echo [3/6] Copiando archivos...
mkdir "C:\Program Files\Soporte360" >nul 2>&1

copy /Y "%~dp0soporte360.exe" "C:\Program Files\Soporte360\soporte360.exe" >nul
if %errorlevel% neq 0 (
    echo.
    echo ERROR: No se pudo copiar soporte360.exe
    echo Posible causa: Antivirus bloqueando el archivo.
    echo Agrega exclusion en el antivirus para:
    echo   %~dp0
    echo   C:\Program Files\Soporte360\
    echo Luego vuelve a ejecutar este instalador.
    pause & exit /b 1
)
:: Verificar que no fue bloqueado silenciosamente (tamanio minimo 1MB)
for %%F in ("C:\Program Files\Soporte360\soporte360.exe") do set TAM=%%~zF
if !TAM! LSS 1000000 (
    echo ERROR: soporte360.exe copiado pero tiene tamanio incorrecto (!TAM! bytes).
    echo El antivirus pudo haber bloqueado o vaciado el archivo.
    pause & exit /b 1
)
echo   OK - soporte360.exe (!TAM! bytes)

copy /Y "%~dp0sciter.dll" "C:\Program Files\Soporte360\sciter.dll" >nul
if %errorlevel% neq 0 (
    echo ERROR: No se pudo copiar sciter.dll
    pause & exit /b 1
)
echo   OK - sciter.dll

if exist "%~dp0updater.bat" (
    copy /Y "%~dp0updater.bat" "C:\Program Files\Soporte360\updater.bat" >nul
    echo   OK - updater.bat
)

:: Copiar scripts opcionales (pueden ser .ps1 o .vbs segun version)
for %%E in (ps1 vbs) do (
    if exist "%~dp0open-url.%%E"            copy /Y "%~dp0open-url.%%E"            "C:\Program Files\Soporte360\open-url.%%E" >nul
    if exist "%~dp0registrar_protocolo.%%E" copy /Y "%~dp0registrar_protocolo.%%E" "C:\Program Files\Soporte360\registrar_protocolo.%%E" >nul
    if exist "%~dp0agente_comandos.%%E"     copy /Y "%~dp0agente_comandos.%%E"     "C:\Program Files\Soporte360\agente_comandos.%%E" >nul
)
if exist "%~dp0agente_comandos.ps1" copy /Y "%~dp0agente_comandos.ps1" "C:\Program Files\Soporte360\agente_comandos.ps1" >nul

powershell -NoProfile -Command "[System.IO.File]::WriteAllText('C:\Program Files\Soporte360\version.txt', '1.4.9', [System.Text.Encoding]::ASCII)" >nul

:: ================================
:: 4 - CONFIGURAR E INSTALAR SERVICIO
:: ================================
echo [4/6] Configurando servidor e instalando servicio...

:: Config perfil SYSTEM
set SYS_CONFIG=C:\Windows\System32\config\systemprofile\AppData\Roaming\Soporte360\config
mkdir "!SYS_CONFIG!" >nul 2>&1
(
echo [options]
echo custom-rendezvous-server = "100.85.203.15:21116"
echo relay-server = "100.85.203.15:21117"
echo api-server = "http://100.85.203.15:21114"
echo key = "wlbUUND37G8QNPvgHIRUnsuKE9BlZVaIMYh7sWtrXOo="
) > "!SYS_CONFIG!\Soporte360.toml"
(
echo [options]
echo approve-mode = "password"
echo verification-method = "use-fixed-password"
echo password = "!RD_PASS!"
) > "!SYS_CONFIG!\Soporte3602.toml"

:: Config perfil usuario actual
set CONFIG_DIR=%APPDATA%\Soporte360\config
mkdir "!CONFIG_DIR!" >nul 2>&1
(
echo [options]
echo custom-rendezvous-server = "100.85.203.15:21116"
echo relay-server = "100.85.203.15:21117"
echo api-server = "http://100.85.203.15:21114"
echo key = "wlbUUND37G8QNPvgHIRUnsuKE9BlZVaIMYh7sWtrXOo="
) > "!CONFIG_DIR!\Soporte360.toml"
(
echo [options]
echo approve-mode = "password"
echo verification-method = "use-fixed-password"
echo password = "!RD_PASS!"
) > "!CONFIG_DIR!\Soporte3602.toml"

"C:\Program Files\Soporte360\soporte360.exe" --install-service >nul 2>&1
timeout /t 3 >nul
net start Soporte360 >nul 2>&1
timeout /t 5 >nul
"C:\Program Files\Soporte360\soporte360.exe" --password "!RD_PASS!" >nul 2>&1
timeout /t 3 >nul
net stop Soporte360 >nul 2>&1
timeout /t 5 >nul
net start Soporte360 >nul 2>&1
timeout /t 5 >nul
echo   OK - Servicio iniciado con contrasena

:: ================================
:: 5 - ACCESO DIRECTO Y REGISTRO
:: ================================
echo [5/6] Creando acceso directo y registrando...

set LNK=%PUBLIC%\Desktop\Soporte360.lnk
powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('!LNK!'); $s.TargetPath = 'C:\Program Files\Soporte360\soporte360.exe'; $s.IconLocation = 'C:\Program Files\Soporte360\soporte360.exe,0'; $s.Description = 'Soporte360 - Asistencia Remota'; $s.Save()"
if exist "!LNK!" ( echo   OK - Acceso directo en escritorio ) else ( echo   AVISO: No se pudo crear acceso directo )

:: Registrar protocolo soporte360://
for %%E in (ps1 vbs bat) do (
    if exist "C:\Program Files\Soporte360\registrar_protocolo.%%E" (
        if "%%E"=="ps1" powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Program Files\Soporte360\registrar_protocolo.ps1" >nul 2>&1
        if "%%E"=="bat" call "C:\Program Files\Soporte360\registrar_protocolo.bat" >nul 2>&1
    )
)

:: Registrar en Programas y caracteristicas
set UNREG=HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Soporte360
reg add "%UNREG%" /v "DisplayName"     /t REG_SZ    /d "Soporte360"                                                 /f >nul 2>&1
reg add "%UNREG%" /v "DisplayVersion"  /t REG_SZ    /d "1.4.9"                                                      /f >nul 2>&1
reg add "%UNREG%" /v "Publisher"       /t REG_SZ    /d "FRCM"                                                       /f >nul 2>&1
reg add "%UNREG%" /v "InstallLocation" /t REG_SZ    /d "C:\Program Files\Soporte360"                                /f >nul 2>&1
reg add "%UNREG%" /v "DisplayIcon"     /t REG_SZ    /d "C:\Program Files\Soporte360\soporte360.exe,0"               /f >nul 2>&1
reg add "%UNREG%" /v "UninstallString" /t REG_SZ    /d "\"C:\Program Files\Soporte360\soporte360.exe\" --uninstall" /f >nul 2>&1
reg add "%UNREG%" /v "NoModify"        /t REG_DWORD /d 1                                                            /f >nul 2>&1
reg add "%UNREG%" /v "NoRepair"        /t REG_DWORD /d 1                                                            /f >nul 2>&1

:: Autostart del tray al iniciar sesion (para que el icono aparezca siempre)
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "Soporte360Tray" /t REG_SZ /d "\"C:\Program Files\Soporte360\soporte360.exe\"" /f >nul 2>&1
echo   OK - Autostart tray registrado

:: Actualizador automatico
schtasks /delete /tn "Soporte360-Updater" /f >nul 2>&1
schtasks /create /tn "Soporte360-Updater" /tr "cmd /c C:\PROGRA~1\Soporte360\updater.bat" /sc ONLOGON /f >nul 2>&1

:: Agente de comandos
for %%E in (ps1 vbs) do (
    if exist "C:\Program Files\Soporte360\agente_comandos.%%E" (
        schtasks /delete /tn "Soporte360-Agente" /f >nul 2>&1
        if "%%E"=="ps1" schtasks /create /tn "Soporte360-Agente" /tr "powershell -WindowStyle Hidden -NoProfile -ExecutionPolicy Bypass -File \"C:\Program Files\Soporte360\agente_comandos.ps1\"" /sc MINUTE /mo 5 /f >nul 2>&1
        if "%%E"=="vbs" schtasks /create /tn "Soporte360-Agente" /tr "wscript.exe //nologo \"C:\Program Files\Soporte360\agente_comandos.vbs\"" /sc MINUTE /mo 5 /f >nul 2>&1
    )
)

:: ================================
:: 6 - INICIAR Y REGISTRAR EN SERVIDOR
:: ================================
echo [6/6] Iniciando Soporte360 y registrando equipo...
start "" "C:\Program Files\Soporte360\soporte360.exe"

echo Esperando ID...
timeout /t 20 >nul
for /f "delims=" %%I in ('"C:\Program Files\Soporte360\soporte360.exe" --get-id 2^>nul') do set RD_ID=%%I
if "!RD_ID!"=="" (
    timeout /t 15 >nul
    for /f "delims=" %%I in ('"C:\Program Files\Soporte360\soporte360.exe" --get-id 2^>nul') do set RD_ID=%%I
)
if "!RD_ID!"=="" set RD_ID=sin-id

:: Obtener IP de Tailscale
for /f "tokens=*" %%i in ('"C:\Program Files\Tailscale\tailscale.exe" ip -4 2^>nul') do set TAILSCALE_IP=%%i
if "!TAILSCALE_IP!"=="" set TAILSCALE_IP=sin-ip

:: Registrar en servidor
set JSON_FILE=%TEMP%\reg_soporte360.json
powershell -NoProfile -Command "[System.IO.File]::WriteAllText('!JSON_FILE!', '{\"nombre\":\"!COMPUTERNAME!\",\"ip\":\"!TAILSCALE_IP!\",\"soporte_id\":\"!RD_ID!\",\"password\":\"!RD_PASS!\",\"grupo\":\"\"}', [System.Text.Encoding]::UTF8)"
curl.exe -s -X POST "http://100.85.203.15:8080/registrar" -H "Content-Type: application/json" -d "@!JSON_FILE!" >nul 2>&1
del "!JSON_FILE!" >nul 2>&1

echo   OK - Equipo registrado (ID: !RD_ID!)

:: Reactivar antivirus
powershell -NoProfile -Command "Set-MpPreference -DisableRealtimeMonitoring $false -ErrorAction SilentlyContinue" >nul 2>&1
echo   OK - Antivirus reactivado

echo.
echo ======================================
echo  Equipo  : !EQUIPO!
echo  ID      : !RD_ID!
echo  Servidor: 100.85.203.15
echo  RDP habilitado
echo  Actualizacion automatica activada
echo  Copyright (C) 2026 FRCM
echo ======================================
pause
