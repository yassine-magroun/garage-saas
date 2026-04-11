import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { supabase } from '../../../../lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface PortalBody {
  garageId: string;
}

export async function POST(req: Request): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Non authentifié' }, { status: 401 });
  }

  let body: PortalBody;
  try {
    body = (await req.json()) as PortalBody;
  } catch {
    return Response.json({ error: 'Corps invalide' }, { status: 400 });
  }

  const { garageId } = body;
  if (!garageId) {
    return Response.json({ error: 'garageId requis' }, { status: 400 });
  }

  const { data: garageData, error: garageError } = await supabase
    .from('garages')
    .select('stripe_customer_id')
    .eq('id', garageId)
    .single();

  if (garageError || !garageData?.stripe_customer_id) {
    return Response.json({ error: 'Aucun abonnement Stripe actif' }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mecanigo.fr';

  const session = await stripe.billingPortal.sessions.create({
    customer: garageData.stripe_customer_id as string,
    return_url: `${appUrl}/`,
  });

  return Response.json({ url: session.url });
}
