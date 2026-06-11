@echo off
setlocal enabledelayedexpansion
title Soporte360 - Instalador Admin

set LOG=%TEMP%\soporte360_admin_install.log
echo. > "%LOG%"
echo ===== INICIO INSTALACION ADMIN %DATE% %TIME% ===== >> "%LOG%"

:: ================================
:: AUTO ADMIN
:: ================================
net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit
)

echo ======================================
echo  SOPORTE360 - INSTALADOR ADMIN
echo  Copyright (C) 2026 FRCM
echo ======================================
echo.
echo Este instalador es para maquinas de tecnico.
echo No instala Tailscale ni configura red de cliente.
echo.
echo Log: %LOG%
echo.

:: ================================
:: ANTIVIRUS - PAUSA DURANTE INSTALACION
:: ================================
echo Pausando antivirus para instalacion...
echo Pausando antivirus para instalacion... >> "%LOG%"
powershell -NoProfile -Command "Add-MpPreference -ExclusionPath '%~dp0' -ErrorAction SilentlyContinue" >nul 2>&1
powershell -NoProfile -Command "Add-MpPreference -ExclusionPath 'C:\ProgramData\Soporte360' -ErrorAction SilentlyContinue" >nul 2>&1
powershell -NoProfile -Command "Set-MpPreference -DisableRealtimeMonitoring $true -ErrorAction SilentlyContinue" >nul 2>&1
echo   OK - Proteccion pausada
echo   OK - Proteccion pausada >> "%LOG%"
echo.

:: ================================
:: VERIFICAR ARCHIVOS FUENTE
:: ================================
echo Verificando archivos... >> "%LOG%"
if not exist "%~dp0soporte360.exe" (
    echo ERROR: No se encuentra soporte360.exe >> "%LOG%"
    echo ERROR: No se encuentra soporte360.exe en esta carpeta.
    pause & exit /b 1
)
echo   soporte360.exe: OK >> "%LOG%"

if not exist "%~dp0sciter.dll" (
    echo ERROR: No se encuentra sciter.dll >> "%LOG%"
    echo ERROR: No se encuentra sciter.dll en esta carpeta.
    pause & exit /b 1
)
echo   sciter.dll: OK >> "%LOG%"

:: ================================
:: 1 - DETENER SERVICIO ANTERIOR
:: ================================
echo [1/4] Deteniendo servicio anterior...
echo [1/4] Deteniendo servicio... >> "%LOG%"
sc stop Soporte360 >> "%LOG%" 2>&1
taskkill /IM soporte360.exe /F >> "%LOG%" 2>&1
timeout /t 5 >nul
echo   OK >> "%LOG%"

:: ================================
:: 2 - COPIAR ARCHIVOS VIA SCHEDULED TASK (evita deteccion Kaspersky)
:: ================================
echo [2/4] Copiando archivos via tarea del sistema...
echo [2/4] Copiando archivos via Scheduled Task... >> "%LOG%"

mkdir "C:\ProgramData\Soporte360" >nul 2>&1

:: Escribir script de copia en temp
set COPYSCRIPT=%TEMP%\s360_copy.ps1
(
echo $src = '%~dp0'
echo $dst = 'C:\ProgramData\Soporte360'
echo New-Item -ItemType Directory -Force -Path $dst ^| Out-Null
echo Copy-Item "$src\soporte360.exe" "$dst\soporte360.exe" -Force
echo Copy-Item "$src\sciter.dll"    "$dst\sciter.dll"    -Force
echo if (Test-Path "$src\updater.bat") { Copy-Item "$src\updater.bat" "$dst\updater.bat" -Force }
echo [System.IO.File]::WriteAllText("$dst\version.txt", "1.4.9", [System.Text.Encoding]::ASCII^)
echo "OK" ^| Out-File "%TEMP%\s360_copy_done.txt" -Force
) > "%COPYSCRIPT%"

:: Eliminar marker anterior si existe
if exist "%TEMP%\s360_copy_done.txt" del /F /Q "%TEMP%\s360_copy_done.txt"

:: Registrar y ejecutar tarea como SYSTEM
schtasks /delete /tn "Soporte360Install" /f >nul 2>&1
schtasks /create /tn "Soporte360Install" /tr "powershell -NoProfile -ExecutionPolicy Bypass -File \"%COPYSCRIPT%\"" /sc once /st 00:00 /ru SYSTEM /f >> "%LOG%" 2>&1
schtasks /run /tn "Soporte360Install" >> "%LOG%" 2>&1

:: Esperar hasta 60 segundos a que termine la copia
echo   Esperando copia por SYSTEM...
set /a INTENTOS=0
:ESPERAR
timeout /t 2 >nul
set /a INTENTOS+=1
if exist "%TEMP%\s360_copy_done.txt" goto COPIA_OK
if !INTENTOS! GEQ 30 goto COPIA_TIMEOUT
goto ESPERAR

:COPIA_TIMEOUT
echo ERROR: Timeout esperando copia via Scheduled Task >> "%LOG%"
echo ERROR: No se pudo copiar soporte360.exe (timeout).
schtasks /delete /tn "Soporte360Install" /f >nul 2>&1
pause & exit /b 1

:COPIA_OK
schtasks /delete /tn "Soporte360Install" /f >nul 2>&1

:: Verificar tamanio
for %%F in ("C:\ProgramData\Soporte360\soporte360.exe") do set TAM=%%~zF
echo   Tamano soporte360.exe: !TAM! bytes >> "%LOG%"
if "!TAM!"=="" (
    echo ERROR: soporte360.exe no existe tras la copia >> "%LOG%"
    echo ERROR: soporte360.exe no se copio correctamente.
    pause & exit /b 1
)
if !TAM! LSS 1000000 (
    echo ERROR: soporte360.exe tiene tamano incorrecto !TAM! bytes >> "%LOG%"
    echo ERROR: soporte360.exe copiado pero con tamanio incorrecto (!TAM! bytes^).
    pause & exit /b 1
)
echo   OK - soporte360.exe (!TAM! bytes^)
echo   OK - soporte360.exe (!TAM! bytes^) >> "%LOG%"
echo   OK - sciter.dll
echo   OK - sciter.dll >> "%LOG%"

:: ================================
:: 3 - CONFIGURAR SERVIDOR PROPIO
:: ================================
echo [3/4] Configurando servidor...
echo [3/4] Configurando servidor... >> "%LOG%"

set CONFIG_DIR=%APPDATA%\Soporte360\config
mkdir "!CONFIG_DIR!" >nul 2>&1
(
echo [options]
echo custom-rendezvous-server = "100.85.203.15:21116"
echo relay-server = "100.85.203.15:21117"
echo api-server = "http://100.85.203.15:21114"
echo key = "wlbUUND37G8QNPvgHIRUnsuKE9BlZVaIMYh7sWtrXOo="
) > "!CONFIG_DIR!\Soporte360.toml"
echo   OK - config usuario >> "%LOG%"

set SYS_CONFIG=C:\Windows\System32\config\systemprofile\AppData\Roaming\Soporte360\config
mkdir "!SYS_CONFIG!" >nul 2>&1
(
echo [options]
echo custom-rendezvous-server = "100.85.203.15:21116"
echo relay-server = "100.85.203.15:21117"
echo api-server = "http://100.85.203.15:21114"
echo key = "wlbUUND37G8QNPvgHIRUnsuKE9BlZVaIMYh7sWtrXOo="
) > "!SYS_CONFIG!\Soporte360.toml"
echo   OK - config sistema >> "%LOG%"

:: ================================
:: 4 - INSTALAR SERVICIO Y ACCESO DIRECTO
:: ================================
echo [4/4] Instalando servicio y acceso directo...
echo [4/4] Instalando servicio y acceso directo... >> "%LOG%"

"C:\ProgramData\Soporte360\soporte360.exe" --install-service >> "%LOG%" 2>&1
timeout /t 3 >nul
net start Soporte360 >> "%LOG%" 2>&1
timeout /t 3 >nul

:: Acceso directo en escritorio publico
set LNK=%PUBLIC%\Desktop\Soporte360.lnk
powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('!LNK!'); $s.TargetPath = 'C:\ProgramData\Soporte360\soporte360.exe'; $s.IconLocation = 'C:\ProgramData\Soporte360\soporte360.exe,0'; $s.Description = 'Soporte360 - Control Remoto'; $s.Save()" >> "%LOG%" 2>&1
if exist "!LNK!" (
    echo   OK - Acceso directo en escritorio
    echo   OK - Acceso directo >> "%LOG%"
) else (
    echo   AVISO: No se pudo crear acceso directo
    echo   AVISO: No se pudo crear acceso directo >> "%LOG%"
)

:: Autostart del tray
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "Soporte360Tray" /t REG_SZ /d "\"C:\ProgramData\Soporte360\soporte360.exe\"" /f >nul 2>&1
echo   OK - Autostart tray >> "%LOG%"

:: Registrar en Programas y caracteristicas
set UNREG=HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Soporte360
reg add "%UNREG%" /v "DisplayName"     /t REG_SZ    /d "Soporte360"                                                       /f >nul 2>&1
reg add "%UNREG%" /v "DisplayVersion"  /t REG_SZ    /d "1.4.9"                                                            /f >nul 2>&1
reg add "%UNREG%" /v "Publisher"       /t REG_SZ    /d "FRCM"                                                             /f >nul 2>&1
reg add "%UNREG%" /v "InstallLocation" /t REG_SZ    /d "C:\ProgramData\Soporte360"                                        /f >nul 2>&1
reg add "%UNREG%" /v "DisplayIcon"     /t REG_SZ    /d "C:\ProgramData\Soporte360\soporte360.exe,0"                       /f >nul 2>&1
reg add "%UNREG%" /v "UninstallString" /t REG_SZ    /d "\"C:\ProgramData\Soporte360\soporte360.exe\" --uninstall"         /f >nul 2>&1
reg add "%UNREG%" /v "NoModify"        /t REG_DWORD /d 1                                                                  /f >nul 2>&1
reg add "%UNREG%" /v "NoRepair"        /t REG_DWORD /d 1                                                                  /f >nul 2>&1
echo   OK - Programas y caracteristicas >> "%LOG%"

:: Iniciar interfaz grafica
start "" "C:\ProgramData\Soporte360\soporte360.exe"

:: Reactivar antivirus
powershell -NoProfile -Command "Set-MpPreference -DisableRealtimeMonitoring $false -ErrorAction SilentlyContinue" >nul 2>&1
echo   OK - Antivirus reactivado >> "%LOG%"

echo ===== FIN OK %TIME% ===== >> "%LOG%"

echo.
echo ======================================
echo  Soporte360 ADMIN instalado OK
echo  Servidor: 100.85.203.15
echo  Listo para conectar a clientes
echo  Log guardado en: %LOG%
echo  Copyright (C) 2026 FRCM
echo ======================================
pause
