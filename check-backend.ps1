# Backend (port 3001) calisiyor mu kontrol et
$port = 3001
$url = "http://localhost:$port/health"

Write-Host "Backend kontrol ediliyor (port $port)..." -ForegroundColor Yellow
try {
    $r = Invoke-WebRequest -Uri $url -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    if ($r.StatusCode -eq 200) {
        Write-Host "OK Backend calisiyor: $url" -ForegroundColor Green
        exit 0
    }
} catch {
    Write-Host "Backend yanit vermiyor. Port $port acik mi?" -ForegroundColor Red
    Write-Host "Backend'i baslatmak icin: cd backend; npm run dev" -ForegroundColor Gray
    Write-Host "  veya proje kokunden: npm run backend:dev" -ForegroundColor Gray
    exit 1
}
