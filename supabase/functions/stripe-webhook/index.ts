import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

const stripe = new Stripe(stripeSecretKey, {
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const sig = req.headers.get('stripe-signature') || '';
    const body = await req.text();

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
    } catch (err) {
      console.error(`❌ [stripe-webhook] Error de firma: ${err.message}`);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.log(`📥 [stripe-webhook] Evento recibido: ${event.type} (${event.id})`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const userId = session.metadata?.user_id;
      const amountAwg = parseFloat(session.metadata?.amount_awg || '0');
      const paymentType = session.metadata?.payment_type || 'wallet_recharge';

      console.log(`💳 [stripe-webhook] Pago completado. User: ${userId}, Amount AWG: ${amountAwg}, Type: ${paymentType}`);

      if (!userId) {
        console.error('❌ [stripe-webhook] user_id no encontrado en la metadata de la sesión');
        return new Response('Falta user_id en metadata', { status: 400 });
      }

      // Idempotencia: Verificar si ya procesamos este evento
      const { data: already, error: checkError } = await supabaseAdmin
        .from('processed_stripe_events')
        .select('id')
        .eq('id', event.id)
        .maybeSingle();

      if (checkError) {
        console.error('❌ [stripe-webhook] Error al verificar duplicados:', checkError);
        return new Response('Database Error', { status: 500 });
      }

      if (already) {
        console.log(`⚠️ [stripe-webhook] Evento ${event.id} ya procesado previamente.`);
        return new Response(JSON.stringify({ received: true, duplicate: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Acreditar billetera si es del tipo correspondiente
      if (paymentType === 'wallet_recharge') {
        const { data: rpcRes, error: rpcError } = await supabaseAdmin.rpc('acreditar_wallet', {
          p_user_id: userId,
          p_amount: amountAwg
        });

        if (rpcError) {
          console.error('❌ [stripe-webhook] Error llamando a acreditar_wallet:', rpcError);
          return new Response('Error acreditando saldo', { status: 500 });
        }

        console.log(`✅ [stripe-webhook] Saldo de Afl. ${amountAwg} acreditado exitosamente para el usuario ${userId}`);
      } else {
        console.log(`ℹ [stripe-webhook] Ignorando acreditación directa para tipo de pago: ${paymentType}`);
      }

      // Registrar evento procesado
      const { error: insertError } = await supabaseAdmin
        .from('processed_stripe_events')
        .insert({ id: event.id });

      if (insertError) {
        console.error('❌ [stripe-webhook] Error registrando evento en processed_stripe_events:', insertError);
        // No fallamos la respuesta porque el saldo ya fue acreditado
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('💥 [stripe-webhook] Excepción general:', err);
    return new Response(`Server Error: ${err.message}`, { status: 500 });
  }
});
