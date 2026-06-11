@echo off
echo =====================================
echo INSTALANDO TAILSCALE + RUSTDESK
echo =====================================

REM ---------------------------
REM INSTALAR TAILSCALE
REM ---------------------------
echo Instalando Tailscale...
start /wait tailscale-setup.exe /silent

echo Conectando a Tailscale...
"C:\Program Files\Tailscale\tailscale.exe" up --authkey tskey-auth-kEayZunzJa11CNTRL-XnhVcXA6DqT3uzAa8P52qTxFk9qnNJDr --accept-routes

REM ---------------------------
REM INSTALAR RUSTDESK
REM ---------------------------
echo Instalando RustDesk...
start /wait soporte360.exe --silent-install

REM ---------------------------
REM CONFIGURAR RUSTDESK
REM ---------------------------
echo Configurando RustDesk...

timeout /t 5 >nul

set CONFIG_DIR=%AppData%\RustDesk\config

mkdir "%CONFIG_DIR%" >nul 2>&1

echo { > "%CONFIG_DIR%\RustDesk2.toml"
echo rendezvous_server = "100.85.203.15:8443" >> "%CONFIG_DIR%\RustDesk2.toml"
echo relay_server = "100.85.203.15:8444" >> "%CONFIG_DIR%\RustDesk2.toml"
echo } >> "%CONFIG_DIR%\RustDesk2.toml"

echo Instalacion completa.
pause