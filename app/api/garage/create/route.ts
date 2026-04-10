import { auth } from '@clerk/nextjs/server';
import { supabase } from '../../../../lib/supabase';

export async function POST(req: Request): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Non authentifié' }, { status: 401 });
  }

  // Prevent duplicate garages for the same Clerk user
  const { data: existing } = await supabase
    .from('garages')
    .select('id')
    .eq('clerk_user_id', userId)
    .single();

  if (existing) {
    return Response.json({ garageId: (existing as Record<string, unknown>).id });
  }

  const body = await req.json() as Record<string, unknown>;
  const { name, address, phone, siret } = body;

  if (!name) {
    return Response.json({ error: 'Le nom du garage est requis' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('garages')
    .insert({
      name,
      address: address ?? null,
      phone: phone ?? null,
      siret: siret ?? null,
      clerk_user_id: userId,
    })
    .select('id')
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ garageId: (data as Record<string, unknown>).id });
}
