import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Service-role client — bypasses RLS, safe only in server context
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Disable Next.js body parsing so we can read the raw buffer for signature verification
export const dynamic = 'force-dynamic';

function planFromPriceId(priceId: string): string | null {
  if (priceId === process.env.STRIPE_PRICE_STARTER) return 'starter';
  if (priceId === process.env.STRIPE_PRICE_PRO) return 'pro';
  if (priceId === process.env.STRIPE_PRICE_ENTERPRISE) return 'enterprise';
  return null;
}

export async function POST(req: Request): Promise<Response> {
  if (!stripe) {
    return Response.json({ error: 'Stripe non configuré' }, { status: 503 });
  }

  const sig = req.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET!;

  if (!sig) {
    return Response.json({ error: 'Signature manquante' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = Buffer.from(await req.arrayBuffer());
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur signature';
    return Response.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const garageId = sub.metadata?.garageId;
      if (!garageId) break;

      const firstItem = sub.items.data[0];
      const priceId = firstItem?.price.id ?? null;
      const plan = priceId ? planFromPriceId(priceId) : null;
      const periodEnd = firstItem?.current_period_end ?? null;
      const endDate = periodEnd ? new Date(periodEnd * 1000).toISOString() : null;

      await supabaseAdmin
        .from('garages')
        .update({
          subscription_status: sub.status,
          subscription_plan: plan,
          subscription_end: endDate,
        })
        .eq('id', garageId);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const garageId = sub.metadata?.garageId;
      if (!garageId) break;

      await supabaseAdmin
        .from('garages')
        .update({
          subscription_status: 'canceled',
          subscription_plan: null,
          subscription_end: null,
        })
        .eq('id', garageId);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
      if (!customerId) break;

      await supabaseAdmin
        .from('garages')
        .update({ subscription_status: 'past_due' })
        .eq('stripe_customer_id', customerId);
      break;
    }

    default:
      break;
  }

  return Response.json({ received: true });
}
