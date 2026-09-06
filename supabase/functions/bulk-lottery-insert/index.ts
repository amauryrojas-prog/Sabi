// =============================================================================
// SABI — EF bulk-insert V3: schema real de lottery_draws
//床上睡觉
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" } });
  }
  try {
    const url = new URL(req.url);
    const projectRef = url.hostname.split(".")[0];
    const supabase = createClient(
      `https://${projectRef}.supabase.co`,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const body = await req.json();
    const { draws } = body;
    if (!Array.isArray(draws)) {
      return new Response(JSON.stringify({ error: "draws must be an array" }), {
        status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const BATCH = 200;
    let inserted = 0;
    let errors = 0;
    let firstError = null;

    for (let i = 0; i < draws.length; i += BATCH) {
      const batch = draws.slice(i, i + BATCH);
      // Schema real: game, draw_number, draw_date, draw_type, numbers (text[]), mega_ball
      const rowsToInsert = batch.map((d: any) => {
        // numbers format: "03-10-11-14-18" → array of strings
        const nums = (d.numbers || "").split('-').map((n: string) => n.trim());
        const row: any = {
          game: d.game,
          draw_number: d.draw_number,
          draw_date: d.draw_date,
          draw_type: d.draw_type || "Evening",
          numbers: nums,  // text[] in DB
        };
        if (d.mega_ball != null) row.mega_ball = d.mega_ball;
        return row;
      });

      // INSERT plain — ON CONFLICT DO UPDATE in SQL handles duplicates
      // Supabase JS .insert() no devuelve error para rows que matchean y se actualizan
      const { data, error, count } = await supabase
        .from("lottery_draws")
        .insert(rowsToInsert)
        .select('*', { count: 'exact' });

      if (error) {
        console.error(`[db error at ${i}]:`, JSON.stringify(error));
        errors += batch.length;
        if (!firstError) firstError = error;
      } else {
        inserted += count || rowsToInsert.length;
      }
    }

    const result = { inserted, errors, total: draws.length };
    if (firstError) result['first_error'] = firstError;
    return new Response(JSON.stringify(result, null, 2), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
});
