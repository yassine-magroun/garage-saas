import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { supabase } from '../../../lib/supabase';
import { getGarageByClerkUserId } from '../../../lib/api';

const InterventionSchema = z.object({
  client_id: z.string().uuid(),
  vehicule: z.string().min(1),
  type: z.string().min(1),
  prix: z.number().nonnegative(),
  date: z.string(),
  statut: z.enum(['En attente', 'En cours', 'Prêt', 'Livré']).default('En attente'),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const garage = await getGarageByClerkUserId(userId);
  if (!garage) return NextResponse.json({ error: 'Garage introuvable' }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 });
  }

  const parsed = InterventionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { client_id, vehicule, type, prix, date, statut, notes } = parsed.data;

  const { data, error } = await supabase
    .from('interventions')
    .insert({
      garage_id: garage.id,
      client_id,
      vehicule,
      type,
      price: prix,
      date,
      status: statut,
      notes: notes ?? null,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
