param([switch]$Descargar)

$dest = 'C:\Program Files\Soporte360\open-url.ps1'

if ($Descargar -or !(Test-Path $dest)) {
    try {
        Invoke-WebRequest -Uri 'http://100.85.203.15:8080/open-url.ps1' -OutFile $dest -UseBasicParsing
        Write-Host "open-url.ps1 descargado OK"
    } catch {
        Write-Host "ERROR al descargar open-url.ps1: $_"
        exit 1
    }
}

# %1 es literal en strings de PowerShell — no hay expansion de CMD aqui
$cmd = '"C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" -WindowStyle Hidden -NoProfile -ExecutionPolicy Bypass -File "C:\Program Files\Soporte360\open-url.ps1" "%1"'

foreach ($root in @('HKLM:\SOFTWARE\Classes\soporte360', 'HKCR:\soporte360')) {
    try {
        New-Item -Path "$root\shell\open\command" -Force | Out-Null
        Set-ItemProperty -Path "$root\shell\open\command" -Name '(Default)' -Value $cmd -Force
    } catch {
        Write-Host "Aviso en $root : $_"
    }
}

Write-Host "Protocolo soporte360:// registrado con wrapper PowerShell."
Write-Host "Valor en registro:"
(Get-ItemProperty 'HKLM:\SOFTWARE\Classes\soporte360\shell\open\command').'(Default)'
