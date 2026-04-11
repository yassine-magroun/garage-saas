import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { supabase } from '../../../../lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface CheckoutBody {
  priceId: string;
  garageId: string;
}

interface GarageRow {
  id: string;
  stripe_customer_id: string | null;
  email: string | null;
  name: string;
}

export async function POST(req: Request): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Non authentifié' }, { status: 401 });
  }

  let body: CheckoutBody;
  try {
    body = (await req.json()) as CheckoutBody;
  } catch {
    return Response.json({ error: 'Corps invalide' }, { status: 400 });
  }

  const { priceId, garageId } = body;
  if (!priceId || !garageId) {
    return Response.json({ error: 'priceId et garageId requis' }, { status: 400 });
  }

  // Fetch garage
  const { data: garageData, error: garageError } = await supabase
    .from('garages')
    .select('id, stripe_customer_id, email, name')
    .eq('id', garageId)
    .single();

  if (garageError || !garageData) {
    return Response.json({ error: 'Garage introuvable' }, { status: 404 });
  }

  const garage = garageData as GarageRow;

  // Fetch or create Stripe customer
  let customerId = garage.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      name: garage.name,
      email: garage.email ?? undefined,
      metadata: { garageId, clerkUserId: userId },
    });
    customerId = customer.id;

    await supabase
      .from('garages')
      .update({ stripe_customer_id: customerId })
      .eq('id', garageId);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mecanigo.fr';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    locale: 'fr',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/?checkout=success`,
    cancel_url: `${appUrl}/landing?checkout=cancel`,
    subscription_data: {
      metadata: { garageId },
    },
  });

  return Response.json({ url: session.url });
}
