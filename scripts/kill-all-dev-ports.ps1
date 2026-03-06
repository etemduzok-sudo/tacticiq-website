# 8081, 8082, 8083 (Expo/Metro), 3001 (Backend) portlarini kullanan islemleri kapatir
$ports = @(8081, 8082, 8083, 3001)
foreach ($p in $ports) {
  $found = netstat -ano | findstr ":$p "
  if ($found) {
    $found -split "`n" | ForEach-Object {
      if ($_ -match '\s+(\d+)\s*$') {
        $procId = $matches[1]
        if ($procId -ne '0') {
          Write-Host "Kapatiliyor: PID $procId (port $p)"
          taskkill /PID $procId /F 2>$null
        }
      }
    }
  }
}
Write-Host "Tamam."
