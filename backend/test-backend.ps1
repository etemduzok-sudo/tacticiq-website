# TacticIQ - Backend Test Script
# PowerShell ile API test scripti

$baseUrl = "http://localhost:3000"
$userId = "550e8400-e29b-41d4-a716-446655440000"
$matchId = 12345

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TACTICIQ - BACKEND TEST" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "TEST 1: Health Check" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "✅ Health Check: " -NoNewline -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Compress) -ForegroundColor White
} catch {
    Write-Host "❌ Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n----------------------------------------`n" -ForegroundColor Gray

# Test 2: Create Prediction
Write-Host "TEST 2: Create Prediction" -ForegroundColor Green
$predictionData = @{
    userId = $userId
    matchId = $matchId
    homeScore = 2
    awayScore = 1
    firstGoal = "home"
    totalGoals = "2-3"
    yellowCards = 4
    redCards = 0
    corners = 8
    focusedPredictions = @("homeScore", "firstGoal")
    trainingType = "attack"
    trainingMultiplier = 1.5
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/predictions" -Method Post -Body $predictionData -ContentType "application/json"
    Write-Host "✅ Prediction Created: " -NoNewline -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Compress) -ForegroundColor White
} catch {
    Write-Host "❌ Create Prediction Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}

Write-Host "`n----------------------------------------`n" -ForegroundColor Gray

# Test 3: Get User Predictions
Write-Host "TEST 3: Get User Predictions" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/predictions/user/$userId" -Method Get
    Write-Host "✅ User Predictions: " -NoNewline -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3 -Compress) -ForegroundColor White
} catch {
    Write-Host "❌ Get User Predictions Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n----------------------------------------`n" -ForegroundColor Gray

# Test 4: Get Match Details
Write-Host "TEST 4: Get Match Details" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/matches/$matchId" -Method Get
    Write-Host "✅ Match Details: " -NoNewline -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 2 -Compress) -ForegroundColor White
} catch {
    Write-Host "❌ Get Match Details Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n----------------------------------------`n" -ForegroundColor Gray

# Test 5: Get Live Matches
Write-Host "TEST 5: Get Live Matches" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/matches/live" -Method Get
    Write-Host "✅ Live Matches: " -NoNewline -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 2 -Compress) -ForegroundColor White
} catch {
    Write-Host "❌ Get Live Matches Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n----------------------------------------`n" -ForegroundColor Gray

# Test 6: Calculate Score
Write-Host "TEST 6: Calculate Score" -ForegroundColor Green
try {
    # Get real prediction ID from previous test
    $predictions = Invoke-RestMethod -Uri "$baseUrl/api/predictions/user/$userId" -Method Get
    
    if ($predictions.data -and $predictions.data.Count -gt 0) {
        $predictionId = $predictions.data[0].id
        
        $matchResultData = @{
            matchResult = @{
                homeScore = 2
                awayScore = 1
                firstGoal = "home"
                totalGoals = "2-3"
                yellowCards = 4
                redCards = 0
                corners = 8
                events = @()
            }
        } | ConvertTo-Json -Depth 3
        
        $response = Invoke-RestMethod -Uri "$baseUrl/api/scoring/calculate/$predictionId" -Method Post -Body $matchResultData -ContentType "application/json"
        Write-Host "✅ Score Calculated: " -NoNewline -ForegroundColor Green
        Write-Host ($response | ConvertTo-Json -Depth 3 -Compress) -ForegroundColor White
    } else {
        Write-Host "⚠️  No predictions found to calculate score" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Calculate Score Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}

Write-Host "`n----------------------------------------`n" -ForegroundColor Gray

# Test 7: Get Leaderboard
Write-Host "TEST 7: Get Leaderboard" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/scoring/leaderboard?period=overall&limit=10" -Method Get
    Write-Host "✅ Leaderboard: " -NoNewline -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3 -Compress) -ForegroundColor White
} catch {
    Write-Host "❌ Get Leaderboard Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST TAMAMLANDI!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "NOTLAR:" -ForegroundColor Yellow
Write-Host "- Supabase'de SQL'leri çalıştırdıysanız, tüm testler çalışmalı" -ForegroundColor White
Write-Host "- API-Football testleri için API key gerekli (.env)" -ForegroundColor White
Write-Host "- User ID ve Match ID'yi gerçek verilerle değiştirin" -ForegroundColor White
Write-Host "`n"
