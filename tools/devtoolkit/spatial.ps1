Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ToolkitRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = (Resolve-Path (Join-Path $ToolkitRoot "..\..")).Path
$ConfigPath = Join-Path $ToolkitRoot "config.json"

function Write-Header {
    Clear-Host
    Write-Host "====================================================" -ForegroundColor Cyan
    Write-Host "          SPATIAL DEVELOPER TOOLKIT v0.1" -ForegroundColor Cyan
    Write-Host "====================================================" -ForegroundColor Cyan
    Write-Host "Project: $ProjectRoot" -ForegroundColor DarkGray
    Write-Host ""
}

function Pause-Toolkit {
    Write-Host ""
    Read-Host "Press Enter to continue"
}

function Invoke-InProject {
    param([Parameter(Mandatory)][scriptblock]$Action)
    Push-Location $ProjectRoot
    try {
        & $Action
    }
    finally {
        Pop-Location
    }
}

function Test-GitRepository {
    $gitDir = Join-Path $ProjectRoot ".git"
    if (-not (Test-Path $gitDir)) {
        Write-Host "This folder is not a Git repository:" -ForegroundColor Red
        Write-Host $ProjectRoot -ForegroundColor Yellow
        Write-Host "Run 'git init' first or copy the toolkit into the repository root." -ForegroundColor Yellow
        return $false
    }
    return $true
}

function Show-GitStatus {
    if (-not (Test-GitRepository)) { return }
    Invoke-InProject { git status }
}

function Invoke-GitPull {
    if (-not (Test-GitRepository)) { return }
    Invoke-InProject {
        Write-Host "Pulling latest changes..." -ForegroundColor Cyan
        git pull
        if ($LASTEXITCODE -ne 0) {
            throw "git pull failed."
        }
    }
}

function Invoke-CommitAndPush {
    if (-not (Test-GitRepository)) { return }

    $message = Read-Host "Commit message"
    if ([string]::IsNullOrWhiteSpace($message)) {
        Write-Host "Commit cancelled: message is empty." -ForegroundColor Yellow
        return
    }

    Invoke-InProject {
        git status --short

        $confirmation = Read-Host "Stage ALL changes, commit and push? (y/N)"
        if ($confirmation -notmatch '^[YyJj]$') {
            Write-Host "Cancelled." -ForegroundColor Yellow
            return
        }

        git add --all
        if ($LASTEXITCODE -ne 0) { throw "git add failed." }

        $staged = git diff --cached --name-only
        if (-not $staged) {
            Write-Host "There are no staged changes to commit." -ForegroundColor Yellow
            return
        }

        git commit -m $message
        if ($LASTEXITCODE -ne 0) { throw "git commit failed." }

        git push
        if ($LASTEXITCODE -ne 0) { throw "git push failed." }

        Write-Host "Commit and push completed." -ForegroundColor Green
    }
}

function Open-VisualStudioCode {
    $command = Get-Command code -ErrorAction SilentlyContinue
    if ($null -eq $command) {
        Write-Host "VS Code command 'code' was not found." -ForegroundColor Yellow
        Write-Host "In VS Code, run: Shell Command: Install 'code' command in PATH" -ForegroundColor Yellow
        return
    }
    Start-Process "code" -ArgumentList "`"$ProjectRoot`""
}

function Open-GitHub {
    $config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
    Start-Process $config.repositoryUrl
}

function Open-ProjectFolder {
    Start-Process explorer.exe -ArgumentList "`"$ProjectRoot`""
}

function Open-DocumentationPath {
    param([Parameter(Mandatory)][string]$ConfigKey)

    $config = Get-Content $ConfigPath -Raw | ConvertFrom-Json
    $relativePath = $config.paths.$ConfigKey
    $fullPath = Join-Path $ProjectRoot $relativePath

    if (-not (Test-Path $fullPath)) {
        New-Item -ItemType Directory -Force -Path $fullPath | Out-Null
    }
    Start-Process explorer.exe -ArgumentList "`"$fullPath`""
}

function Show-RecentCommits {
    if (-not (Test-GitRepository)) { return }
    Invoke-InProject { git log --oneline --decorate -10 }
}

while ($true) {
    Write-Header
    Write-Host "Git" -ForegroundColor Green
    Write-Host "  1  Git Status"
    Write-Host "  2  Git Pull"
    Write-Host "  3  Commit + Push"
    Write-Host "  4  Recent Commits"
    Write-Host ""
    Write-Host "Project" -ForegroundColor Green
    Write-Host "  5  Open VS Code"
    Write-Host "  6  Open GitHub"
    Write-Host "  7  Open Project Folder"
    Write-Host ""
    Write-Host "Documentation" -ForegroundColor Green
    Write-Host "  8  Open Architecture"
    Write-Host "  9  Open Domain Specs"
    Write-Host " 10  Open ADRs"
    Write-Host ""
    Write-Host "  0  Exit"
    Write-Host ""

    $selection = Read-Host "Selection"

    try {
        switch ($selection) {
            "1"  { Show-GitStatus; Pause-Toolkit }
            "2"  { Invoke-GitPull; Pause-Toolkit }
            "3"  { Invoke-CommitAndPush; Pause-Toolkit }
            "4"  { Show-RecentCommits; Pause-Toolkit }
            "5"  { Open-VisualStudioCode }
            "6"  { Open-GitHub }
            "7"  { Open-ProjectFolder }
            "8"  { Open-DocumentationPath -ConfigKey "architecture" }
            "9"  { Open-DocumentationPath -ConfigKey "domain" }
            "10" { Open-DocumentationPath -ConfigKey "adr" }
            "0"  { break }
            default {
                Write-Host "Unknown selection." -ForegroundColor Yellow
                Start-Sleep -Seconds 1
            }
        }
    }
    catch {
        Write-Host ""
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        Pause-Toolkit
    }
}
