# ==========================================
# SABÍ SUPER-APP - LOCAL SCRAPER & SYNC RUNNER
# ==========================================
# Este script realiza el scraping de resultados reales de Lotto Aruba,
# simula APIs de clima y deportes, y envía la información directamente
# a tu base de datos de Supabase.

# Habilitar TLS 1.2
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$CredentialsFile = Join-Path $PSScriptRoot "supabase_credentials.json"

# 1. Comprobar o crear el archivo de credenciales
if (-not (Test-Path $CredentialsFile)) {
    Write-Host "⚠️ No se encontró 'supabase_credentials.json'." -ForegroundColor Yellow
    Write-Host "Por favor, introduce tus credenciales para conectar con Supabase:"
    $UrlInput = Read-Host "Supabase URL (ej: https://xxx.supabase.co)"
    $KeyInput = Read-Host "Supabase SECRET SERVICE ROLE KEY (la encuentras en Configuración -> API)"
    
    if (-not $UrlInput -or -not $KeyInput) {
        Write-Error "Error: La URL y la clave son obligatorias para sincronizar."
        exit
    }
    
    $Creds = @{
        SUPABASE_URL = $UrlInput.Trim()
        SUPABASE_SERVICE_ROLE_KEY = $KeyInput.Trim()
    }
    $Creds | ConvertTo-Json | Out-File $CredentialsFile
    Write-Host "✅ Credenciales guardadas en $CredentialsFile" -ForegroundColor Green
}

# Cargar credenciales
$Config = Get-Content $CredentialsFile | ConvertFrom-Json
$SUPABASE_URL = $Config.SUPABASE_URL
$SERVICE_KEY = $Config.SUPABASE_SERVICE_ROLE_KEY

if ($SERVICE_KEY -eq "PEGA_AQUI_TU_SECRET_SERVICE_ROLE_KEY" -or -not $SERVICE_KEY) {
    Write-Host "❌ ERROR: No has configurado tu clave secreta de Supabase." -ForegroundColor Red
    Write-Host "Abre el archivo 'supabase_credentials.json' y pega tu clave 'service_role' de Supabase." -ForegroundColor Yellow
    exit
}

Write-Host "⚡ Conectando a Supabase en: $SUPABASE_URL..." -ForegroundColor Cyan

# Cabeceras para llamadas a la API REST de Supabase (PostgREST)
$Headers = @{
    "apikey"        = $SERVICE_KEY
    "Authorization" = "Bearer $SERVICE_KEY"
    "Content-Type"  = "application/json; charset=utf-8"
    "Prefer"        = "resolution=merge-duplicates"
}

function Post-Supabase($Url, $JsonBody) {
    $Utf8Bytes = [System.Text.Encoding]::UTF8.GetBytes($JsonBody)
    return Invoke-RestMethod -Uri $Url -Method Post -Headers $Headers -Body $Utf8Bytes -ErrorAction Stop
}

# ----------------------------------------------------
# FUNCIONES DE APOYO PARA DEPORTES EN VIVO (ESPN API)
# ----------------------------------------------------

function Sync-EspnStandings($Sport, $LeagueSlug) {
    Write-Host "   -> Sincronizando posiciones para: $LeagueSlug..." -ForegroundColor Gray
    $Url = "https://site.api.espn.com/apis/v2/sports/$($Sport)/$($LeagueSlug)/standings"
    try {
        $Res = Invoke-RestMethod -Uri $Url -Method Get
        $StandingsList = @()
        
        foreach ($Child in $Res.children) {
            $GroupName = $Child.name
            foreach ($Entry in $Child.standings.entries) {
                $TeamName = $Entry.team.displayName
                
                # Valores por defecto
                $Rank = 1
                $Played = 0
                $Won = 0
                $Lost = 0
                $Drawn = 0
                $Points = 0
                $Pct = $null
                
                $ExtraStats = @{}
                foreach ($S in $Entry.stats) {
                    if ($S.name -eq 'rank') { $Rank = [int]$S.value }
                    elseif ($S.name -eq 'gamesPlayed') { $Played = [int]$S.value }
                    elseif ($S.name -eq 'wins') { $Won = [int]$S.value }
                    elseif ($S.name -eq 'losses') { $Lost = [int]$S.value }
                    elseif ($S.name -eq 'ties') { $Drawn = [int]$S.value }
                    elseif ($S.name -eq 'points') { $Points = [int]$S.value }
                    elseif ($S.name -eq 'winPercent') {
                        $Pct = ("{0:0.000}" -f $S.value) -replace '^0', ''
                    } else {
                        # Guardar otras estadísticas en extra_stats
                        if ($S.name) {
                            $ExtraStats[$S.name] = $S.displayValue
                        }
                        if ($S.displayName -and $S.displayName -ne $S.name) {
                            $ExtraStats[$S.displayName] = $S.displayValue
                        }
                    }
                }
                
                if ($Played -eq 0) {
                    $Played = $Won + $Lost + $Drawn
                }
                
                # Mapear código de deporte
                $DbSport = "futbol"
                if ($Sport -eq "basketball") { $DbSport = "baloncesto" }
                elseif ($Sport -eq "baseball") { $DbSport = "beisbol" }
                elseif ($Sport -eq "hockey") { $DbSport = "nhl" }
                
                $Payload = @{
                    sport       = $DbSport
                    league      = $LeagueSlug
                    group_name  = $GroupName
                    team        = $TeamName
                    rank        = $Rank
                    played      = $Played
                    won         = $Won
                    drawn       = $Drawn
                    lost        = $Lost
                    points      = $Points
                    pct         = $Pct
                    extra_stats = $ExtraStats
                    updated_at  = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
                }
                $StandingsList += $Payload
            }
        }
        
        if ($StandingsList.Count -gt 0) {
            $Body = ConvertTo-Json @($StandingsList) -Depth 10
            $ApiUrl = "$SUPABASE_URL/rest/v1/sports_standings?on_conflict=sport,league,team"
            $ResPost = Post-Supabase $ApiUrl $Body
            Write-Host "      ✅ $($LeagueSlug): $($StandingsList.Count) posiciones actualizadas." -ForegroundColor Green
        }
    } catch {
        Write-Host "      ❌ Error en posiciones de $($LeagueSlug): $_" -ForegroundColor Red
    }
}

function Sync-EspnScoreboard($Sport, $LeagueSlug) {
    Write-Host "   -> Sincronizando partidos para: $LeagueSlug..." -ForegroundColor Gray
    
    # Mapear deporte
    $DbSport = "futbol"
    if ($Sport -eq "basketball") { $DbSport = "baloncesto" }
    elseif ($Sport -eq "baseball") { $DbSport = "beisbol" }

    # Limpiar partidos anteriores de esta liga en Supabase
    try {
        $DeleteUrl = "$SUPABASE_URL/rest/v1/live_sports_matches?sport=eq.$DbSport&league=eq.$LeagueSlug"
        $DeleteHeaders = $Headers.Clone()
        if ($DeleteHeaders.ContainsKey("Prefer")) { $DeleteHeaders.Remove("Prefer") }
        $null = Invoke-RestMethod -Uri $DeleteUrl -Method Delete -Headers $DeleteHeaders -ErrorAction Stop
        Write-Host "      🧹 Limpiados partidos anteriores de $LeagueSlug en la base de datos." -ForegroundColor Gray
    } catch {
        Write-Host "      ⚠️ No se pudieron limpiar partidos anteriores: $_" -ForegroundColor Yellow
    }

    $Url = "https://site.api.espn.com/apis/site/v2/sports/$($Sport)/$($LeagueSlug)/scoreboard"
    try {
        $Res = Invoke-RestMethod -Uri $Url -Method Get
        $MatchesList = @()
        
        foreach ($Event in $Res.events) {
            $Comp = $Event.competitions[0]
            
            # Buscar competidores
            $HomeComp = $Comp.competitors | Where-Object { $_.homeAway -eq 'home' }
            $Away = $Comp.competitors | Where-Object { $_.homeAway -eq 'away' }
            
            if (-not $HomeComp -or -not $Away) { continue }
            
            $HomeTeam = $HomeComp.team.displayName
            $AwayTeam = $Away.team.displayName
            $HomeScore = [int]$HomeComp.score
            $AwayScore = [int]$Away.score
            
            # Mapear estado
            $State = $Event.status.type.state
            $Status = "scheduled"
            if ($State -eq "in") { $Status = "live" }
            elseif ($State -eq "post") { $Status = "finished" }
            
            # Minuto de juego
            $Minute = 0
            if ($Status -eq "live") {
                $ClockStr = $Event.status.displayClock -replace '\D'
                if ($ClockStr) {
                    $Minute = [int]$ClockStr
                } else {
                    $Minute = [int]($Event.status.clock / 60)
                }
            }
            
            # Mapear deporte
            $DbSport = "futbol"
            if ($Sport -eq "basketball") { $DbSport = "baloncesto" }
            elseif ($Sport -eq "baseball") { $DbSport = "beisbol" }
            
            # Simular cuotas
            $OddsHome = 1.95
            $OddsDraw = 3.40
            $OddsAway = 3.80
            
            # Predicción ficticia
            $Pred = "50-25-25"
            
            $Payload = @{
                sport          = $DbSport
                league         = $LeagueSlug
                home_team      = $HomeTeam
                away_team      = $AwayTeam
                home_score     = $HomeScore
                away_score     = $AwayScore
                minute         = $Minute
                status         = $Status
                prediction_h2h = $Pred
                odds_home      = $OddsHome
                odds_draw      = $OddsDraw
                odds_away      = $OddsAway
                updated_at     = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
            }
            
            $MatchesList += $Payload
        }
        
        if ($MatchesList.Count -gt 0) {
            $Body = ConvertTo-Json @($MatchesList)
            $ApiUrl = "$SUPABASE_URL/rest/v1/live_sports_matches?on_conflict=sport,league,home_team,away_team"
            $ResPost = Post-Supabase $ApiUrl $Body
            Write-Host "      ✅ $($LeagueSlug): $($MatchesList.Count) partidos sincronizados." -ForegroundColor Green
        }
    } catch {
        Write-Host "      ❌ Error en partidos de $($LeagueSlug): $_" -ForegroundColor Red
    }
}

function Sync-LocalArubaSports {
    Write-Host "   -> Sincronizando Deportes Locales de Aruba..." -ForegroundColor Gray
    
    # 1. Posiciones
    $LocalStandings = @(
        @{ sport = "local"; league = "aruba.local"; group_name = "Aruba Division di Honor"; team = "RCA"; rank = 1; played = 14; won = 11; drawn = 2; lost = 1; points = 35; pct = ".786"; updated_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ") },
        @{ sport = "local"; league = "aruba.local"; group_name = "Aruba Division di Honor"; team = "SV Dakota"; rank = 2; played = 14; won = 10; drawn = 3; lost = 1; points = 33; pct = ".714"; updated_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ") },
        @{ sport = "local"; league = "aruba.local"; group_name = "Aruba Division di Honor"; team = "SV Nacional"; rank = 3; played = 14; won = 8; drawn = 2; lost = 4; points = 26; pct = ".571"; updated_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ") },
        @{ sport = "local"; league = "aruba.local"; group_name = "Aruba Division di Honor"; team = "SV Britannia"; rank = 4; played = 14; won = 7; drawn = 4; lost = 3; points = 25; pct = ".500"; updated_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ") },
        @{ sport = "local"; league = "aruba.local"; group_name = "Aruba Division di Honor"; team = "SV Estrella"; rank = 5; played = 14; won = 5; drawn = 3; lost = 6; points = 18; pct = ".357"; updated_at = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ") }
    )
    
    # 2. Partidos
    $LocalMatches = @(
        @{
            sport          = "local"
            league         = "Aruba Division di Honor"
            home_team      = "RCA"
            away_team      = "SV Dakota"
            home_score     = 2
            away_score     = 1
            minute         = 79
            status         = "live"
            prediction_h2h = "50-30-20"
            odds_home      = 1.85
            odds_draw      = 3.40
            odds_away      = 4.00
            updated_at     = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        },
        @{
            sport          = "local"
            league         = "Aruba Division di Honor"
            home_team      = "SV Nacional"
            away_team      = "SV Britannia"
            home_score     = 0
            away_score     = 0
            minute         = 0
            status         = "scheduled"
            prediction_h2h = "40-30-30"
            odds_home      = 2.10
            odds_draw      = 3.20
            odds_away      = 3.10
            updated_at     = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        }
    )
    
    try {
        $BodyStandings = ConvertTo-Json @($LocalStandings)
        $ApiUrlStandings = "$SUPABASE_URL/rest/v1/sports_standings?on_conflict=sport,league,team"
        $ResS = Post-Supabase $ApiUrlStandings $BodyStandings
        Write-Host "      ✅ Posiciones locales de Aruba actualizadas." -ForegroundColor Green
    } catch {
        Write-Host "      ⚠️ Error en posiciones locales de Aruba (¿Falta crear la tabla sports_standings?): $_" -ForegroundColor Yellow
    }

    # Limpiar partidos locales anteriores en Supabase
    try {
        $DeleteUrl = "$SUPABASE_URL/rest/v1/live_sports_matches?sport=eq.local"
        $DeleteHeaders = $Headers.Clone()
        if ($DeleteHeaders.ContainsKey("Prefer")) { $DeleteHeaders.Remove("Prefer") }
        $null = Invoke-RestMethod -Uri $DeleteUrl -Method Delete -Headers $DeleteHeaders -ErrorAction Stop
        Write-Host "      🧹 Limpiados partidos locales anteriores en la base de datos." -ForegroundColor Gray
    } catch {
        Write-Host "      ⚠️ No se pudieron limpiar partidos locales anteriores: $_" -ForegroundColor Yellow
    }

    try {
        $BodyMatches = ConvertTo-Json @($LocalMatches)
        $ApiUrlMatches = "$SUPABASE_URL/rest/v1/live_sports_matches?on_conflict=sport,league,home_team,away_team"
        $ResM = Post-Supabase $ApiUrlMatches $BodyMatches
        Write-Host "      ✅ Partidos locales de Aruba actualizados." -ForegroundColor Green
    } catch {
        Write-Host "      ❌ Error en partidos locales de Aruba: $_" -ForegroundColor Red
    }
}

# ----------------------------------------------------
# FASE 1: SCRAPING DE LOTERÍA (Lotto Aruba)
# ----------------------------------------------------
Write-Host "`n🎨 1. Iniciando Scraping de Lotería de Aruba..." -ForegroundColor Yellow
$LottoUrl = "https://www.lottoaruba.com/?results=all"

try {
    # Hacer la consulta web
    $WebResponse = Invoke-WebRequest -Uri $LottoUrl -UseBasicParsing -TimeoutSec 15
    $Html = $WebResponse.Content
    
    # Dividir el HTML por bloque de juego
    $Blocks = $Html -split '(?i)<div\s+class="jpot_res\s*">'
    
    $SuccessCount = 0
    $DrawsList = @()
    
    # El primer bloque está antes de la primera clase jpot_res, lo ignoramos
    for ($bIdx = 1; $bIdx -lt $Blocks.Count; $bIdx++) {
        $Block = $Blocks[$bIdx]
        
        # 1. Detectar juego
        $GameMatch = [regex]::Match($Block, 'alt="([^"]+)"')
        if (-not $GameMatch.Success) { continue }
        $GameRaw = $GameMatch.Groups[1].Value.Trim()
        
        $Game = ""
        $GameLower = $GameRaw.ToLower()
        if ($GameLower -eq "lotto di dia") { $Game = "lottodidia" }
        elseif ($GameLower -eq "lotto 5") { $Game = "lotto5" }
        elseif ($GameLower -eq "mini mega") { $Game = "minimega" }
        elseif ($GameLower -eq "zodiac") { $Game = "zodiac" }
        elseif ($GameLower -eq "catochi") { $Game = "catochi" }
        elseif ($GameLower -eq "big 4") { $Game = "big4" }
        
        if (-not $Game) { continue }
        
        # 2. Encontrar todos los sorteos del bloque
        # e.g., Winning Numbers:<br /><b>Sunday, June 21 | Draw # 7217</b>
        $DrawRegex = '(?s)Winning Numbers:<br\s*/?>\s*<b>([^|]+)\|\s*Draw\s*#\s*(\d+)</b>'
        $DrawMatches = [regex]::Matches($Block, $DrawRegex)
        
        for ($dIdx = 0; $dIdx -lt $DrawMatches.Count; $dIdx++) {
            $Match = $DrawMatches[$dIdx]
            $DateRaw = $Match.Groups[1].Value.Trim()
            $DrawNum = [int]$Match.Groups[2].Value.Trim()
            
            # Obtener el fragmento de HTML del sorteo
            $StartIdx = $Match.Index + $Match.Length
            $Length = $Block.Length - $StartIdx
            if ($dIdx -lt ($DrawMatches.Count - 1)) {
                $Length = $DrawMatches[$dIdx+1].Index - $StartIdx
            }
            $DrawHtml = $Block.Substring($StartIdx, $Length)
            
            # Determinar tipo (Midday o Evening)
            $DrawType = "Evening"
            if ($DrawHtml -like "*Midday Draw*" -or $DrawHtml -like "*dt_midday*") {
                $DrawType = "Midday"
            }
            
            # Formatear fecha a YYYY-MM-DD
            $DateObj = Get-Date
            $CleanDate = $DateRaw -replace '\s+', ' '
            if (-not [DateTime]::TryParse($CleanDate, [ref]$DateObj)) {
                $Year = (Get-Date).Year
                if (-not [DateTime]::TryParse("$CleanDate, $Year", [ref]$DateObj)) {
                    $DateObj = Get-Date
                }
            }
            $DrawDate = $DateObj.ToString("yyyy-MM-dd")
            
            # Parsear números ganadores
            $Numbers = ""
            $ZodiacSign = $null
            $MegaBall = $null
            
            if ($Game -eq "catochi") {
                # Catochi tiene múltiples <ul class="multip">
                $PrizeLists = [regex]::Matches($DrawHtml, '(?s)<ul class="multip"[^>]*>(.*?)</ul>')
                $Prizes = @()
                foreach ($PList in $PrizeLists) {
                    $Digits = [regex]::Matches($PList.Groups[1].Value, '<li>(\d)</li>')
                    $PrizeNum = ""
                    foreach ($D in $Digits) {
                        $PrizeNum += $D.Groups[1].Value
                    }
                    if ($PrizeNum.Length -gt 0) { $Prizes += $PrizeNum }
                }
                $Numbers = $Prizes -join "-"
            }
            elseif ($Game -eq "big4") {
                # Big 4
                $Digits = [regex]::Matches($DrawHtml, '<li>(\d)</li>')
                $NumList = @()
                foreach ($D in $Digits) { $NumList += $D.Groups[1].Value }
                if ($NumList.Count -ge 4) { $Numbers = $NumList[0..3] -join "" }
                else { $Numbers = $NumList -join "" }
            }
            elseif ($Game -eq "zodiac") {
                # Zodiac (4 dígitos + signo)
                $Digits = [regex]::Matches($DrawHtml, '<li>(\d)</li>')
                $NumList = @()
                foreach ($D in $Digits) { $NumList += $D.Groups[1].Value }
                $Numbers = $NumList[0..3] -join "-"
                
                $SignMatch = [regex]::Match($DrawHtml, 'Sign:</span>\s*<span class="rem_oth">([^<]+)</span>')
                if ($SignMatch.Success) {
                    $ZodiacSign = $SignMatch.Groups[1].Value.Trim()
                }
            }
            elseif ($Game -eq "minimega") {
                # Mini Mega (4 números + 1 Mega Ball)
                $RegularDigits = [regex]::Matches($DrawHtml, '<li>(\d+)</li>')
                $NumList = @()
                foreach ($D in $RegularDigits) { $NumList += $D.Groups[1].Value }
                $Numbers = $NumList -join "-"
                
                $MegaMatch = [regex]::Match($DrawHtml, '<li class="b_nr">(\d+)</li>')
                if ($MegaMatch.Success) {
                    $MegaBall = [int]$MegaMatch.Groups[1].Value
                }
            }
            elseif ($Game -eq "lotto5") {
                # Lotto 5
                $RegularDigits = [regex]::Matches($DrawHtml, '<li>(\d+)</li>')
                $NumList = @()
                foreach ($D in $RegularDigits) { $NumList += $D.Groups[1].Value }
                $Numbers = $NumList -join "-"
            }
            else {
                # Lotto di Dia
                $RegularDigits = [regex]::Matches($DrawHtml, '<li>(\d+)</li>')
                $NumList = @()
                foreach ($D in $RegularDigits) { $NumList += $D.Groups[1].Value }
                $Numbers = $NumList -join "-"
            }
            
            if ($Numbers.Length -gt 0) {
                $Payload = @{
                    game        = $Game
                    draw_number = $DrawNum
                    draw_date   = $DrawDate
                    draw_type   = $DrawType
                    numbers     = $Numbers
                    zodiac_sign = $null
                    mega_ball   = $null
                }
                if ($ZodiacSign) { $Payload["zodiac_sign"] = $ZodiacSign }
                if ($MegaBall -ne $null) { $Payload["mega_ball"] = $MegaBall }
                
                $DrawsList += $Payload
            }
        }
    }
    
    # Subir resultados a Supabase
    if ($DrawsList.Count -gt 0) {
        $Body = ConvertTo-Json @($DrawsList)
        $ApiUrl = "$SUPABASE_URL/rest/v1/lottery_draws?on_conflict=game,draw_number,draw_type"
        $Res = Post-Supabase $ApiUrl $Body
        Write-Host "✅ Lotería sincronizada: $($DrawsList.Count) sorteos subidos con éxito." -ForegroundColor Green
    } else {
        Write-Host "⚠️ No se detectaron sorteos en el formato HTML esperado." -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Error en el Scraping de Lotería: $_" -ForegroundColor Red
}

# ----------------------------------------------------
# FASE 2: CLIMA (Weather)
# ----------------------------------------------------
Write-Host "`n🌦️ 2. Sincronizando Clima actual de Aruba..." -ForegroundColor Yellow
try {
    # Clima real de Aruba usando API libre Open-Meteo
    $WeatherApi = "https://api.open-meteo.com/v1/forecast?latitude=12.5246&longitude=-70.0278&current_weather=true"
    $WeatherRes = Invoke-RestMethod -Uri $WeatherApi -Method Get
    
    $Temp = $WeatherRes.current_weather.temperature
    $Wind = $WeatherRes.current_weather.windspeed
    $Code = $WeatherRes.current_weather.weathercode
    
    $Desc = "Despejado"
    $Icon = "sunny"
    if ($Code -eq 0) { $Desc = "Soleado"; $Icon = "sunny" }
    elseif ($Code -ge 1 -and $Code -le 3) { $Desc = "Parcialmente Nublado"; $Icon = "cloudy" }
    elseif ($Code -ge 51 -and $Code -le 67) { $Desc = "Llovizna ligera"; $Icon = "rainy" }
    elseif ($Code -ge 71 -and $Code -le 82) { $Desc = "Lluvia persistente"; $Icon = "rainy" }
    
    $WeatherPayload = @{
        id          = 1
        temperature = $Temp
        description = $Desc
        humidity    = 74
        wind_speed  = $Wind
        icon        = $Icon
        updated_at  = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    }
    
    $Body = ConvertTo-Json $WeatherPayload
    $ApiUrl = "$SUPABASE_URL/rest/v1/weather_data?on_conflict=id"
    $Res = Post-Supabase $ApiUrl $Body
    Write-Host "✅ Clima de Aruba actualizado a $($Temp)°C ($Desc) con éxito." -ForegroundColor Green
} catch {
    Write-Host "❌ Error actualizando clima: $_" -ForegroundColor Red
}

# ----------------------------------------------------
# FASE 3: DEPORTES (Live Sports & Standings from ESPN)
# ----------------------------------------------------
Write-Host "`n⚽ 3. Sincronizando partidos de Deportes locales/globales..." -ForegroundColor Yellow

# Sincronizar Posiciones desde ESPN
Sync-EspnStandings "soccer" "esp.1"       # La Liga
Sync-EspnStandings "soccer" "eng.1"       # Premier League
Sync-EspnStandings "soccer" "fra.1"       # Ligue 1
Sync-EspnStandings "soccer" "ger.1"       # Bundesliga
Sync-EspnStandings "soccer" "mex.1"       # Liga MX
Sync-EspnStandings "soccer" "fifa.world"  # Mundial
Sync-EspnStandings "basketball" "nba"     # NBA
Sync-EspnStandings "baseball" "mlb"       # MLB
Sync-EspnStandings "hockey" "nhl"         # NHL

# Sincronizar Partidos en vivo / Scoreboards desde ESPN
Sync-EspnScoreboard "soccer" "esp.1"      # La Liga
Sync-EspnScoreboard "soccer" "eng.1"      # Premier League
Sync-EspnScoreboard "soccer" "fra.1"      # Ligue 1
Sync-EspnScoreboard "soccer" "ger.1"      # Bundesliga
Sync-EspnScoreboard "soccer" "mex.1"      # Liga MX
Sync-EspnScoreboard "soccer" "fifa.world" # Mundial
Sync-EspnScoreboard "basketball" "nba"    # NBA
Sync-EspnScoreboard "baseball" "mlb"      # MLB
Sync-EspnScoreboard "hockey" "nhl"        # NHL

# Sincronizar deportes locales
Sync-LocalArubaSports

# ----------------------------------------------------
# FASE 4: VUELOS (Flight Arrivals)
# ----------------------------------------------------
Write-Host "`n✈️ 4. Sincronizando vuelos de llegada al Aeropuerto Reina Beatrix (AUA)..." -ForegroundColor Yellow
try {
    $FlightsPayload = @(
        @{
            flight_number  = "AA 1028"
            airline        = "American Airlines"
            origin         = "Miami (MIA)"
            scheduled_time = "08:30:00"
            estimated_time = "08:25:00"
            status         = "landed"
            gate           = "Gate A4"
        },
        @{
            flight_number  = "B6 1421"
            airline        = "JetBlue"
            origin         = "New York (JFK)"
            scheduled_time = "09:15:00"
            estimated_time = "09:15:00"
            status         = "landed"
            gate           = "Gate B1"
        },
        @{
            flight_number  = "UA 1452"
            airline        = "United Airlines"
            origin         = "Newark (EWR)"
            scheduled_time = "10:10:00"
            estimated_time = "10:10:00"
            status         = "landed"
            gate           = "Gate A6"
        },
        @{
            flight_number  = "DL 580"
            airline        = "Delta Air Lines"
            origin         = "Atlanta (ATL)"
            scheduled_time = "10:45:00"
            estimated_time = "10:40:00"
            status         = "landed"
            gate           = "Gate B2"
        },
        @{
            flight_number  = "AA 2204"
            airline        = "American Airlines"
            origin         = "Charlotte (CLT)"
            scheduled_time = "11:20:00"
            estimated_time = "11:35:00"
            status         = "landed"
            gate           = "Gate A3"
        },
        @{
            flight_number  = "AV 092"
            airline        = "Avianca"
            origin         = "Bogota (BOG)"
            scheduled_time = "11:55:00"
            estimated_time = "11:55:00"
            status         = "landed"
            gate           = "Gate C1"
        },
        @{
            flight_number  = "KL 773"
            airline        = "KLM"
            origin         = "Amsterdam (AMS)"
            scheduled_time = "12:30:00"
            estimated_time = "12:30:00"
            status         = "landed"
            gate           = "Gate C4"
        },
        @{
            flight_number  = "CM 348"
            airline        = "Copa Airlines"
            origin         = "Panama City (PTY)"
            scheduled_time = "13:10:00"
            estimated_time = "13:20:00"
            status         = "landed"
            gate           = "Gate C2"
        },
        @{
            flight_number  = "DL 561"
            airline        = "Delta Air Lines"
            origin         = "Atlanta (ATL)"
            scheduled_time = "13:45:00"
            estimated_time = "13:45:00"
            status         = "scheduled"
            gate           = "Gate B3"
        },
        @{
            flight_number  = "AA 1024"
            airline        = "American Airlines"
            origin         = "Miami (MIA)"
            scheduled_time = "14:15:00"
            estimated_time = "14:10:00"
            status         = "scheduled"
            gate           = "Gate A4"
        },
        @{
            flight_number  = "B6 821"
            airline        = "JetBlue"
            origin         = "Boston (BOS)"
            scheduled_time = "14:50:00"
            estimated_time = "15:05:00"
            status         = "delayed"
            gate           = "Gate B1"
        },
        @{
            flight_number  = "UA 788"
            airline        = "United Airlines"
            origin         = "Chicago (ORD)"
            scheduled_time = "15:30:00"
            estimated_time = "15:30:00"
            status         = "scheduled"
            gate           = "Gate A5"
        },
        @{
            flight_number  = "W3 2411"
            airline        = "Wingo"
            origin         = "Medellin (MDE)"
            scheduled_time = "16:05:00"
            estimated_time = "16:05:00"
            status         = "scheduled"
            gate           = "Gate C3"
        },
        @{
            flight_number  = "PY 462"
            airline        = "Surinam Airways"
            origin         = "Paramaribo (PBM)"
            scheduled_time = "16:45:00"
            estimated_time = "17:15:00"
            status         = "delayed"
            gate           = "Gate C1"
        },
        @{
            flight_number  = "AD 981"
            airline        = "Aruba Airlines"
            origin         = "Curacao (CUR)"
            scheduled_time = "17:30:00"
            estimated_time = "17:30:00"
            status         = "scheduled"
            gate           = "Gate A2"
        },
        @{
            flight_number  = "JY 702"
            airline        = "interCaribbean"
            origin         = "Santo Domingo (SDQ)"
            scheduled_time = "18:15:00"
            estimated_time = "18:15:00"
            status         = "scheduled"
            gate           = "Gate A1"
        },
        @{
            flight_number  = "AA 1604"
            airline        = "American Airlines"
            origin         = "Philadelphia (PHL)"
            scheduled_time = "19:00:00"
            estimated_time = "19:00:00"
            status         = "scheduled"
            gate           = "Gate A3"
        },
        @{
            flight_number  = "DL 612"
            airline        = "Delta Air Lines"
            origin         = "Atlanta (ATL)"
            scheduled_time = "19:45:00"
            estimated_time = "19:45:00"
            status         = "scheduled"
            gate           = "Gate B2"
        },
        @{
            flight_number  = "B6 1802"
            airline        = "JetBlue"
            origin         = "Fort Lauderdale (FLL)"
            scheduled_time = "20:30:00"
            estimated_time = "20:30:00"
            status         = "scheduled"
            gate           = "Gate B3"
        },
        @{
            flight_number  = "UA 1012"
            airline        = "United Airlines"
            origin         = "Houston (IAH)"
            scheduled_time = "21:15:00"
            estimated_time = "21:15:00"
            status         = "scheduled"
            gate           = "Gate A5"
        }
    )
    
    $Body = ConvertTo-Json $FlightsPayload
    $ApiUrl = "$SUPABASE_URL/rest/v1/flight_arrivals?on_conflict=flight_number,scheduled_time"
    $Res = Post-Supabase $ApiUrl $Body
    Write-Host "✅ Tabla de llegadas de vuelos actualizada con éxito." -ForegroundColor Green
} catch {
    Write-Host "❌ Error actualizando vuelos: $_" -ForegroundColor Red
}

Write-Host "`n🎉 [SINCRO COMPLETADA] Todos los datos locales están al día en Supabase." -ForegroundColor Green
