// =============================================================================
// SABI — EF accounting-daily: ejecuta el cierre daily llamando a accounting-close
// =============================================================================
// Schedule cron (configurar en pg_cron o Supabase Dashboard):
//   daily:   "0 0 * * *"   (00:00 cada día)
//   weekly:  "0 0 * * 0"   (00:00 cada domingo)
//   monthly: "0 0 1 * *"   (00:00 día 1 de cada mes)
//   annual:  "0 0 1 1"     (00:00 1 enero)
//
// Este wrapper calcula el período [start, end) y reenvía a accounting-close.
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const REPORT_TYPE = "daily";

function getPeriod(): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);

  if (REPORT_TYPE === "daily") {
    // Ayer completo: [00:00:00 ayer, 00:00:00 hoy)
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - 1);
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(0, 0, 0, 0);
    return { start, end };
  }

  if (REPORT_TYPE === "weekly") {
    // Semana pasada (lunes a domingo): desde lunes 00:00 al lunes siguiente 00:00
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - 7);
    const dow = start.getUTCDay();
    const daysFromMonday = (dow + 6) % 7;
    start.setUTCDate(start.getUTCDate() - daysFromMonday);
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(0, 0, 0, 0);
    return { start, end };
  }

  if (REPORT_TYPE === "monthly") {
    // Mes pasado: día 1 00:00 del mes pasado al día 1 00:00 de este mes
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0));
    end.setUTCDate(1);
    end.setUTCHours(0, 0, 0, 0);
    return { start, end };
  }

  if (REPORT_TYPE === "annual") {
    // Año pasado: 1 enero 00:00 al 1 enero 00:00 de este año
    const start = new Date(Date.UTC(now.getUTCFullYear() - 1, 0, 1, 0, 0, 0, 0));
    end.setUTCMonth(0, 1);
    end.setUTCHours(0, 0, 0, 0);
    return { start, end };
  }

  return { start: new Date(now.getTime() - 86400000), end: now };
}
serve(async (req) => {
  const cronSecret = req.headers.get("X-Cron-Secret") ?? "";
  const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization") ?? "";
  
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  
  let forwardAuth = "";
  const expectedCronSecret = Deno.env.get("SABI_CRON_SECRET") ?? "";
  
  if (cronSecret === expectedCronSecret && expectedCronSecret !== "") {
    forwardAuth = `Bearer ${serviceKey}`;
  } else if (authHeader.startsWith("Bearer ")) {
    forwardAuth = authHeader;
  } else {
    return new Response(JSON.stringify({ error: "Unauthorized", message: "Credenciales de cron o token de usuario no válidos" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { start, end } = getPeriod();

  const payload = {
    report_type: REPORT_TYPE,
    period_start: start.toISOString(),
    period_end: end.toISOString(),
    force: false,
  };

  const resp = await fetch(`${supabaseUrl}/functions/v1/accounting-close`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": forwardAuth,
    },
    body: JSON.stringify(payload),
  });

  const body = await resp.text();
  return new Response(body, {
    status: resp.status,
    headers: { "Content-Type": "application/json" },
  });
});
