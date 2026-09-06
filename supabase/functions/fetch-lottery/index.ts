import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function parseDateString(str) {
  const months = {
    'january': 0, 'jan': 0, 'february': 1, 'feb': 1, 'march': 2, 'mar': 2,
    'april': 3, 'apr': 3, 'may': 4, 'june': 5, 'jun': 5, 'july': 6, 'jul': 6,
    'august': 7, 'aug': 7, 'september': 8, 'sep': 8, 'october': 9, 'oct': 9,
    'november': 10, 'nov': 10, 'december': 11, 'dec': 11
  };
  const match = str.match(/([a-zA-Z]+)\s+(\d+)(?:,\s*(\d{4}))?/);
  if (!match) return new Date().toISOString().split('T')[0];
  const monthKey = match[1].toLowerCase();
  const month = months[monthKey];
  if (month === undefined) return new Date().toISOString().split('T')[0];
  let year = new Date().getFullYear();
  if (match[3]) {
    year = parseInt(match[3], 10);
  }
  const dayStr = match[2].padStart(2, '0');
  const monthStr = (month + 1).toString().padStart(2, '0');
  return `${year}-${monthStr}-${dayStr}`;
}

function extractNumbers(html) {
  const liRegex = /<li(?:\s+class="[^"]*b_nr[^"]*")?>([^<]+)<\/li>/g;
  const numbers = [];
  let sign, megaBall;

  let match;
  while ((match = liRegex.exec(html)) !== null) {
    const text = match[1].trim();
    if (text === 'Sign:') {
      const signMatch = html.substring(match.index, match.index + 200).match(/Sign:<\/span>\s*<span class="rem_oth">([^<]+)</);
      if (signMatch) sign = signMatch[1];
      continue;
    }
    if (text === 'FP' || text.startsWith('X')) continue;
    const num = parseInt(text);
    if (!isNaN(num)) {
      if (match[0].includes('b_nr') && numbers.length >= 4) {
        megaBall = num;
      } else {
        numbers.push(num.toString());
      }
    }
  }

  if (numbers.length === 0) return null;
  return { numbers: numbers.join('-'), sign, megaBall };
}

function parseGameBlock(html, gameId) {
  const gameNameMap = {
    "1": "minimega", "2": "lotto5", "3": "lottodidia",
    "4": "big4", "5": "catochi", "6": "zodiac",
    "7": "landsloterie", "11": "1off", "12": "lucky3"
  };

  const gameName = gameNameMap[gameId];
  if (!gameName) return [];

  // Dividir por contenedor de juego para aislar el HTML de cada juego
  const blocks = html.split(/<div\s+class=["']jpot_res\s*["']>/i);
  // Excluir el primer bloque (cabecera) y usar un Regex con límite de palabra para coincidir con el gameId exacto
  const linkRegex = new RegExp(`results=${gameId}\\b`);
  const targetBlock = blocks.slice(1).find(block => linkRegex.test(block));
  if (!targetBlock) return [];

  const results = [];
  const drawInfoRegex = /<b>([^<]+)\s*\|\s*Draw\s*#\s*(\d+)<\/b>/g;

  let drawMatch;
  while ((drawMatch = drawInfoRegex.exec(targetBlock)) !== null) {
    const dateStr = drawMatch[1].trim();
    const drawNumber = parseInt(drawMatch[2]);
    const searchStart = drawMatch.index;
    const searchEnd = Math.min(searchStart + 800, targetBlock.length);
    const nearbyHtml = targetBlock.substring(searchStart, searchEnd);

    let drawType = 'Evening';
    if (nearbyHtml.includes('dt_midday')) drawType = 'Midday';
    else if (nearbyHtml.includes('dt_evening')) drawType = 'Evening';

    const numbers = extractNumbers(nearbyHtml);
    if (numbers) {
      results.push({
        game: gameName,
        draw_number: drawNumber,
        draw_date: parseDateString(dateStr),
        draw_type: drawType,
        numbers: numbers.numbers,
        zodiac_sign: numbers.sign || null,
        mega_ball: numbers.megaBall || null
      });
    }
  }

  return results;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const response = await fetch('https://www.lottoaruba.com/?results=all', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch lottoaruba.com', status: response.status }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const allResults = [];
    for (const gameId of ['1', '2', '3', '4', '5', '6', '7', '11', '12']) {
      const gameResults = parseGameBlock(html, gameId);
      allResults.push(...gameResults);
    }

    if (allResults.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No results parsed', html_length: html.length }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const result of allResults) {
      const { error } = await supabase
        .from('lottery_draws')
        .upsert(result, {
          onConflict: 'game,draw_number,draw_type',
          ignoreDuplicates: false
        });

      if (error) {
        errorCount++;
        if (errors.length < 3) errors.push(error.message);
      } else {
        successCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        fetched: allResults.length,
        success_count: successCount,
        error_count: errorCount,
        errors: errors.length > 0 ? errors : undefined,
        games: [...new Set(allResults.map(r => r.game))]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});