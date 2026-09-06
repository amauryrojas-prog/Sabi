# ====================================================
# SABÍ SUPER-APP - DYNAMIC SCRAPER RUNNER LOOP
# ====================================================
# This script runs continuously in the background and calls run_scraper.ps1
# at dynamic intervals based on active sports seasons and hours.

$ScraperScript = Join-Path $PSScriptRoot "run_scraper.ps1"

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " 🚀 SABÍ DYNAMIC SCRAPER LOOP DAEMON INITIALIZED" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "This script will dynamically adjust update frequency:" -ForegroundColor Gray
Write-Host " - Active Sports/Lottery periods: Updates every 10 minutes." -ForegroundColor Gray
Write-Host " - Off-periods/Idle hours: Updates every 60 minutes." -ForegroundColor Gray
Write-Host "----------------------------------------------------" -ForegroundColor Gray

while ($true) {
    $Now = Get-Date
    $Month = $Now.Month
    $Hour = $Now.Hour
    $DayOfWeek = $Now.DayOfWeek
    
    $IsActivePeriod = $false
    $ActiveReason = @()
    
    # 1. MLB Season Check (March - October, 1:00 PM - Midnight)
    if ($Month -ge 3 -and $Month -le 10) {
        if ($Hour -ge 13 -and $Hour -le 23) {
            $IsActivePeriod = $true
            $ActiveReason += "MLB Season (Active Hours: 1pm - 11pm)"
        }
    }
    
    # 2. NBA Season Check (October - June, 6:00 PM - 2:00 AM)
    if ($Month -ge 10 -or $Month -le 6) {
        if ($Hour -ge 18 -or $Hour -lt 2) {
            $IsActivePeriod = $true
            $ActiveReason += "NBA Season (Active Hours: 6pm - 2am)"
        }
    }
    
    # 3. NFL Season Check (September - February, Sunday 1pm-11pm, Mon/Thu 7pm-11pm)
    if ($Month -ge 9 -or $Month -le 2) {
        if ($DayOfWeek -eq "Sunday" -and $Hour -ge 13 -and $Hour -le 23) {
            $IsActivePeriod = $true
            $ActiveReason += "NFL Sunday games"
        }
        elseif (($DayOfWeek -eq "Monday" -or $DayOfWeek -eq "Thursday") -and $Hour -ge 19 -and $Hour -le 23) {
            $IsActivePeriod = $true
            $ActiveReason += "NFL Mon/Thu night games"
        }
    }
    
    # 4. NHL Season Check (October - June, 7:00 PM - 1:00 AM)
    if ($Month -ge 10 -or $Month -le 6) {
        if ($Hour -ge 19 -or $Hour -lt 1) {
            $IsActivePeriod = $true
            $ActiveReason += "NHL Season (Active Hours: 7pm - 1am)"
        }
    }
    
    # 5. European Soccer Leagues Check (August - May, Sat/Sun morning/afternoon, Weekdays afternoon)
    if ($Month -ge 8 -or $Month -le 5) {
        if (($DayOfWeek -eq "Saturday" -or $DayOfWeek -eq "Sunday") -and $Hour -ge 7 -and $Hour -le 18) {
            $IsActivePeriod = $true
            $ActiveReason += "European Soccer weekend matches"
        }
        elseif (($DayOfWeek -eq "Tuesday" -or $DayOfWeek -eq "Wednesday" -or $DayOfWeek -eq "Friday") -and $Hour -ge 14 -and $Hour -le 18) {
            $IsActivePeriod = $true
            $ActiveReason += "European Soccer mid-week matches"
        }
    }
    
    # 6. Lottery Draw Windows (Midday 1:30 PM, Evening 9:00 PM)
    if (($Hour -eq 13 -or $Hour -eq 14) -or ($Hour -eq 21 -or $Hour -eq 22)) {
        $IsActivePeriod = $true
        $ActiveReason += "Lotto Aruba Draw Windows"
    }
    
    # Determine sleep interval
    $SleepMinutes = 60
    if ($IsActivePeriod) {
        $SleepMinutes = 10
    }
    
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Starting sync run..." -ForegroundColor Yellow
    if ($IsActivePeriod) {
        $ReasonStr = $ActiveReason -join ", "
        Write-Host "⚡ Active Period Detected: $ReasonStr" -ForegroundColor Green
    } else {
        Write-Host "💤 Off-Period / Idle hours. Sleeping longer between runs." -ForegroundColor DarkGray
    }
    
    # Run the scraper
    try {
        powershell -ExecutionPolicy Bypass -File $ScraperScript
    } catch {
        Write-Host "❌ Error invoking scraper script: $_" -ForegroundColor Red
    }
    
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Sync complete. Next sync in $SleepMinutes minutes.`n" -ForegroundColor Cyan
    Start-Sleep -Seconds ($SleepMinutes * 60)
}
