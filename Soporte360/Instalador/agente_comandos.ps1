# agente_comandos.ps1 - Re-registra el equipo y ejecuta comandos remotos
$servidor = "http://100.85.203.15:8080"
try {
    $ip = & "C:\Program Files\Tailscale\tailscale.exe" ip -4 2>$null
    $ip = $ip.Trim()
    if (!$ip) { exit 0 }

    # Obtener ID de Soporte360 - intenta --get-id primero, sino lee de la ventana del proceso
    $soporte_id = & "C:\ProgramData\Soporte360\soporte360.exe" --get-id 2>$null
    $soporte_id = "$soporte_id".Trim()

    # Si --get-id falla, leer el ID desde el titulo de la ventana del proceso corriendo
    if (!$soporte_id -or $soporte_id -eq "") {
        Add-Type -AssemblyName System.Windows.Forms 2>$null
        $procs = Get-Process soporte360 -ErrorAction SilentlyContinue
        foreach ($proc in $procs) {
            try {
                $title = $proc.MainWindowTitle
                if ($title -match '(\d{9,12})') {
                    $soporte_id = $matches[1]
                    break
                }
            } catch {}
        }
    }

    # Si todavia no tenemos ID, leer del archivo de configuracion del usuario logueado
    if (!$soporte_id -or $soporte_id -eq "") {
        $usuarios = Get-ChildItem "C:\Users" -Directory -ErrorAction SilentlyContinue
        foreach ($u in $usuarios) {
            $cfgPath = "$($u.FullName)\AppData\Roaming\Soporte360\config\Soporte360.toml"
            if (Test-Path $cfgPath) {
                $contenido = Get-Content $cfgPath -Raw -ErrorAction SilentlyContinue
                # El ID numerico se puede derivar del enc_id pero no directamente
                # Intentar leer id de peers como referencia del propio equipo
                $idPath = "$($u.FullName)\AppData\Roaming\Soporte360\config\id"
                if (Test-Path $idPath) {
                    $soporte_id = (Get-Content $idPath -Raw).Trim()
                    break
                }
            }
        }
    }

    # Re-registrar equipo en el dashboard
    if ($soporte_id -and $soporte_id -ne "") {
        $body = @{
            nombre     = $env:COMPUTERNAME
            ip         = $ip
            soporte_id = $soporte_id
            grupo      = ""
        } | ConvertTo-Json -Compress
        Invoke-WebRequest -Uri "$servidor/registrar" -Method POST `
            -ContentType "application/json" -Body $body `
            -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue | Out-Null
    }

    # Consultar comandos pendientes
    $resp = Invoke-WebRequest -Uri "$servidor/comando/$ip" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    $data = $resp.Content | ConvertFrom-Json
    if ($data.accion -eq "desinstalar") {
        Invoke-WebRequest -Uri "$servidor/comando-ok/$ip" -Method POST -UseBasicParsing -ErrorAction SilentlyContinue
        Start-Process "C:\ProgramData\Soporte360\soporte360.exe" -ArgumentList "--uninstall" -Wait -ErrorAction SilentlyContinue
        sc.exe stop Soporte360 2>$null
        sc.exe delete Soporte360 2>$null
        Start-Sleep -Seconds 3
        Remove-Item "C:\ProgramData\Soporte360" -Recurse -Force -ErrorAction SilentlyContinue
        Remove-Item "C:\Users\Public\Desktop\Soporte360.lnk" -Force -ErrorAction SilentlyContinue
        reg delete "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" /v "Soporte360Tray" /f 2>$null
        schtasks /delete /tn "Soporte360Agente" /f 2>$null
        schtasks /delete /tn "Soporte360-Updater" /f 2>$null
    }
} catch {
    # Sin conexion o sin comando pendiente - ignorar silenciosamente
}
