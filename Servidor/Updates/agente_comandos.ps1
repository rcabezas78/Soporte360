# agente_comandos.ps1 - Re-registra el equipo y ejecuta comandos remotos
$servidor = "http://100.85.203.15:8080"
try {
    $ip = & "C:\Program Files\Tailscale\tailscale.exe" ip -4 2>$null
    $ip = $ip.Trim()
    if (!$ip) { exit 0 }

    $soporte_id = ""

    # Metodo 1: --get-id
    $soporte_id = & "C:\ProgramData\Soporte360\soporte360.exe" --get-id 2>$null
    $soporte_id = "$soporte_id".Trim()

    # Metodo 2: titulo de la ventana del proceso corriendo
    if (!$soporte_id -or $soporte_id -eq "") {
        Add-Type -AssemblyName System.Windows.Forms 2>$null
        $procs = Get-Process soporte360 -ErrorAction SilentlyContinue
        foreach ($proc in $procs) {
            try {
                $title = $proc.MainWindowTitle
                if ($title -match '(\d[\d\s]{8,14})') {
                    $soporte_id = ($title -replace '\s', '').Trim()
                    break
                }
            } catch {}
        }
    }

    # Metodo 3: UI Automation para leer ventana
    if (!$soporte_id -or $soporte_id -eq "") {
        try {
            Add-Type -AssemblyName UIAutomationClient 2>$null
            $desktop = [System.Windows.Automation.AutomationElement]::RootElement
            $cond = New-Object System.Windows.Automation.PropertyCondition(
                [System.Windows.Automation.AutomationElement]::NameProperty, "Soporte360")
            $win = $desktop.FindFirst([System.Windows.Automation.TreeScope]::Children, $cond)
            if ($win) {
                $name = $win.Current.Name
                if ($name -match '(\d[\d\s]{8,14})') {
                    $soporte_id = ($name -replace '\s', '').Trim()
                }
            }
        } catch {}
    }

    # Metodo 4: arrancar la app minimizada, esperar 5s, leer ID y seguir
    if (!$soporte_id -or $soporte_id -eq "") {
        try {
            Start-Process "C:\ProgramData\Soporte360\soporte360.exe" -WindowStyle Minimized
            Start-Sleep -Seconds 5
            $procs = Get-Process soporte360 -ErrorAction SilentlyContinue
            foreach ($p in $procs) {
                $title = $p.MainWindowTitle
                if ($title -match '(\d[\d\s]{8,14})') {
                    $soporte_id = ($title -replace '\s', '').Trim()
                    break
                }
            }
        } catch {}
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
