# Soporte360 — Resumen de sesión 10/06/2026

## Estado del proyecto

Fork de RustDesk con servidor propio en `100.85.203.15` (Windows, Tailscale).
Dashboard en `http://100.85.203.15:8080/dashboard.html`
Servidor RustDesk: `hbbs.exe` + `hbbr.exe` en `C:\RustDeskServer\`

---

## Lo que se hizo hoy ✅

### 1. Instalador admin — Kaspersky sigue bloqueando el .bat
- Se intentó cambiar ruta de `C:\Program Files\Soporte360\` → `C:\ProgramData\Soporte360\` → Kaspersky igual lo cortó
- Se intentó Scheduled Task como vector de copia → Kaspersky cortó el bat antes de escribir el .ps1
- **Solución definitiva: Inno Setup** — genera un `.exe` instalador que Kaspersky no bloquea

### 2. Inno Setup — archivo listo para compilar
- Archivo: `soporte360_admin_setup.iss`
- Instala en `C:\ProgramData\Soporte360\`
- Escribe config del servidor en `%APPDATA%\Soporte360\config\Soporte360.toml` y en SYSTEM
- Instala y arranca el servicio Soporte360
- Registra tarea programada `Soporte360Agente` cada 5 minutos como SYSTEM
- Ejecuta el agente una vez al instalar (aparece en dashboard inmediatamente)
- Arranca el tray
- Desinstalación limpia (borra servicio, tarea, archivos)
- **Pendiente: compilar con Inno Setup y probar en máquina con Kaspersky**

### 3. Problema servidor — base de datos corrupta
- `hbbs.exe` fallaba con `disk I/O error` en `db_v2.sqlite3`
- Solución: borrar `C:\Users\Rodrigo\AppData\Roaming\RustDesk\config\db_v2.sqlite3`
- El servidor la regenera sola al reiniciar
- **Agregar al `start_rustdesk.bat` del servidor un chequeo de la DB**

### 4. Instalación manual en notebook nueva (esta sesión)
- Tailscale instalado manualmente (IP: `100.86.190.101`)
- Config del servidor escrito a mano en `%APPDATA%\Soporte360\config\Soporte360.toml`
- Servicio instalado con `--install-service` desde PowerShell como admin
- ID generado: `1 457 978 735`
- Registrado manualmente en dashboard vía POST a `/registrar`
- Tarea del agente creada manualmente con `schtasks`

### 5. Agente de comandos — fix lectura de ID
- Problema: el agente buscaba archivo `id` separado que no existe
- El ID numérico no está directamente en el `.toml` (el `enc_id` está encriptado)
- **Fix: 4 métodos en cascada:**
  1. `--get-id` directo
  2. Título de la ventana si el proceso está corriendo
  3. UI Automation
  4. Abre la app minimizada, espera 5s, lee el título
- Archivo actualizado: `agente_comandos.ps1`

### 6. Estructura de carpetas — unificada
- La carpeta `Servidor\Updates\Updates\` (doble) se aplanó a `Servidor\Updates\`
- Ambas máquinas de desarrollo ahora tienen la misma estructura

---

## Estructura actual del proyecto

```
Soporte360/
├── Instalador/
│   ├── soporte360.exe
│   ├── sciter.dll
│   ├── instalar_soporte360_administrador.bat   ← bat con Scheduled Task (Kaspersky lo bloquea)
│   ├── instalar_soporte360_cliente.bat
│   ├── soporte360_admin_setup.iss              ← NUEVO: compilar con Inno Setup
│   └── updater.bat
└── Servidor/
    └── Updates/
        ├── agente_comandos.ps1                 ← ACTUALIZADO: 4 métodos para leer ID
        ├── clients.json
        ├── dashboard.html
        ├── updater.bat
        └── version.txt
```

---

## Configuración del servidor

| Parámetro | Valor |
|-----------|-------|
| IP Tailscale | `100.85.203.15` |
| Puerto rendezvous | `21116` |
| Puerto relay | `21117` |
| Puerto API | `21114` |
| Puerto dashboard | `8080` |
| Key | `wlbUUND37G8QNPvgHIRUnsuKE9BlZVaIMYh7sWtrXOo=` |
| DB SQLite | `C:\Users\Rodrigo\AppData\Roaming\RustDesk\config\db_v2.sqlite3` |

---

## Equipos en dashboard

| Nombre | IP Tailscale | ID Soporte360 | Estado |
|--------|-------------|---------------|--------|
| EAD-Rcabezas2026 | 100.127.33.75 | Sin ID | Online |
| EAD-RCABEZAS | 100.124.178.48 | 335444982 | Online |
| ATI-RCABEZAS | 100.119.183.46 | 268304385 | Online |
| RCABEZAS | 100.85.203.15 | 1382412716 | Online |
| NETBOOK-ETEL | 100.75.61.73 | 262799361 | Offline |
| NETESCUELA | 100.110.164.56 | 191117862 | Offline |
| Notebook nueva | 100.86.190.101 | 1457978735 | Online |

---

## Pendientes ❌

1. **Compilar Inno Setup** → probar `Soporte360_Admin_Setup.exe` en máquina con Kaspersky
2. **Agregar chequeo de DB** al `start_rustdesk.bat` del servidor para evitar corrupción
3. **EAD-Rcabezas2026** aparece sin ID — revisar agente en esa máquina
4. **Instalador cliente** — verificar que también funciona con Inno Setup o si el .bat pasa Kaspersky

---

## Proceso de instalación manual (si el instalador falla)

```powershell
# 1. Instalar Tailscale manualmente desde https://tailscale.com/download

# 2. Escribir config del servidor
$cfg = "%APPDATA%\Soporte360\config"
New-Item -ItemType Directory -Force -Path $cfg
@"
[options]
custom-rendezvous-server = "100.85.203.15:21116"
relay-server = "100.85.203.15:21117"
api-server = "http://100.85.203.15:21114"
key = "wlbUUND37G8QNPvgHIRUnsuKE9BlZVaIMYh7sWtrXOo="
"@ | Set-Content "$cfg\Soporte360.toml"

# 3. Instalar servicio
Start-Process "C:\ProgramData\Soporte360\soporte360.exe" -ArgumentList "--install-service" -Verb RunAs -Wait
Start-Service Soporte360

# 4. Registrar tarea del agente
schtasks /create /tn "Soporte360Agente" /tr "powershell -NoProfile -ExecutionPolicy Bypass -File C:\ProgramData\Soporte360\agente_comandos.ps1" /sc minute /mo 5 /ru SYSTEM /f

# 5. Arrancar app
Start-Process "C:\ProgramData\Soporte360\soporte360.exe"
```
