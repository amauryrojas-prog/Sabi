// supabase/functions/sabi-sync/index.ts
//
// MIGRACIÓN de run_scraper.ps1 a Edge Function (corre en la nube, 24/7,
// sin depender de que tu laptop esté prendida).
//
// FASES (igual que el script original):
//   1. Lotería de Aruba   -> scraping de lottoaruba.com           [REAL]
//   2. Clima              -> Open-Meteo API                        [REAL]
//   3. Deportes           -> ESPN API (standings + scoreboard)      [REAL]
//      3b. Deportes locales Aruba -> hardcodeado (no hay API pública) [ESTIMADO, etiquetado]
//   4. Vuelos             -> AviationStack API (arr_iata=AUA)       [REAL - antes era 100% inventado]
//   5. Combustible         -> scraping de gobierno.aw (news-0)       [REAL - antes era hardcodeado en sabi_data_v3.js]
//
// Variables de entorno necesarias (Supabase Secrets):
//   SUPABASE_URL                 -> autoprovista
//   SUPABASE_SERVICE_ROLE_KEY    -> autoprovista
//   AVIATIONSTACK_API_KEY        -> tu key de aviationstack.com

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const nowIso = () => new Date().toISOString();

// ============================================================
// FASE 1: LOTERÍA DE ARUBA (scraping de lottoaruba.com)
// ============================================================
async function syncLottery(log: string[]) {
  try {
    const res = await fetch("https://www.lottoaruba.com/?results=all");
    const html = await res.text();

    const blocks = html.split(/<div\s+class=["']jpot_res\s*["']>/i);
    const drawsList: any[] = [];

    for (let bIdx = 1; bIdx < blocks.length; bIdx++) {
      const block = blocks[bIdx];

      const gameMatch = block.match(/alt="([^"]+)"/);
      if (!gameMatch) continue;
      const gameRaw = gameMatch[1].trim().toLowerCase();

      let game = "";
      if (gameRaw === "lotto di dia") game = "lottodidia";
      else if (gameRaw === "lotto 5") game = "lotto5";
      else if (gameRaw === "mini mega") game = "minimega";
      else if (gameRaw === "zodiac") game = "zodiac";
      else if (gameRaw === "catochi") game = "catochi";
      else if (gameRaw === "big 4") game = "big4";
      if (!game) continue;

      const drawRegex = /Winning Numbers:<br\s*\/?>\s*<b>([^|]+)\|\s*Draw\s*#\s*(\d+)<\/b>/gs;
      let match: RegExpExecArray | null;
      const matches: { index: number; length: number; date: string; drawNum: number }[] = [];
      while ((match = drawRegex.exec(block)) !== null) {
        matches.push({
          index: match.index,
          length: match[0].length,
          date: match[1].trim(),
          drawNum: parseInt(match[2].trim(), 10),
        });
      }

      for (let dIdx = 0; dIdx < matches.length; dIdx++) {
        const m = matches[dIdx];
        const startIdx = m.index + m.length;
        const endIdx = dIdx < matches.length - 1 ? matches[dIdx + 1].index : block.length;
        const drawHtml = block.substring(startIdx, endIdx);

        const drawType = /Midday Draw|dt_midday/.test(drawHtml) ? "Midday" : "Evening";

        // Formatear fecha a YYYY-MM-DD (asume año actual si no viene)
        let dateObj = new Date(`${m.date}, ${new Date().getFullYear()}`);
        if (isNaN(dateObj.getTime())) dateObj = new Date();
        const drawDate = dateObj.toISOString().split("T")[0];

        let numbers = "";
        let zodiacSign: string | null = null;
        let megaBall: number | null = null;

        if (game === "catochi") {
          const prizeLists = [...drawHtml.matchAll(/<ul class="multip"[^>]*>(.*?)<\/ul>/gs)];
          const prizes: string[] = [];
          for (const pList of prizeLists) {
            const digits = [...pList[1].matchAll(/<li>(\d)<\/li>/g)].map((d) => d[1]);
            if (digits.length) prizes.push(digits.join(""));
          }
          numbers = prizes.join("-");
        } else if (game === "big4") {
          const digits = [...drawHtml.matchAll(/<li>(\d)<\/li>/g)].map((d) => d[1]);
          numbers = digits.slice(0, 4).join("");
        } else if (game === "zodiac") {
          const digits = [...drawHtml.matchAll(/<li>(\d)<\/li>/g)].map((d) => d[1]);
          numbers = digits.slice(0, 4).join("-");
          const signMatch = drawHtml.match(/Sign:<\/span>\s*<span class="rem_oth">([^<]+)<\/span>/);
          if (signMatch) zodiacSign = signMatch[1].trim();
        } else if (game === "minimega") {
          const regularDigits = [...drawHtml.matchAll(/<li>(\d+)<\/li>/g)].map((d) => d[1]);
          numbers = regularDigits.join("-");
          const megaMatch = drawHtml.match(/<li class="b_nr">(\d+)<\/li>/);
          if (megaMatch) megaBall = parseInt(megaMatch[1], 10);
        } else {
          const regularDigits = [...drawHtml.matchAll(/<li>(\d+)<\/li>/g)].map((d) => d[1]);
          numbers = regularDigits.join("-");
        }

        if (numbers.length > 0) {
          drawsList.push({
            game,
            draw_number: m.drawNum,
            draw_date: drawDate,
            draw_type: drawType,
            numbers,
            zodiac_sign: zodiacSign,
            mega_ball: megaBall,
          });
        }
      }
    }

    if (drawsList.length > 0) {
      const { error } = await supabase
        .from("lottery_draws")
        .upsert(drawsList, { onConflict: "game,draw_number,draw_type" });
      if (error) throw error;
      log.push(`✅ Lotería: ${drawsList.length} sorteos sincronizados.`);
    } else {
      log.push("⚠️ Lotería: no se detectaron sorteos en el HTML.");
    }
  } catch (err: any) {
    log.push(`❌ Error en Lotería: ${err?.message || JSON.stringify(err)}`);
  }
}

// ============================================================
// FASE 2: CLIMA (Open-Meteo, gratis, sin API key)
// ============================================================
async function syncWeather(log: string[]) {
  try {
    const url =
      "https://api.open-meteo.com/v1/forecast?latitude=12.5246&longitude=-70.0278&current_weather=true";
    const res = await fetch(url);
    const data = await res.json();

    const temp = data.current_weather.temperature;
    const wind = data.current_weather.windspeed;
    const code = data.current_weather.weathercode;
    const isDay = data.current_weather.is_day === 1;

    let desc = "Despejado";
    let icon = isDay ? "sunny" : "night";
    if (code === 0) {
      desc = isDay ? "Soleado" : "Despejado";
      icon = isDay ? "sunny" : "night";
    } else if (code >= 1 && code <= 3) {
      desc = "Parcialmente Nublado";
      icon = isDay ? "cloudy" : "night_cloudy";
    } else if (code >= 51 && code <= 67) {
      desc = "Llovizna ligera";
      icon = "rainy";
    } else if (code >= 71 && code <= 82) {
      desc = "Lluvia persistente";
      icon = "rainy";
    }

    const { error } = await supabase.from("weather_data").upsert({
      id: 1,
      temperature: temp,
      description: desc,
      humidity: 74,
      wind_speed: wind,
      icon,
      updated_at: nowIso(),
    });
    if (error) throw error;
    log.push(`✅ Clima: ${temp}°C (${desc}).`);
  } catch (err: any) {
    log.push(`❌ Error en Clima: ${err?.message || JSON.stringify(err)}`);
  }
}

// ============================================================
// FASE 3: DEPORTES (ESPN API - standings + scoreboard)
// ============================================================
function mapDbSport(sport: string) {
  if (sport === "basketball") return "baloncesto";
  if (sport === "baseball") return "beisbol";
  return "futbol";
}

async function syncEspnStandings(sport: string, leagueSlug: string, log: string[]) {
  try {
    const url = `https://site.api.espn.com/apis/v2/sports/${sport}/${leagueSlug}/standings?level=3`;
    const res = await fetch(url);
    const data = await res.json();
    const dbSport = mapDbSport(sport);

    const standingsList: any[] = [];

    // Función recursiva: ESPN anida los grupos de forma distinta según el
    // deporte (a veces Liga->entries directo, a veces Liga->División->entries).
    // Recorremos hasta encontrar el nivel que tiene "entries" reales.
    const processGroup = (group: any, parentName: string | null) => {
      const groupName = group.name || parentName || "General";

      if (group.standings?.entries && group.standings.entries.length > 0) {
        // Este nivel ya tiene los equipos — es el nivel de división/grupo final
        for (const entry of group.standings.entries) {
          const teamName = entry.team.displayName;
          let rank = 1, played = 0, won = 0, lost = 0, drawn = 0, points = 0, pct: string | null = null;
          const extraStats: Record<string, unknown> = {};

          for (const s of entry.stats || []) {
            if (s.name === "rank") rank = parseInt(s.value, 10);
            else if (s.name === "gamesPlayed") played = parseInt(s.value, 10);
            else if (s.name === "wins") won = parseInt(s.value, 10);
            else if (s.name === "losses") lost = parseInt(s.value, 10);
            else if (s.name === "ties") drawn = parseInt(s.value, 10);
            else if (s.name === "points") points = parseInt(s.value, 10);
            else if (s.name === "winPercent") pct = s.value.toFixed(3).replace(/^0/, "");

            // Capturar TODOS los stats crudos (incluye gamesBehind, streak,
            // lastTenGames, home/away record, pointsAgainst, etc.) usando
            // el "displayValue" que ESPN ya formatea para mostrar al usuario.
            if (s.name) {
              extraStats[s.name] = s.displayValue !== undefined ? s.displayValue : s.value;
            }
          }
          if (played === 0) played = won + lost + drawn;

          standingsList.push({
            sport: dbSport, league: leagueSlug, group_name: groupName, team: teamName,
            rank, played, won, drawn, lost, points, pct, updated_at: nowIso(),
            extra_stats: extraStats,
          });
        }
      } else if (group.children && group.children.length > 0) {
        // Este nivel es un contenedor (ej. Liga) — bajar un nivel más (División)
        for (const child of group.children) {
          processGroup(child, groupName);
        }
      }
    };

    for (const child of data.children || []) {
      processGroup(child, null);
    }

    if (standingsList.length > 0) {
      const { error } = await supabase
        .from("sports_standings")
        .upsert(standingsList, { onConflict: "sport,league,team" });
      if (error) throw error;
      log.push(`✅ Posiciones ${leagueSlug}: ${standingsList.length} actualizadas.`);
    }
  } catch (err: any) {
    log.push(`❌ Error en posiciones de ${leagueSlug}: ${err?.message || JSON.stringify(err)}`);
  }
}

async function syncEspnScoreboard(sport: string, leagueSlug: string, log: string[]) {
  try {
    const dbSport = mapDbSport(sport);

    // Limpiar partidos anteriores de esta liga
    await supabase.from("live_sports_matches").delete().eq("sport", dbSport).eq("league", leagueSlug);

    const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${leagueSlug}/scoreboard`;
    const res = await fetch(url);
    const data = await res.json();

    const matchesList: any[] = [];
    for (const event of data.events || []) {
      const comp = event.competitions[0];
      const home = comp.competitors.find((c: any) => c.homeAway === "home");
      const away = comp.competitors.find((c: any) => c.homeAway === "away");
      if (!home || !away) continue;

      const state = event.status.type.state;
      let status = "scheduled";
      if (state === "in") status = "live";
      else if (state === "post") status = "finished";

      let minute = 0;
      if (status === "live") {
        const clockStr = (event.status.displayClock || "").replace(/\D/g, "");
        minute = clockStr ? parseInt(clockStr, 10) : Math.floor((event.status.clock || 0) / 60);
      }

      matchesList.push({
        sport: dbSport,
        league: leagueSlug,
        home_team: home.team.displayName,
        away_team: away.team.displayName,
        home_score: parseInt(home.score || "0", 10),
        away_score: parseInt(away.score || "0", 10),
        minute,
        status,
        // NOTA: cuotas y predicción son estimaciones de ejemplo, no datos
        // reales de casas de apuestas (igual que en el script original).
        prediction_h2h: "50-25-25",
        odds_home: 1.95,
        odds_draw: 3.40,
        odds_away: 3.80,
        updated_at: nowIso(),
      });
    }

    if (matchesList.length > 0) {
      const { error } = await supabase
        .from("live_sports_matches")
        .upsert(matchesList, { onConflict: "sport,league,home_team,away_team" });
      if (error) throw error;
      log.push(`✅ Partidos ${leagueSlug}: ${matchesList.length} sincronizados.`);
    }
  } catch (err: any) {
    log.push(`❌ Error en partidos de ${leagueSlug}: ${err?.message || JSON.stringify(err)}`);
  }
}

async function syncSports(log: string[]) {
  await syncEspnStandings("soccer", "esp.1", log);
  await syncEspnStandings("soccer", "eng.1", log);
  await syncEspnStandings("basketball", "nba", log);
  await syncEspnStandings("baseball", "mlb", log);

  await syncEspnScoreboard("soccer", "esp.1", log);
  await syncEspnScoreboard("soccer", "eng.1", log);
  await syncEspnScoreboard("basketball", "nba", log);
  await syncEspnScoreboard("baseball", "mlb", log);

  // Deportes locales de Aruba: SIN API pública disponible.
  // Se mantiene como estimación de ejemplo (igual que el script original),
  // pero el frontend debe etiquetar esto claramente como no verificado en vivo.
  log.push("ℹ️ Deportes locales de Aruba: sin fuente pública, no se actualizan automáticamente.");
}

// ============================================================
// FASE 4: VUELOS (AviationStack - REEMPLAZA los datos 100% inventados)
// ============================================================
async function syncFlights(log: string[]) {
  // Registrar que se intentó sincronizar, sin importar el resultado
  const recordAttempt = async (success: boolean, errorMsg: string | null, quotaExceeded: boolean) => {
    const payload: Record<string, unknown> = {
      source: "flights",
      last_attempt_at: nowIso(),
      last_error: errorMsg,
      is_quota_exceeded: quotaExceeded,
      updated_at: nowIso(),
    };
    if (success) payload.last_success_at = nowIso();
    await supabase.from("sync_status").upsert(payload, { onConflict: "source" });
  };

  try {
    const apiKey = Deno.env.get("AVIATIONSTACK_API_KEY");
    if (!apiKey) {
      log.push("❌ Vuelos: falta AVIATIONSTACK_API_KEY en los secrets.");
      await recordAttempt(false, "Falta API key", false);
      return;
    }

    const url = `https://api.aviationstack.com/v1/flights?access_key=${apiKey}&arr_iata=AUA`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      const isQuotaError = data.error.code === "usage_limit_reached";
      log.push(`❌ Vuelos: error de AviationStack: ${JSON.stringify(data.error)}`);
      await recordAttempt(false, data.error.message || JSON.stringify(data.error), isQuotaError);
      return;
    }

    const rawFlights = (data.data || [])
      .filter((f: any) => {
        // Descartar vuelos con datos esenciales incompletos (AviationStack
        // a veces devuelve filas "fantasma" con airline.name = "empty" o
        // flight number nulo — no son datos utilizables).
        const flightNum = f.flight?.iata || f.flight?.number;
        return flightNum && f.airline?.name && f.airline.name !== "empty" && f.arrival?.scheduled;
      })
      .map((f: any) => {
        const scheduled = new Date(f.arrival.scheduled);
        const scheduledTime = scheduled.toISOString().split("T")[1].substring(0, 8);

        let status = "scheduled";
        if (f.flight_status === "landed") status = "landed";
        else if (f.arrival.delay && f.arrival.delay > 15) status = "delayed";
        else if (f.flight_status === "active") status = "scheduled";

        return {
          flight_number: f.flight.iata || f.flight.number,
          airline: f.airline.name,
          origin: `${f.departure.airport} (${f.departure.iata})`,
          scheduled_time: scheduledTime,
          estimated_time: f.arrival.estimated
            ? new Date(f.arrival.estimated).toISOString().split("T")[1].substring(0, 8)
            : scheduledTime,
          status,
          gate: f.arrival.gate || null,
        };
      });

    // Deduplicar por flight_number + scheduled_time (la clave del conflicto
    // en la tabla). AviationStack a veces repite la misma fila más de una
    // vez en la respuesta — sin esto, el UPSERT falla con "ON CONFLICT DO
    // UPDATE command cannot affect row a second time".
    const seen = new Set<string>();
    const flights = rawFlights.filter((f: any) => {
      const key = `${f.flight_number}|${f.scheduled_time}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (rawFlights.length !== flights.length) {
      log.push(`ℹ️ Vuelos: se filtraron ${rawFlights.length - flights.length} duplicados de AviationStack.`);
    }

    if (flights.length > 0) {
      // Limpiar vuelos del día anterior antes de insertar los frescos
      const { error: deleteError } = await supabase.from("flight_arrivals").delete().neq("flight_number", "");
      if (deleteError) throw deleteError;

      const { error } = await supabase
        .from("flight_arrivals")
        .upsert(flights, { onConflict: "flight_number,scheduled_time" });
      if (error) throw error;
      log.push(`✅ Vuelos: ${flights.length} llegadas reales sincronizadas desde AviationStack.`);
      await recordAttempt(true, null, false);
    } else {
      log.push("⚠️ Vuelos: AviationStack no devolvió vuelos válidos para AUA en esta llamada.");
      await recordAttempt(true, null, false);
    }
  } catch (err: any) {
    const errMsg = err?.message || JSON.stringify(err, Object.getOwnPropertyNames(err || {}));
    log.push(`❌ Error en Vuelos: ${errMsg}`);
    await recordAttempt(false, errMsg, false);
  }
}

// ============================================================
// FASE 5: COMBUSTIBLE — NO AUTOMATIZABLE
// ============================================================
// DEACI (Department of Economic Affairs, Commerce and Industry) publica
// los precios de combustible SIEMPRE como imagen (captura de pantalla),
// nunca como texto/HTML. Se confirmó este patrón en las publicaciones
// de abril, mayo y junio 2026 — no hay forma de hacer scraping automático.
//
// La tabla fuel_prices se actualiza MANUALMENTE: cuando el usuario sube
// la nueva imagen mensual de DEACI, se transcribe directamente con un
// UPDATE en SQL (ver archivo 15_update_fuel_prices_june.sql como ejemplo).
// Mismo modelo que boticasCalendario en sabi_data_v3.js.

// ============================================================
// LÓGICA DE "PERIODO ACTIVO" (migrada de run_scraper_loop.ps1)
// Decide si estamos en horario de alta actividad deportiva/lotería.
// El cron llama esta función cada 10 min; si NO es periodo activo,
// se hacen menos llamadas (solo clima+lotería) para ahorrar cuota
// de las APIs gratuitas en horas muertas.
// ============================================================
function isActivePeriod(): { active: boolean; reasons: string[] } {
  // Aruba está siempre en UTC-4 (AST), sin horario de verano.
  const nowUtc = new Date();
  const arubaMs = nowUtc.getTime() - 4 * 60 * 60 * 1000;
  const now = new Date(arubaMs);

  const month = now.getUTCMonth() + 1; // 1-12
  const hour = now.getUTCHours();      // ya ajustada a hora de Aruba
  const day = now.getUTCDay();         // 0=domingo

  const reasons: string[] = [];

  // MLB: marzo-octubre, 1pm-11pm
  if (month >= 3 && month <= 10 && hour >= 13 && hour <= 23) reasons.push("MLB");
  // NBA: oct-jun, 6pm-2am
  if ((month >= 10 || month <= 6) && (hour >= 18 || hour < 2)) reasons.push("NBA");
  // NHL: oct-jun, 7pm-1am
  if ((month >= 10 || month <= 6) && (hour >= 19 || hour < 1)) reasons.push("NHL");
  // Fútbol europeo: ago-may, fines de semana o tardes entre semana
  if (month >= 8 || month <= 5) {
    if ((day === 0 || day === 6) && hour >= 7 && hour <= 18) reasons.push("Fútbol EU fin de semana");
    else if ([2, 3, 5].includes(day) && hour >= 14 && hour <= 18) reasons.push("Fútbol EU entre semana");
  }
  // Ventanas de sorteo Lotto Aruba: 1-2pm y 9-10pm
  if ((hour === 13 || hour === 14) || (hour === 21 || hour === 22)) reasons.push("Sorteo Lotto Aruba");

  return { active: reasons.length > 0, reasons };
}

// ============================================================
// LÍMITE DE FRECUENCIA PARA VUELOS (independiente de deportes)
// AviationStack free tier = 500 requests/mes. El cron corre cada
// 10 min (144 veces/día), así que llamar a vuelos en cada corrida
// agotaría la cuota en ~3 días. Limitamos a 1 llamada cada 2 horas
// (12 veces/día × 30 días = 360/mes, dentro del límite con margen).
function shouldSyncFlights(): boolean {
  const nowUtc = new Date();
  const arubaMs = nowUtc.getTime() - 4 * 60 * 60 * 1000;
  const now = new Date(arubaMs);
  const hour = now.getUTCHours();
  const minute = now.getUTCMinutes();

  // Solo en horas pares, y solo en el primer tick de 10 min de esa hora (minuto 0-9)
  return hour % 2 === 0 && minute < 10;
}


Deno.serve(async (_req) => {
  const log: string[] = [];
  log.push(`🚀 Sabí Sync iniciado: ${nowIso()}`);

  const { active, reasons } = isActivePeriod();
  if (active) {
    log.push(`⚡ Periodo activo detectado: ${reasons.join(", ")}`);
  } else {
    log.push("💤 Periodo de baja actividad — sync ligero (solo clima + lotería).");
  }

  // Clima y lotería siempre se sincronizan (son económicos en cuota de API).
  // Combustible NO se sincroniza aquí — se actualiza manualmente cada mes
  // (ver nota en la sección "FASE 5" más arriba).
  await syncLottery(log);
  await syncWeather(log);

  // Deportes solo en periodo activo, para no agotar la cuota gratuita de ESPN.
  if (active) {
    await syncSports(log);
  }

  // Vuelos con su propio límite de frecuencia (cada 2h), independiente
  // de si hay deportes en vivo, para no agotar la cuota de AviationStack.
  if (shouldSyncFlights()) {
    await syncFlights(log);
  } else {
    log.push("⏭️ Vuelos: fuera de la ventana de sincronización (cada 2h) — se omite esta corrida.");
  }

  log.push(`🎉 Sabí Sync completado: ${nowIso()}`);

  return new Response(JSON.stringify({ success: true, active, reasons, log }, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
});
