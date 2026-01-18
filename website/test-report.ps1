# TacticIQ Website Test Script
# PowerShell ile website fonksiyonlarini test eder

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  TacticIQ Website Test Report" -ForegroundColor Cyan
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "https://www.tacticiq.app"
$passed = 0
$failed = 0

# Test 1: Website Erisilebilirlik
Write-Host "[TEST 1] Website Erisilebilirlik..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $baseUrl -UseBasicParsing -TimeoutSec 30
    if ($response.StatusCode -eq 200) {
        Write-Host "  [PASSED] Website erisilebilir (Status: $($response.StatusCode))" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  [FAILED] Beklenmeyen status: $($response.StatusCode)" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host "  [FAILED] Website erisilemedi" -ForegroundColor Red
    $failed++
}

# Test 2: HTML Icerik Kontrolu
Write-Host "[TEST 2] HTML Icerik Kontrolu..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $baseUrl -UseBasicParsing -TimeoutSec 30
    $content = $response.Content
    
    if ($content -match "TacticIQ") {
        Write-Host "  [PASSED] TacticIQ branding bulundu" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  [FAILED] TacticIQ branding bulunamadi" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host "  [FAILED] Icerik alinamadi" -ForegroundColor Red
    $failed++
}

# Test 3: SSL Sertifikasi
Write-Host "[TEST 3] SSL Sertifikasi..." -ForegroundColor Yellow
try {
    $uri = [System.Uri]$baseUrl
    $tcpClient = New-Object System.Net.Sockets.TcpClient($uri.Host, 443)
    $sslStream = New-Object System.Net.Security.SslStream($tcpClient.GetStream(), $false)
    $sslStream.AuthenticateAsClient($uri.Host)
    $cert = $sslStream.RemoteCertificate
    $sslStream.Close()
    $tcpClient.Close()
    Write-Host "  [PASSED] SSL sertifikasi gecerli" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "  [FAILED] SSL hatasi" -ForegroundColor Red
    $failed++
}

# Test 4: Performans
Write-Host "[TEST 4] Performans..." -ForegroundColor Yellow
try {
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $response = Invoke-WebRequest -Uri $baseUrl -UseBasicParsing -TimeoutSec 30
    $stopwatch.Stop()
    $loadTime = $stopwatch.ElapsedMilliseconds
    
    if ($loadTime -lt 5000) {
        Write-Host "  [PASSED] Yukleme suresi: ${loadTime}ms" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  [WARNING] Yukleme suresi yavas: ${loadTime}ms" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [FAILED] Performans olculemedi" -ForegroundColor Red
    $failed++
}

# Test 5: Content Length
Write-Host "[TEST 5] Content Length..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $baseUrl -UseBasicParsing -TimeoutSec 30
    $length = $response.Content.Length
    if ($length -gt 100) {
        Write-Host "  [PASSED] Icerik boyutu: $length bytes" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  [FAILED] Icerik cok kisa: $length bytes" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host "  [FAILED] Content length alinamadi" -ForegroundColor Red
    $failed++
}

# Ozet
Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  TEST OZETI" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Gecen: $passed" -ForegroundColor Green
Write-Host "  Basarisiz: $failed" -ForegroundColor Red
Write-Host ""

if ($failed -eq 0) {
    Write-Host "  [OK] TUM TESTLER BASARILI!" -ForegroundColor Green
} else {
    Write-Host "  [WARN] Bazi testler basarisiz oldu" -ForegroundColor Red
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  MANUEL TEST GEREKEN OZELLIKLER" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1. [ ] Admin Panel girisi" -ForegroundColor White
Write-Host "  2. [ ] Bekleme Listesi formu" -ForegroundColor White
Write-Host "  3. [ ] Ortak Ol formu" -ForegroundColor White
Write-Host "  4. [ ] Fiyatlandirma ayarlari" -ForegroundColor White
Write-Host "  5. [ ] Supabase veri kaydi" -ForegroundColor White
Write-Host ""
