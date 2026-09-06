// ==========================================================================
// SUPABASE EDGE FUNCTION: stripe-payments (rebuilt)
// ==========================================================================
// Crea sesiones de Stripe Checkout para pagos de Sabí.
//
// Body esperado:
//   {
//     "amount": 17.74,           // AWG por defecto, o USD si currency='usd'
//     "email": "user@example.com",
//     "success_url": "https://...",
//     "cancel_url": "https://...",
//     "currency": "awg" | "usd", // opcional, default 'awg'
//     "product_name": "...",     // opcional, default 'Sabí Order'
//     "description": "..."       // opcional
//   }
//
// Variables de entorno requeridas:
//   - STRIPE_SECRET_KEY
// ==========================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeSecretKey) {
  console.error('❌ [stripe-payments] STRIPE_SECRET_KEY no está configurada');
}

const stripe = new Stripe(stripeSecretKey || 'sk_test_placeholder', {
  // Sin apiVersion fijo: usa la default del SDK (más resistente a deprecaciones)
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  console.log(`📥 [stripe-payments] ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch((e) => {
      console.error('❌ [stripe-payments] Body no es JSON válido:', e);
      return {};
    });
    const {
      amount,
      email,
      success_url,
      successUrl,
      cancel_url,
      cancelUrl,
      currency = 'awg',
      product_name = 'Sabí Order',
      description,
      amount_awg,
      payment_type = 'wallet_recharge',
    } = body;

    const finalSuccessUrl = success_url || successUrl || `${req.headers.get('origin')}/?payment=success`;
    const finalCancelUrl = cancel_url || cancelUrl || `${req.headers.get('origin')}/?payment=cancel`;

    console.log(`📦 [stripe-payments] amount=${amount} currency=${currency} email=${email}`);

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Monto inválido', received: amount }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: 'STRIPE_SECRET_KEY no configurada en el servidor' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Auth verification: get user id from JWT
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';
    let userId: string | null = null;
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
      }
    }

    const amountInCents = Math.round(amount * 100);

    console.log(`🚀 [stripe-payments] Creando sesión Checkout para user_id=${userId}...`);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: product_name,
              description: description || `Pago de Afl. ${amount.toFixed(2)}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      customer_email: email || undefined,
      metadata: {
        amount_awg: amount_awg ? amount_awg.toString() : (amount * 1.80).toString(),
        currency,
        user_id: userId || '',
        payment_type,
      },
    });

    console.log(`✅ [stripe-payments] Sesión creada: ${session.id}, url=${session.url ? 'present' : 'missing'}`);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch (error) {
    console.error('💥 [stripe-payments] Error:', error);
    const errMsg = error instanceof Error ? error.message : String(error);
    const errType = (error as any)?.type || 'unknown';
    return new Response(
      JSON.stringify({
        error: errMsg,
        type: errType,
        code: (error as any)?.code,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});