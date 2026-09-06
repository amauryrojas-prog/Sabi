// =============================================================================
// SABI — EF accounting-close: cierra un período contable y guarda el snapshot
// =============================================================================
// Body esperado (POST):
//   {
//     "report_type": "daily" | "weekly" | "monthly" | "annual",
//     "period_start": "2026-07-12T00:00:00.000Z",
//     "period_end":   "2026-07-13T00:00:00.000Z"
//   }
//   Opcional: "force": true para sobreescribir cierres duplicados del mismo período
// Headers:
//   Authorization: Bearer <SERVICE_ROLE_KEY> o admin JWT
//   X-Admin-Secret: <token_admin> (opcional, alternativa al JWT)
//
// Devuelve: 200 con el report insertado, 401/403 si no es admin, 400 si hay error.
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const SABI_ADMIN_EMAIL = "amaurymaduro@gmail.com";

serve(async (req) => {
  // === Auth gate ===
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  // 1) Si trae el header X-Admin-Secret, verificarlo contra supabase_admins
  const adminSecret = req.headers.get("X-Admin-Secret") ?? req.headers.get("x-admin-secret");
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  let isAuthorized = false;
  let adminEmail = SABI_ADMIN_EMAIL;

  if (adminSecret) {
    const { data: adminRow, error } = await supabaseAdmin
      .from("sabi_admins")
      .select("email")
      .eq("secret", adminSecret)
      .single();
    if (!error && adminRow) {
      isAuthorized = true;
      adminEmail = adminRow.email;
    }
  }

  // 2) Si no pasó por X-Admin-Secret, intentar Authorization Bearer con JWT
  if (!isAuthorized) {
    const auth = req.headers.get("Authorization") ?? req.headers.get("authorization") ?? "";
    if (auth.startsWith("Bearer ")) {
      const token = auth.substring(7);
      // Si es la service_role key de Supabase, bypaseamos
      if (token === supabaseServiceKey) {
        isAuthorized = true;
        adminEmail = "service_role";
      } else {
        // Validar JWT con supabase y consultar rol del perfil en base de datos
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (!authError && user) {
          const { data: profile, error: dbError } = await supabaseAdmin
            .from("profiles")
            .select("role, email")
            .eq("id", user.id)
            .single();
          
          if (!dbError && profile && profile.role === "admin") {
            isAuthorized = true;
            adminEmail = profile.email || user.email || "admin";
          }
        }
      }
    }
  }

  // Si no es admin, denegar
  if (!isAuthorized) {
    return new Response(
      JSON.stringify({ error: "Forbidden", message: "Solo administradores pueden ejecutar cierres contables" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // === Parse body ===
  let body: any = {};
  if (req.method === "POST") {
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const reportType = body.report_type;
  const periodStart = body.period_start;
  const periodEnd = body.period_end;
  const force = body.force === true;

  if (!["daily", "weekly", "monthly", "annual"].includes(reportType)) {
    return new Response(
      JSON.stringify({ error: "report_type inválido", allowed: ["daily", "weekly", "monthly", "annual"] }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (!periodStart || !periodEnd) {
    return new Response(
      JSON.stringify({ error: "period_start y period_end requeridos (ISO 8601)" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    return new Response(
      JSON.stringify({ error: "Fechas inválidas" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // === Recolectar datos de los 10 canales de ingreso ===
  // Se hace consultando tablas reales en Supabase. Si alguna tabla no existe
  // o no tiene datos, se devuelve 0 con un warning.
  const breakdown: Record<string, any> = {};
  const totals: Record<string, number> = {};
  let totalRevenueAWG = 0;
  let totalCommissionAWG = 0;
  let totalGMV = 0;

  function safeAdd(obj: any, key: string, val: any) {
    obj[key] = (obj[key] ?? 0) + val;
  }

  // --- 1. Marketplace (Marketplace local) ---
  try {
    // Buscar órdenes de marketplace en appState.marketplaceOrders
    // Asumimos que se persisten en supabase tabla 'marketplace_orders' (con fallback a localStorage)
    const { data: marketOrders, error: e1 } = await supabaseAdmin
      .from("marketplace_orders")
      .select("total_awg, sabi_fee_awg, created_at")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .eq("status", "completed");
    if (e1) throw e1;
    const orders = marketOrders ?? [];
    const salesAWG = orders.reduce((s, o) => s + Number(o.total_awg ?? 0), 0);
    const sabiFeeAWG = orders.reduce((s, o) => s + Number(o.sabi_fee_awg ?? 0), 0);
    breakdown.marketplace = {
      orders: orders.length,
      sales_awg: salesAWG,
      sabi_fee_awg: sabiFeeAWG,
      sabi_pct: 0.03,
    };
    safeAdd(totals, "marketplace_sales_awg", salesAWG);
    safeAdd(totals, "marketplace_fee_awg", sabiFeeAWG);
    totalGMV += salesAWG;
    totalCommissionAWG += sabiFeeAWG;
  } catch (e) {
    breakdown.marketplace = { orders: 0, error: String(e) };
  }

  // --- 2. Suscripciones Premium ---
  try {
    const { data: subs, error: e2 } = await supabaseAdmin
      .from("sabi_subscriptions")
      .select("amount_awg, plan, status, created_at")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString());
    if (e2) throw e2;
    const newSubs = subs ?? [];
    const newSubsAWG = newSubs.reduce((s, sub) => s + Number(sub.amount_awg ?? 0), 0);
    breakdown.subscriptions = {
      new_subs: newSubs.length,
      new_revenue_awg: newSubsAWG,
    };
    safeAdd(totals, "subscription_new_revenue_awg", newSubsAWG);
    totalRevenueAWG += newSubsAWG;
  } catch (e) {
    breakdown.subscriptions = { new_subs: 0, error: String(e) };
  }

  // --- 3. Delivery (Sabí Delivery) ---
  try {
    const { data: trips, error: e3 } = await supabaseAdmin
      .from("sabi_trips")
      .select("total_awg, sabi_fee_awg, status, completed_at")
      .gte("completed_at", start.toISOString())
      .lt("completed_at", end.toISOString())
      .eq("status", "completed");
    if (e3) throw e3;
    const completed = trips ?? [];
    const tripAWG = completed.reduce((s, t) => s + Number(t.total_awg ?? 0), 0);
    const tripFee = completed.reduce((s, t) => s + Number(t.sabi_fee_awg ?? 0), 0);
    breakdown.delivery = {
      trips: completed.length,
      total_awg: tripAWG,
      sabi_fee_awg: tripFee,
    };
    safeAdd(totals, "delivery_total_awg", tripAWG);
    safeAdd(totals, "delivery_fee_awg", tripFee);
    totalRevenueAWG += tripFee;
    totalCommissionAWG += tripFee;
  } catch (e) {
    breakdown.delivery = { trips: 0, error: String(e) };
  }

  // --- 4. China (CJ Dropshipping) ---
  try {
    const { data: china, error: e4 } = await supabaseAdmin
      .from("china_orders")
      .select("total_usd, sabi_fee_usd, created_at")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString());
    if (e4) throw e4;
    const orders = china ?? [];
    const usdTotal = orders.reduce((s, o) => s + Number(o.total_usd ?? 0), 0);
    const usdFee = orders.reduce((s, o) => s + Number(o.sabi_fee_usd ?? 0), 0);
    breakdown.china = {
      orders: orders.length,
      sales_usd: usdTotal,
      sabi_fee_usd: usdFee,
      awg_equiv: usdTotal * 1.80,
      fee_awg_equiv: usdFee * 1.80,
    };
    safeAdd(totals, "china_sales_awg", usdTotal * 1.80);
    safeAdd(totals, "china_fee_awg", usdFee * 1.80);
    totalGMV += usdTotal * 1.80;
    totalCommissionAWG += usdFee * 1.80;
  } catch (e) {
    breakdown.china = { orders: 0, error: String(e) };
  }

  // --- 5. Amazon USA (afiliados) ---
  try {
    const { data: amz, error: e5 } = await supabaseAdmin
      .from("amazon_orders")
      .select("commission_awg, created_at")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .eq("status", "confirmed");
    if (e5) throw e5;
    const orders = amz ?? [];
    const commission = orders.reduce((s, o) => s + Number(o.commission_awg ?? 0), 0);
    breakdown.amazon = {
      orders: orders.length,
      sabi_commission_awg: commission,
    };
    safeAdd(totals, "amazon_commission_awg", commission);
    totalCommissionAWG += commission;
  } catch (e) {
    breakdown.amazon = { orders: 0, error: String(e) };
  }

  // --- 6. Auto Import (4% upfront) ---
  try {
    const { data: auto, error: e6 } = await supabaseAdmin
      .from("auto_import_budgets")
      .select("fee_awg, created_at")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .eq("fee_paid", true);
    if (e6) throw e6;
    const paid = auto ?? [];
    const feeTotal = paid.reduce((s, a) => s + Number(a.fee_awg ?? 0), 0);
    breakdown.auto_import = {
      vehicles: paid.length,
      fee_upfront_awg: feeTotal,
    };
    safeAdd(totals, "auto_import_fee_awg", feeTotal);
    totalRevenueAWG += feeTotal;
    totalCommissionAWG += feeTotal;
  } catch (e) {
    breakdown.auto_import = { vehicles: 0, error: String(e) };
  }

  // --- 7. Lotería (Suerte) — ENGAGEMENT, NO REVENUE DIRECTO ---
  // IMPORTANTE: La lotería no genera ingresos para Sabí. Es contenido de
  // enganche que empuja a usuarios a las pestañas de marketplace, delivery,
  // importaciones, etc. Sus métricas (wagers, prize_paid) se reportan
  // en `breakdown.lottery` y en `informational.lottery` para el panel
  // de marketing/engagement, pero NUNCA se suman a gmv_awg,
  // total_revenue_awg ni total_commission_awg.
  try {
    const { data: lotto, error: e7 } = await supabaseAdmin
      .from("lottery_wagers")
      .select("amount_awg, prize_awg, created_at")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString());
    if (e7) throw e7;
    const wagers = lotto ?? [];
    const totalWagered = wagers.reduce((s, w) => s + Number(w.amount_awg ?? 0), 0);
    const totalPrizes = wagers.reduce((s, w) => s + Number(w.prize_awg ?? 0), 0);
    const net = totalWagered - totalPrizes;
    breakdown.lottery = {
      kind: "informational",
      wagers: wagers.length,
      wagered_awg: totalWagered,
      prizes_paid_awg: totalPrizes,
      net_awg: net,
      note: "Engagement metric, not revenue. Drives traffic to marketplace/delivery/imports.",
    };
    // NO se suma a totals (no es revenue).
  } catch (e) {
    breakdown.lottery = { kind: "informational", wagers: 0, error: String(e) };
  }

  // --- 8. Sabí Crédito ---
  try {
    const { data: loans, error: e8 } = await supabaseAdmin
      .from("sabi_credit_loans")
      .select("principal_awg, interest_awg, created_at, status")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .eq("status", "disbursed");
    if (e8) throw e8;
    const disbursed = loans ?? [];
    const principal = disbursed.reduce((s, l) => s + Number(l.principal_awg ?? 0), 0);
    const interest = disbursed.reduce((s, l) => s + Number(l.interest_awg ?? 0), 0);
    breakdown.credit = {
      loans: disbursed.length,
      disbursed_awg: principal,
      interest_collected_awg: interest,
    };
    safeAdd(totals, "credit_disbursed_awg", principal);
    safeAdd(totals, "credit_interest_awg", interest);
  } catch (e) {
    breakdown.credit = { loans: 0, error: String(e) };
  }

  // --- 9. Pagos manuales / transferencias ---
  try {
    const { data: payments, error: e9 } = await supabaseAdmin
      .from("sabi_payments")
      .select("amount_awg, kind, created_at")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .eq("kind", "manual_transfer");
    if (e9) throw e9;
    const tx = payments ?? [];
    const total = tx.reduce((s, t) => s + Number(t.amount_awg ?? 0), 0);
    breakdown.manual_payments = {
      transactions: tx.length,
      total_awg: total,
    };
    safeAdd(totals, "manual_payments_awg", total);
    totalRevenueAWG += total;
  } catch (e) {
    breakdown.manual_payments = { transactions: 0, error: String(e) };
  }

  // --- 10. Lottery realtime hits (no monetario) ---
  try {
    const { data: hits, error: e10 } = await supabaseAdmin
      .from("lottery_realtime_log")
      .select("id, ts")
      .gte("ts", start.toISOString())
      .lt("ts", end.toISOString());
    if (e10) throw e10;
    breakdown.realtime_hits = {
      events: (hits ?? []).length,
    };
  } catch (e) {
    breakdown.realtime_hits = { events: 0, error: String(e) };
  }

  // === Helpers de clasificación de canales ===
  // Canales monetarios (generan revenue real para Sabí)
  const MONETARY_CHANNELS = new Set([
    "marketplace", "subscriptions", "delivery", "china", "amazon",
    "auto_import", "credit", "manual_payments",
  ]);
  // Canales informational (engagement, no revenue directo)
  const INFORMATIONAL_CHANNELS = new Set([
    "lottery", "realtime_hits",
  ]);

  function countMonetaryChannelsWithData(breakdown: Record<string, any>): number {
    let n = 0;
    for (const k of Object.keys(breakdown)) {
      if (MONETARY_CHANNELS.has(k) && breakdown[k] && !breakdown[k].error) n++;
    }
    return n;
  }

  function countInformationalChannels(breakdown: Record<string, any>): number {
    let n = 0;
    for (const k of Object.keys(breakdown)) {
      if (INFORMATIONAL_CHANNELS.has(k) && breakdown[k] && !breakdown[k].error) n++;
    }
    return n;
  }

  // === Totales agregados ===
  const summaryTotals = {
    gmv_awg: totalGMV,
    total_revenue_awg: totalRevenueAWG,
    total_commission_awg: totalCommissionAWG,
    // 9 canales monetarios. Lottery y realtime_hits son "informational" y no cuentan aquí.
    // El panel de marketing/engagement los muestra aparte.
    channels_with_data: countMonetaryChannelsWithData(breakdown),
    channels_total: 9,
    informational_channels: countInformationalChannels(breakdown),
    informational_total: 2,  // lottery + realtime_hits
  };

  // === Resumen legible (es) ===
  const fmt = (n: number) => "Afl. " + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const summaryText = [
    `📊 Cierre ${reportType.toUpperCase()} — ${start.toISOString().slice(0, 10)} → ${end.toISOString().slice(0, 10)}`,
    `GMV: ${fmt(summaryTotals.gmv_awg)} · Revenue Sabí: ${fmt(summaryTotals.total_revenue_awg)} · Comisiones: ${fmt(summaryTotals.total_commission_awg)}`,
    `Canales monetarios con datos: ${summaryTotals.channels_with_data}/${summaryTotals.channels_total}`,
    `Canales de engagement con datos: ${summaryTotals.informational_channels}/${summaryTotals.informational_total} (lottery + realtime_hits, no son revenue)`,
  ].join("\n");

  // === Insertar en Supabase ===
  const insertPayload = {
    report_type: reportType,
    period_start: start.toISOString(),
    period_end: end.toISOString(),
    status: "closed",
    totals: { ...totals, ...summaryTotals },
    breakdown,
    summary_text: summaryText,
    created_by: `accounting-close-ef:admin=${adminEmail}`,
  };

  // Si force, primero borramos cualquier cierre previo del mismo período
  if (force) {
    await supabaseAdmin
      .from("accounting_reports")
      .delete()
      .eq("report_type", reportType)
      .gte("period_start", start.toISOString())
      .lte("period_end", end.toISOString());
  }

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("accounting_reports")
    .insert(insertPayload)
    .select()
    .single();

  if (insertError) {
    return new Response(
      JSON.stringify({ error: "Insert failed", detail: insertError.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      admin: adminEmail,
      report_id: inserted?.id,
      report_type: reportType,
      period_start: start.toISOString(),
      period_end: end.toISOString(),
      totals: insertPayload.totals,
      summary_text: summaryText,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
