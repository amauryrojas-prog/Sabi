// ════════════════════════════════════════════════════════════════════
//  cj-proxy — Sabí proxy seguro para la API de CJ Dropshipping
//
//  Expone un único endpoint /functions/v1/cj-proxy que el frontend llama.
//  La CJ_API_KEY vive SOLO aquí (env var CJ_API_KEY), nunca se envía al
//  browser. El accessToken se cachea en memoria 23h para no quemar quota.
//
//  Body esperado:
//    { action: "listProducts",  params: { keyWord?: string, categoryId?: string, page?: number, size?: number } }
//    { action: "myProducts",    params: { page?: number, size?: number } }
//    { action: "getProduct",    params: { pid: string } }
//    { action: "freightCalculate", params: { vid: string, startCountryCode?: string, endCountryCode?: string, quantity?: number } }
//    { action: "createOrder",   params: { orderNumber: string, sku: string, vid: string, quantity: number,
//                                          shippingAddress: object, isSandbox?: number, payType?: number, orderFlow?: number } }
//
//  Auth: Authorization: Bearer <supabase_access_token> (opcional pero recomendado)
// ════════════════════════════════════════════════════════════════════

const CJ_API_KEY = Deno.env.get('CJ_API_KEY');
if (!CJ_API_KEY) {
  console.error('❌ CJ_API_KEY missing in Edge Function env vars');
}

const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';

// ─────────── CORS ───────────
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// ─────────── Token cache (in-memory, 23h) ───────────
let cachedToken: string | null = null;
let cachedTokenExpiry = 0;

async function getCJToken(): Promise<string | null> {
  if (!CJ_API_KEY) return null;
  if (cachedToken && Date.now() < cachedTokenExpiry) return cachedToken;

  try {
    const res = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: CJ_API_KEY }),
    });
    const json = await res.json();
    if (json?.code === 200 && json?.data?.accessToken) {
      cachedToken = json.data.accessToken;
      cachedTokenExpiry = Date.now() + 23 * 60 * 60 * 1000; // 23h
      return cachedToken;
    }
    console.error('CJ auth failed:', json);
    return null;
  } catch (e) {
    console.error('CJ auth exception:', e);
    return null;
  }
}

// ─────────── Proxy genérico ───────────
async function proxyCJ(method: 'GET' | 'POST', path: string, body?: any) {
  const token = await getCJToken();
  if (!token) {
    return { error: 'CJ_AUTH_FAILED', message: 'Could not authenticate with CJ Dropshipping' };
  }
  try {
    const res = await fetch(`${CJ_BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': token,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    return json;
  } catch (e) {
    console.error(`CJ proxy error ${method} ${path}:`, e);
    return { error: 'CJ_PROXY_FAILED', message: String(e) };
  }
}

// ─────────── Dispatcher ───────────
async function handle(action: string, params: any) {
  switch (action) {
    case 'listProducts': {
      const { keyWord, categoryId, page = 1, size = 15 } = params || {};
      const qs = new URLSearchParams({ page: String(page), size: String(size) });
      if (keyWord) qs.set('keyWord', keyWord);
      if (categoryId) qs.set('categoryId', categoryId);
      return await proxyCJ('GET', `/product/listV2?${qs.toString()}`);
    }
    case 'myProducts': {
      const { page = 1, size = 15 } = params || {};
      const qs = new URLSearchParams({ page: String(page), size: String(size) });
      return await proxyCJ('GET', `/product/myProduct/query?${qs.toString()}`);
    }
    case 'getProduct': {
      const { pid } = params || {};
      if (!pid) return { error: 'MISSING_PID' };
      return await proxyCJ('GET', `/product/query?pid=${encodeURIComponent(pid)}`);
    }
    case 'freightCalculate': {
      const { vid, startCountryCode = 'CN', endCountryCode = 'US', quantity = 1 } = params || {};
      if (!vid) return { error: 'MISSING_VID' };
      return await proxyCJ('POST', '/logistic/freightCalculate', {
        startCountryCode,
        endCountryCode,
        products: [{ quantity, vid }],
      });
    }
    case 'createOrder': {
      const required = ['orderNumber', 'sku', 'shippingAddress'];
      for (const k of required) {
        if (!params?.[k]) return { error: `MISSING_${k.toUpperCase()}` };
      }
      const {
        orderNumber, sku, vid = '', quantity = 1,
        shippingAddress, isSandbox = 1, payType = 3, orderFlow = 1,
      } = params;
      return await proxyCJ('POST', '/shopping/order/createOrderV2', {
        orderNumber,
        payType,
        orderFlow,
        isSandbox,
        shippingAddress,
        products: [{ sku, vid, quantity }],
      });
    }
    default:
      return { error: 'UNKNOWN_ACTION', action };
  }
}

// ─────────── HTTP entry point ───────────
Deno.serve(async (req: Request) => {
  // Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, params } = await req.json();
    if (!action) {
      return new Response(
        JSON.stringify({ error: 'MISSING_ACTION' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const result = await handle(action, params || {});
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('cj-proxy handler error:', e);
    return new Response(
      JSON.stringify({ error: 'BAD_REQUEST', message: String(e) }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});