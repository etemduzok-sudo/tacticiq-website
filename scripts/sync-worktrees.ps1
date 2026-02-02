# TacticIQ - Worktree Senkronizasyon Script
# Ana workspace (c:\TacticIQ) ile worktree'ler arasında değişiklikleri senkronize eder

param(
    [Parameter(Position=0)]
    [ValidateSet('check', 'main-to-worktree', 'worktree-to-main', 'list')]
    [string]$Action = 'check'
)

$ErrorActionPreference = 'Stop'
$MainRepo = 'c:\TacticIQ'
$WorktreeBase = 'C:\Users\EtemD\.cursor\worktrees\TacticIQ'

function Write-Info { param($m) Write-Host "ℹ️  $m" -ForegroundColor Cyan }
function Write-Ok   { param($m) Write-Host "✅ $m" -ForegroundColor Green }
function Write-Warn { param($m) Write-Host "⚠️  $m" -ForegroundColor Yellow }
function Write-Err  { param($m) Write-Host "❌ $m" -ForegroundColor Red }

function Get-CurrentRepo {
    $cwd = Get-Location
    try {
        $gitRoot = git rev-parse --show-toplevel 2>$null
        if ($gitRoot) { return $gitRoot.Trim() }
    } catch {}
    return $null
}

function Get-Worktrees {
    $list = git worktree list --porcelain 2>$null
    if (-not $list) { return @() }
    $worktrees = @()
    foreach ($line in $list) {
        if ($line -match '^worktree (.+)$') {
            $worktrees += $Matches[1].Trim()
        }
    }
    return $worktrees
}

switch ($Action) {
    'list' {
        Write-Info "Git worktree'ler:"
        git worktree list 2>$null
        $repo = Get-CurrentRepo
        if ($repo) {
            Write-Info "Şu anki dizin: $repo"
            if ($repo -eq $MainRepo) {
                Write-Ok "Ana workspace'tesin"
            } else {
                Write-Warn "Worktree'tesin - değişiklikleri ana workspace'e taşı: npm run sync-from-worktree"
            }
        }
    }
    'check' {
        $repo = Get-CurrentRepo
        if (-not $repo) {
            Write-Err "Git repo değil veya git yok"
            exit 1
        }
        if ($repo -eq $MainRepo) {
            Write-Ok "Ana workspace: $repo"
            Write-Info "Değişiklikler doğru yerde"
        } else {
            Write-Warn "Worktree'tesin: $repo"
            Write-Info "Ana workspace: $MainRepo"
            Write-Info "Değişiklikleri taşımak için: npm run sync-from-worktree"
        }
    }
    'worktree-to-main' {
        Write-Info "Worktree'ten ana workspace'e kopyalama..."
        $current = Get-CurrentRepo
        if ($current -eq $MainRepo) {
            Write-Warn "Zaten ana workspace'tesin"
            exit 0
        }
        if (-not (Test-Path $MainRepo)) {
            Write-Err "Ana workspace bulunamadı: $MainRepo"
            exit 1
        }
        $diff = git diff --name-only 2>$null
        $diffCached = git diff --cached --name-only 2>$null
        $allFiles = ($diff + $diffCached) | Sort-Object -Unique
        if ($allFiles.Count -eq 0) {
            Write-Info "Değiştirilmiş dosya yok"
            exit 0
        }
        foreach ($f in $allFiles) {
            $src = Join-Path $current $f
            $dst = Join-Path $MainRepo $f
            if (Test-Path $src) {
                $dir = Split-Path $dst -Parent
                if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
                Copy-Item $src $dst -Force
                Write-Ok "Kopyalandı: $f"
            }
        }
        Write-Ok "Tamamlandı - ana workspace'te kontrol et"
    }
    'main-to-worktree' {
        Write-Info "Ana workspace'ten worktree'e kopyalama..."
        if (-not (Test-Path $MainRepo)) {
            Write-Err "Ana workspace bulunamadı: $MainRepo"
            exit 1
        }
        Push-Location $MainRepo
        $diff = git diff --name-only 2>$null
        $diffCached = git diff --cached --name-only 2>$null
        Pop-Location
        $allFiles = ($diff + $diffCached) | Sort-Object -Unique
        $current = Get-CurrentRepo
        foreach ($f in $allFiles) {
            $src = Join-Path $MainRepo $f
            $dst = Join-Path $current $f
            if (Test-Path $src) {
                $dir = Split-Path $dst -Parent
                if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
                Copy-Item $src $dst -Force
                Write-Ok "Kopyalandı: $f"
            }
        }
        Write-Ok "Tamamlandı"
    }
}
