import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SABI_SERVICE_ROLE = Deno.env.get("SABI_SERVICE_ROLE_KEY") ?? "";
const CJ_API_KEY = Deno.env.get("CJ_API_KEY")!;

const CATEGORY_IDS = [
  "E9FDC79A-8365-4CA6-AC23-64D971F08B8B",
  "2837816E-2FEA-4455-845C-6F40C6D70D1E",
  "D9E66BF8-4E81-4CAB-A425-AEDEC5FBFBF2",
  "52FC6CA5-669B-4D0B-B1AC-415675931399",
  "2C7D4A0B-1AB2-41EC-8F9E-13DC31B1C902",
  "2FE8A083-5E7B-4179-896D-561EA116F730",
  "B8302697-CF47-4211-9BD0-DFE8995AEB30",
  "2415A90C-5D7B-4CC7-BA8C-C0949F9FF5D8",
  "2409110611570657700",
  "A50A92FA-BCB3-4716-9BD9-BEC629BEE735",
  "4B397425-26C1-4D0E-B6D2-96B0B03689DB",
  "6A5D2EB4-13BD-462E-A627-78CFED11B2A2",
  "A2F799BE-FB59-428E-A953-296AA2673FCF",
  "1126E280-CB7D-418A-90AB-7118E2D97CCC",
];

const TOKEN_TTL_MS = 23 * 60 * 60 * 1000;
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getCjAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }
  const res = await fetch(
    "https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: CJ_API_KEY }),
    },
  );
  const data = await res.json();
  const token = data?.data?.accessToken ?? data?.data ?? "";
  if (!token) throw new Error("CJ did not return accessToken");
  cachedToken = {
    value: token,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  };
  return token;
}

async function fetchCategoryFromCj(categoryId: string) {
  const token = await getCjAccessToken();
  const url = new URL("https://developers.cjdropshipping.com/api2.0/v1/product/listV2");
  url.searchParams.set("categoryId", categoryId);
  url.searchParams.set("page", "1");
  url.searchParams.set("size", "50");
  url.searchParams.set("isCache", "no");
  const res = await fetch(url.toString(), {
    headers: { "CJ-Access-Token": token },
  });
  const json = await res.json();
  if (json.code !== 200) {
    throw new Error(`CJ listV2 failed (${json.code}): ${JSON.stringify(json)}`);
  }
  return json.data;
}

function rawProductsFrom(data: unknown): unknown[] {
  if (!data || typeof data !== "object") return [];
  const d = data as Record<string, any>;
  if (Array.isArray(d.content)) {
    const first = d.content[0];
    if (first && Array.isArray(first.productList)) return first.productList;
    return d.content;
  }
  if (Array.isArray(d.list)) return d.list;
  if (Array.isArray(d)) return d as unknown[];
  return [];
}

function pickPid(p: any): string | null {
  return p?.productId ?? p?.pid ?? p?.id ?? null;
}

function corsHeaders(origin: string | null): HeadersInit {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function jsonResponse(body: unknown, status = 200, origin?: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(origin ?? null),
  });
}

const CRON_SECRET = Deno.env.get("SABI_CRON_SECRET") ?? "";

function isServiceRoleAuthorized(req: Request): boolean {
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  return !!SABI_SERVICE_ROLE && token === SABI_SERVICE_ROLE;
}

function isCronAuthorized(req: Request): boolean {
  const cronHeader = req.headers.get("x-cron-secret") || "";
  return !!CRON_SECRET && cronHeader === CRON_SECRET;
}

async function refreshCategory(admin: ReturnType<typeof createClient>, categoryId: string) {
  const data = await fetchCategoryFromCj(categoryId);
  const products = rawProductsFrom(data);
  if (!products.length) {
    return { ok: false, count: 0, message: "no products returned" };
  }
  const rows = products
    .map((p: any, i: number) => {
      const pid = pickPid(p);
      if (!pid) return null;
      return {
        category_id: categoryId,
        pid,
        rank: i + 1,
        payload: p,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const { error: delErr } = await admin
    .from("china_catalog_cache")
    .delete()
    .eq("category_id", categoryId);
  if (delErr) throw delErr;

  // Insert in batches to avoid payload limits
  const batchSize = 25;
  for (let i = 0; i < rows.length; i += batchSize) {
    const slice = rows.slice(i, i + batchSize);
    const { error: insErr } = await admin.from("china_catalog_cache").insert(slice);
    if (insErr) throw insErr;
  }
  return { ok: true, count: rows.length };
}

async function fetchCategory(admin: ReturnType<typeof createClient>, categoryId: string) {
  const { data, error } = await admin
    .from("china_catalog_cache")
    .select("pid, rank, payload, refreshed_at")
    .eq("category_id", categoryId)
    .order("rank", { ascending: true });
  if (error) throw error;
  if (!data || data.length === 0) {
    return null;
  }
  const content = data.map((row: any) => ({
    ...row.payload,
    productId: row.pid,
    sabiRank: row.rank,
    cachedAt: row.refreshed_at,
  }));
  return { content };
}

async function handle(req: Request): Promise<Response> {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "POST required" }, 405, origin);
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid JSON" }, 400, origin);
  }
  const action = String(body.action || "");

  const service = isServiceRoleAuthorized(req) || isCronAuthorized(req);
  if ((action === "refresh" || action === "refresh-all") && !service) {
    return jsonResponse({ error: "service role or cron secret required" }, 403, origin);
  }

  const admin = createClient(SUPABASE_URL, SABI_SERVICE_ROLE);

  try {
    if (action === "refresh") {
      const categoryId = String(body.categoryId || "").trim();
      if (!categoryId) return jsonResponse({ error: "categoryId required" }, 400, origin);
      const result = await refreshCategory(admin, categoryId);
      return jsonResponse({ ok: result.ok, categoryId, count: result.count }, 200, origin);
    }

    if (action === "refresh-all") {
      const results: any[] = [];
      for (const id of CATEGORY_IDS) {
        try {
          const r = await refreshCategory(admin, id);
          results.push({ categoryId: id, ok: r.ok, count: r.count });
        } catch (e) {
          const msg = (e as Error).message;
          results.push({
            categoryId: id,
            ok: false,
            error: msg,
          });
          if (msg.includes("1600200")) {
            await new Promise((res) => setTimeout(res, 1500));
            try {
              cachedToken = null;
              const r2 = await refreshCategory(admin, id);
              const idx = results.findIndex((x: any) => x.categoryId === id);
              if (idx >= 0) results[idx] = { categoryId: id, ok: r2.ok, count: r2.count };
            } catch (e2) {
              // give up, already recorded as failed
            }
          }
        }
        // respect CJ QPS limit (1 req/sec): wait 1.2s between categories
        await new Promise((res) => setTimeout(res, 1200));
      }
      return jsonResponse({ ok: true, results }, 200, origin);
    }

    if (action === "fetch") {
      const categoryId = String(body.categoryId || "all").trim();
      if (categoryId === "all" || categoryId === "") {
        const all: any[] = [];
        let total = 0;
        for (const id of CATEGORY_IDS) {
          const r = await fetchCategory(admin, id);
          if (!r) {
            const r2 = await refreshCategory(admin, id);
            if (r2.ok) {
              const r3 = await fetchCategory(admin, id);
              if (r3) all.push(...r3.content);
              total += r2.count;
            }
          } else {
            all.push(...r.content);
            total += r.content.length;
          }
        }
        return jsonResponse({ code: 200, data: { content: all }, total }, 200, origin);
      }
      let result = await fetchCategory(admin, categoryId);
      if (!result) {
        await refreshCategory(admin, categoryId);
        result = await fetchCategory(admin, categoryId);
      }
      if (!result) {
        return jsonResponse({ code: 200, data: { content: [] } }, 200, origin);
      }
      return jsonResponse({ code: 200, data: result }, 200, origin);
    }

    return jsonResponse({ error: `unknown action: ${action}` }, 400, origin);
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500, origin);
  }
}

Deno.serve(handle);
