param (
    [string]$ServerInstance = "GAUTAM-LAPTOP07",
    [string]$DatabaseName = "ExpenseTrackerDb"
)

$ErrorActionPreference = "Stop"

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "Starting Database Deployment to: $ServerInstance ($DatabaseName)" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

function Execute-SqlScript {
    param (
        [string]$FilePath,
        [string]$DbName = $DatabaseName
    )

    $content = Get-Content -Path $FilePath -Raw
    # Split by GO statements
    $batches = $content -split "(?im)^\s*GO\s*$"

    $connStr = "Server=$ServerInstance;Database=$DbName;Integrated Security=True;TrustServerCertificate=True;"
    $conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
    $conn.Open()

    try {
        foreach ($batch in $batches) {
            $trimmed = $batch.Trim()
            if (-not [string]::IsNullOrWhiteSpace($trimmed)) {
                $cmd = $conn.CreateCommand()
                $cmd.CommandText = $trimmed
                $cmd.CommandTimeout = 120
                $cmd.ExecuteNonQuery() | Out-Null
            }
        }
        Write-Host " [SUCCESS] $(Split-Path $FilePath -Leaf)" -ForegroundColor Green
    }
    catch {
        Write-Host " [FAILED]  $(Split-Path $FilePath -Leaf): $($_.Exception.Message)" -ForegroundColor Red
        throw
    }
    finally {
        $conn.Close()
    }
}

# 1. Database Creation
$dbScripts = Get-ChildItem -Path "$PSScriptRoot\01-Database\*.sql" | Sort-Object Name
foreach ($s in $dbScripts) {
    Execute-SqlScript -FilePath $s.FullName -DbName "master"
}

# 2. Functions
$fnScripts = Get-ChildItem -Path "$PSScriptRoot\02-Functions\*.sql" | Sort-Object Name
foreach ($s in $fnScripts) {
    Execute-SqlScript -FilePath $s.FullName
}

# 3. Tables
$tblScripts = Get-ChildItem -Path "$PSScriptRoot\03-Tables\*.sql" | Sort-Object Name
foreach ($s in $tblScripts) {
    Execute-SqlScript -FilePath $s.FullName
}

# 4. Indexes
$idxScripts = Get-ChildItem -Path "$PSScriptRoot\04-Indexes\*.sql" | Sort-Object Name
foreach ($s in $idxScripts) {
    Execute-SqlScript -FilePath $s.FullName
}

# 5. Stored Procedures
$spScripts = Get-ChildItem -Path "$PSScriptRoot\05-StoredProcedures\*.sql" | Sort-Object Name
foreach ($s in $spScripts) {
    Execute-SqlScript -FilePath $s.FullName
}

# 6. Seed Data
$seedScripts = Get-ChildItem -Path "$PSScriptRoot\06-SeedData\*.sql" | Sort-Object Name
foreach ($s in $seedScripts) {
    Execute-SqlScript -FilePath $s.FullName
}

Write-Host "=========================================================" -ForegroundColor Green
Write-Host "Database deployment completed successfully!" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green
