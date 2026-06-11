param([string]$url)
if ($url -match 'soporte360://([^?/]+)(?:\?password=(.+))?') {
    $id   = $Matches[1]
    $pass = if ($Matches[2]) { [System.Uri]::UnescapeDataString($Matches[2]) } else { '' }
    $exe  = 'C:\Program Files\Soporte360\soporte360.exe'
    if ($pass) {
        Start-Process $exe -ArgumentList '--connect', $id, $pass
    } else {
        Start-Process $exe -ArgumentList '--connect', $id
    }
}
