// =============================================================================
// SABI — EF scrape-lotto V5: histórico de 3+ años via xjpot-tab.php
// =============================================================================
//床上睡觉
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LOTTO_URL = "https://www.lottoaruba.com/templates/lotto/xjpot-tab.php";

const GAMES: Record<string, {
  i: number;
  label: string;
  multiDraw: boolean;
}> = {
  lottodidia:   { i: 3, label: "Lotto di Dia",   multiDraw: false },
  lotto5:       { i: 2, label: "Lotto 5",        multiDraw: false },
  minimega:     { i: 1, label: "Mini Mega",      multiDraw: false },
  big4:         { i: 4, label: "Big 4",          multiDraw: true  },
  catochi:      { i: 5, label: "Catochi",        multiDraw: true  },
  zodiac:       { i: 6, label: "Zodiac",        multiDraw: true  },
  landsloterie: { i: 7, label: "Landsloterie",  multiDraw: false },
  cachicachi:   { i: 8, label: "Cachi Cachi",   multiDraw: false },
  "1off":       { i: 11,label: "1-OFF",          multiDraw: true  },
  lucky3:       { i: 12,label: "Lucky 3",       multiDraw: true  },
};

const GAME_RANGES: Record<string, [number, number]> = {
  lottodidia:[0,99], lotto5:[0,99], minimega:[0,36],
  big4:[0,9], catochi:[0,9], zodiac:[0,9],
  landsloterie:[0,99], cachicachi:[0,99], "1off":[0,9], lucky3:[0,9],
};

async function fetchPage(i: number, p: number, retries = 3): Promise<string> {
  const body = new URLSearchParams({ i: String(i), p: String(p) }).toString();
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const resp = await fetch(LOTTO_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.text();
    } catch (e) {
      if (attempt === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw new Error("unreachable");
}

function parseDate(dateStr: string): string {
  const months: Record<string, string> = {
    Jan:"01",Feb:"02",Mar:"03",Apr:"04",May:"05",Jun:"06",
    Jul:"07",Aug:"08",Sep:"09",Oct:"10",Nov:"11",Dec:"12",
  };
  const m = dateStr.match(/(\w+)\s+(\d+),\s+(\d{4})/);
  if (!m) return dateStr;
  return `${m[3]}-${months[m[1]] || "01"}-${m[2].padStart(2, "0")}`;
}

function parseNumbers(numbersStr: string): number[] {
  return numbersStr.split("-").map(s => parseInt(s, 10)).filter(n => !isNaN(n));
}

function validateNumbers(game: string, numbers: number[]): boolean {
  const range = GAME_RANGES[game] || [0, 99];
  if (numbers.some(n => n < range[0] || n > range[1])) return false;
  if (game === "lucky3" && numbers.length !== 3) return false;
  if (game === "1off" && numbers.length !== 4) return false;
  if (game === "big4" && numbers.length !== 4) return false;
  return true;
}

function extractMultiplier(raw: string | undefined): string | null {
  if (!raw) return null;
  const u = raw.toUpperCase();
  if (u.includes("X2")) return "X2";
  if (u.includes("FP")) return "FP";
  return raw;
}

// Simple games (3 TDs): date | draw_number | numbers
// Groups: [date, draw_number, numbers]
const SIMPLE_PAT = /<tr class="tr_y[ai]">\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>([0-9][0-9\-]+)<\/td>/gi;

// Multi-draw games (5 TDs): date | draw_type | draw_number | numbers | multiplier
// Groups: [date, draw_type, draw_number, numbers, multiplier]
const MULTI_PAT = /<tr class="tr_y[ai]">\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>(\d+)<\/td>\s*<td[^>]*>([0-9][0-9\-]+)<\/td>\s*(?:<td[^>]*>([^<]*)<\/td>)?/gi;

interface Row {
  date: string;
  draw_number: number;
  numbers: number[];
  draw_type: string | null;
  multi_x: string | null;
}

async function scrapeGame(
  gameSlug: string,
  pageStart = 0,
  pageEnd: number | null = null
): Promise<{ rows: Row[]; lastPage: number }> {
  const fmt = GAMES[gameSlug];
  if (!fmt) throw new Error("Unknown game: " + gameSlug);

  const html0 = await fetchPage(fmt.i, 0);
  if (!html0) return { rows: [], lastPage: 0 };

  let lastPage = 0;
  const pageMatches = [...html0.matchAll(/data-page="(\d+)"/gi)];
  if (pageMatches.length > 0) lastPage = Math.max(...pageMatches.map((m: any) => parseInt(m[1], 10)));

  const endP = pageEnd !== null ? Math.min(pageEnd, lastPage) : lastPage;
  const startP = Math.max(1, pageStart);
  const pagesToFetch: number[] = [];
  for (let p = startP; p <= endP; p++) pagesToFetch.push(p);
  if (pagesToFetch.length === 0) pagesToFetch = [1];

  const seenKeys = new Set<string>();
  const rows: Row[] = [];
  const BATCH = 4;

  for (let i = 0; i < pagesToFetch.length; i += BATCH) {
    const batch = pagesToFetch.slice(i, i + BATCH);
    const htmls = await Promise.all(batch.map(p => fetchPage(fmt.i, p)));
    for (const html of htmls) {
      for (const m of html.matchAll(ROW_PAT)) {
        const [, dateRaw, drawNumRaw, numbersRaw, drawTypeRaw, multRaw] = m;
        const date = parseDate(dateRaw.trim());
        const draw_number = parseInt(drawNumRaw, 10);
        const numbers = parseNumbers(numbersRaw.trim());
        const draw_type = drawTypeRaw?.trim() || null;
        const multi_x = extractMultiplier(multRaw?.trim() || undefined);

        if (!validateNumbers(gameSlug, numbers)) continue;
        const key = `${date}-${draw_number}-${draw_type || ""}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);

        rows.push({ date, draw_number, numbers, draw_type, multi_x });
      }
    }
    console.log(`  [batch] pages ${batch[0]}-${batch[batch.length-1]}, total rows: ${rows.length}`);
  }

  return { rows, lastPage };
}

serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
    }

    const url = new URL(req.url);
    const projectRef = url.hostname.split(".")[0];
    const supabase = createClient(
      `https://${projectRef}.supabase.co`,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const body = await req.json().catch(() => ({}));
    const onlyGame: string | null = body.game || null;
    const pageStart = body.pageStart !== undefined ? parseInt(body.pageStart) : 0;
    const pageEnd = body.pageEnd !== undefined ? parseInt(body.pageEnd) : null;

    const gamesToScrape = onlyGame ? [onlyGame] : Object.keys(GAMES);
    const results: Record<string, any> = {};

    for (const gameSlug of gamesToScrape) {
      console.log(`\n=== Game: ${gameSlug} ===`);
      try {
        const { rows } = await scrapeGame(gameSlug, pageStart, pageEnd);
        if (rows.length === 0) {
          results[gameSlug] = { scraped: 0, valid: 0, skipped: 0, inserted: 0 };
          continue;
        }

        const rowsToInsert = rows.map((r) => ({
          game: gameSlug,
          draw_number: r.draw_number,
          draw_date: r.date,
          draw_type: r.draw_type || "Evening",
          numbers: r.numbers,
          mega_ball: null,
          zodiac_sign: null,
          multi_x: r.multi_x,
          source: "lottoaruba_full_v5",
        }));

        const BATCH = 100;
        let inserted = 0;
        let dbError: string | null = null;
        for (let i = 0; i < rowsToInsert.length; i += BATCH) {
          const batch = rowsToInsert.slice(i, i + BATCH);
          const { data, error } = await supabase
            .from("lottery_draws")
            .upsert(batch, { onConflict: "game,draw_number,draw_type" });
          if (error) {
            console.error(`  [db error] ${error.message}`);
            if (!dbError) dbError = error.message;
          } else {
            inserted += data?.length ?? batch.length;
          }
        }

        results[gameSlug] = { scraped: rows.length, valid: rows.length, skipped: 0, inserted, upsertError: dbError };
        console.log(`  [done] ${gameSlug}: ${rows.length} scraped, ${inserted} upserted`);
      } catch (e) {
        console.error(`[ERROR] ${gameSlug}: ${(e as Error).message}`);
        results[gameSlug] = { error: (e as Error).message };
      }
    }

    return new Response(JSON.stringify({ success: true, results }, null, 2), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    console.error("[ERROR]", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
