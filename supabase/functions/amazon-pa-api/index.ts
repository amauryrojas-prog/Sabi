// Amazon USA catalog cache (PA-API 5) — pattern: mirror of china-catalog-cache.
// Fetches 50 products per category, sorted by AvgRating desc, with Amazon's
// Choice + Prime filters. Refreshes every 6h via pg_cron.
//
// Action 'fetch' is public (anon JWT). Actions 'refresh' and 'refresh-all'
// require either the SABI service-role key or the SABI cron secret header.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { AwsClient } from "https://esm.sh/aws4fetch@3.0.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SABI_SERVICE_ROLE = Deno.env.get("SABI_SERVICE_ROLE_KEY") ?? "";
const SABI_CRON_SECRET = Deno.env.get("SABI_CRON_SECRET") ?? "";

// Amazon PA-API 5 — read from secrets only, never expose in responses.
const AMAZON_ACCESS_KEY = Deno.env.get("AMAZON_PA_ACCESS_KEY") ?? "";
const AMAZON_SECRET_KEY = Deno.env.get("AMAZON_PA_SECRET_KEY") ?? "";
const AMAZON_PARTNER_TAG = Deno.env.get("AMAZON_PA_PARTNER_TAG") ?? "";

const PAAPI_HOST = "webservices.amazon.com";
const PAAPI_REGION = "us-east-1";
const PAAPI_MARKETPLACE = "www.amazon.com";

// Category map (keyword seeds, not API category ids — PA-API 5 search uses
// free-text keywords, so we feed curated terms that rank Aruba-relevant
// products first).
const CATEGORY_IDS: string[] = [
  "electronics",
  "home_kitchen",
  "beauty",
  "baby",
  "sports_outdoors",
  "tools",
  "automotive",
  "toys",
  "computers",
  "fashion",
  "pet_supplies",
  "health",
];

const CATEGORY_SEEDS: Record<string, string> = {
  electronics: "chargers headphones smartwatch",
  home_kitchen: "air fryer organizer kitchen",
  beauty: "hair dryer skincare",
  baby: "car seat stroller monitor",
  sports_outdoors: "snorkel paddle board yoga",
  tools: "obd2 scanner drill",
  automotive: "car accessories interior",
  toys: "lego board games",
  computers: "laptop mouse keyboard",
  fashion: "backpack luggage wallet",
  pet_supplies: "dog bed pet toy",
  health: "vitamins thermometer",
};

const PAGE_SIZE = 50;
const CACHE_ENDPOINT_TAG = "amazon-usa-catalog";

function corsHeaders(origin: string | null): HeadersInit {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-cron-secret",
  };
}

function jsonResponse(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(origin),
  });
}

function isServiceRoleAuthorized(req: Request): boolean {
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  return !!SABI_SERVICE_ROLE && token === SABI_SERVICE_ROLE;
}

function isCronAuthorized(req: Request): boolean {
  const header = req.headers.get("x-cron-secret") || "";
  return !!SABI_CRON_SECRET && header === SABI_CRON_SECRET;
}

interface AmazonItem {
  asin: string;
  title: string;
  detailPageUrl: string;
  image: string | null;
  priceUsd: number | null;
  rating: number | null;
  reviewCount: number | null;
  isPrime: boolean;
  isAmazonChoice: boolean;
  shipsToAruba: boolean;
  commissionRate: number; // 0.04 default
  payload: Record<string, unknown>;
}

async function signFetch(
  method: string,
  path: string,
  body: string,
): Promise<Response> {
  const aws = new AwsClient({
    accessKeyId: AMAZON_ACCESS_KEY,
    secretAccessKey: AMAZON_SECRET_KEY,
    service: "ProductAdvertisingAPI",
    region: PAAPI_REGION,
  });
  const url = `https://${PAAPI_HOST}${path}`;
  return aws.fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body,
  });
}

async function fetchCategoryFromAmazon(
  categoryId: string,
): Promise<AmazonItem[]> {
  if (!AMAZON_ACCESS_KEY || !AMAZON_SECRET_KEY || !AMAZON_PARTNER_TAG) {
    throw new Error(
      "AMAZON_PA_ACCESS_KEY / AMAZON_PA_SECRET_KEY / AMAZON_PA_PARTNER_TAG not set",
    );
  }
  const keyword = CATEGORY_SEEDS[categoryId] ?? categoryId;
  const body = JSON.stringify({
    Keywords: keyword,
    Resources: [
      "ItemInfo.Title",
      "ItemInfo.ByLineInfo",
      "ItemInfo.ProductInfo",
      "Images.Primary.Large",
      "Images.Primary.Medium",
      "Offers.Listings.Price",
      "Offers.Listings.DeliveryInfo.IsPrimeEligible",
      "Offers.Listings.DeliveryInfo.IsFreeShippingEligible",
      "CustomerReviews.Count",
      "CustomerReviews.StarRating",
      "BrowseNodeInfo.BrowseNodes",
    ],
    PartnerTag: AMAZON_PARTNER_TAG,
    PartnerType: "Associates",
    Marketplace: PAAPI_MARKETPLACE,
    ItemCount: PAGE_SIZE,
    SortBy: "AvgRating",
  });

  const res = await signFetch("POST", "/paapi5/searchitems", body);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`PA-API ${res.status}: ${txt.slice(0, 300)}`);
  }
  const json = await res.json();
  const items: any[] = json?.SearchResult?.Items ?? [];
  return items.map((p: any): AmazonItem => {
    const asin: string = p.ASIN ?? "";
    const title: string = p.ItemInfo?.Title?.DisplayValue ?? "";
    const detail: string = p.DetailPageURL ?? "";
    const image: string | null =
      p.Images?.Primary?.Large?.URL ?? p.Images?.Primary?.Medium?.URL ?? null;
    const priceListing = p.Offers?.Listings?.[0]?.Price;
    const priceUsd: number | null = priceListing?.Amount
      ? Number(priceListing.Amount)
      : null;
    const rating: number | null = p.CustomerReviews?.StarRating?.Value
      ? Number(p.CustomerReviews.StarRating.Value)
      : null;
    const reviewCount: number | null = p.CustomerReviews?.Count
      ? Number(p.CustomerReviews.Count)
      : null;
    const isPrime: boolean =
      p.Offers?.Listings?.[0]?.DeliveryInfo?.IsPrimeEligible === true;
    const isAmazonChoice: boolean =
      JSON.stringify(p).includes("Amazon's Choice") ||
      p.BrowseNodeInfo?.BrowseNodes?.[0]?.IsAmazonChoice === true;
    // PA-API 5 does not return per-destination shipping eligibility; we
    // approximate: Prime + free shipping → likely ships internationally.
    const shipsToAruba: boolean = isPrime;
    return {
      asin,
      title,
      detailPageUrl: detail,
      image,
      priceUsd,
      rating,
      reviewCount,
      isPrime,
      isAmazonChoice,
      shipsToAruba,
      commissionRate: 0.04,
      payload: p,
    };
  });
}

function applySabiAffiliateTag(detailUrl: string, asin: string): string {
  // The PA-API response's DetailPageURL never carries our tag, so we always
  // rewrite to our canonical form.
  const tag = AMAZON_PARTNER_TAG;
  if (!tag) return detailUrl;
  if (asin) {
    return `https://www.amazon.com/dp/${asin}?tag=${tag}&linkCode=ogi&th=1`;
  }
  // fallback: append tag
  try {
    const u = new URL(detailUrl);
    u.searchParams.set("tag", tag);
    u.searchParams.set("linkCode", "ogi");
    return u.toString();
  } catch {
    return detailUrl;
  }
}

async function refreshCategory(
  admin: ReturnType<typeof createClient>,
  categoryId: string,
): Promise<{ ok: boolean; count: number }> {
  const items = await fetchCategoryFromAmazon(categoryId);

  // Sort: Amazon's Choice first, then by rating desc, then by review count desc.
  items.sort((a, b) => {
    if (a.isAmazonChoice !== b.isAmazonChoice) return a.isAmazonChoice ? -1 : 1;
    const ar = a.rating ?? 0;
    const br = b.rating ?? 0;
    if (ar !== br) return br - ar;
    return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
  });

  const rows = items
    .filter((it) => it.asin)
    .slice(0, PAGE_SIZE)
    .map((it, i) => ({
      category_id: categoryId,
      asin: it.asin,
      rank: i + 1,
      payload: {
        ...it,
        // bake the affiliate URL into the payload so the frontend never has
        // to construct it again
        affiliateUrl: applySabiAffiliateTag(it.detailPageUrl, it.asin),
        // mirror the China cache contract: a `productId` field for the UI
        productId: it.asin,
      },
      refreshed_at: new Date().toISOString(),
    }));

  if (rows.length === 0) {
    return { ok: true, count: 0 };
  }

  const { error: delErr } = await admin
    .from("amazon_usa_catalog")
    .delete()
    .eq("category_id", categoryId);
  if (delErr) throw delErr;

  const batchSize = 25;
  for (let i = 0; i < rows.length; i += batchSize) {
    const slice = rows.slice(i, i + batchSize);
    const { error: insErr } = await admin.from("amazon_usa_catalog").insert(slice);
    if (insErr) throw insErr;
  }
  return { ok: true, count: rows.length };
}

async function fetchCategory(
  admin: ReturnType<typeof createClient>,
  categoryId: string,
) {
  const { data, error } = await admin
    .from("amazon_usa_catalog")
    .select("asin, rank, payload, refreshed_at")
    .eq("category_id", categoryId)
    .order("rank", { ascending: true });
  if (error) throw error;
  if (!data || data.length === 0) return null;
  return {
    content: data.map((row: any) => ({
      ...row.payload,
      productId: row.asin,
      sabiRank: row.rank,
      cachedAt: row.refreshed_at,
    })),
  };
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
    return jsonResponse(
      { error: "service role or cron secret required" },
      403,
      origin,
    );
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
          results.push({ categoryId: id, ok: false, error: msg });
          if (msg.includes("429") || msg.includes("Too Many Requests")) {
            await new Promise((res) => setTimeout(res, 1500));
            try {
              const r2 = await refreshCategory(admin, id);
              const idx = results.findIndex((x: any) => x.categoryId === id);
              if (idx >= 0) results[idx] = { categoryId: id, ok: r2.ok, count: r2.count };
            } catch (_e2) {
              // give up
            }
          }
        }
        // PA-API 5 quota is 1 req/sec; respect it.
        await new Promise((res) => setTimeout(res, 1200));
      }
      return jsonResponse({ ok: true, results }, 200, origin);
    }

    if (action === "fetch") {
      const categoryId = String(body.categoryId || "all").trim();
      if (categoryId === "all" || categoryId === "") {
        const all: any[] = [];
        for (const id of CATEGORY_IDS) {
          const r = await fetchCategory(admin, id);
          if (r) all.push(...r.content);
        }
        return jsonResponse({ code: 200, data: { content: all } }, 200, origin);
      }
      let result = await fetchCategory(admin, categoryId);
      if (!result) {
        // Empty cache for this category → try a one-off refresh.
        if (AMAZON_ACCESS_KEY && AMAZON_SECRET_KEY) {
          await refreshCategory(admin, categoryId);
          result = await fetchCategory(admin, categoryId);
        }
      }
      if (!result) return jsonResponse({ code: 200, data: { content: [] } }, 200, origin);
      return jsonResponse({ code: 200, data: result }, 200, origin);
    }

    return jsonResponse({ error: `unknown action: ${action}` }, 400, origin);
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500, origin);
  }
}

Deno.serve(handle);
