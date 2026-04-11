import { auth } from '@clerk/nextjs/server';
import { supabase } from '../../../../lib/supabase';

/**
 * DELETE /api/user/data
 * RGPD: delete the garage and all associated data for the authenticated user.
 * Cascade deletes clients, factures, devis, interventions, payments, etc.
 */
export async function DELETE(): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { data: garage, error: fetchError } = await supabase
    .from('garages')
    .select('id')
    .eq('clerk_user_id', userId)
    .single();

  if (fetchError || !garage) {
    return Response.json({ error: 'Garage introuvable' }, { status: 404 });
  }

  const garageId = (garage as Record<string, unknown>).id as string;

  const { error: deleteError } = await supabase
    .from('garages')
    .delete()
    .eq('id', garageId);

  if (deleteError) {
    return Response.json({ error: deleteError.message }, { status: 500 });
  }

  return Response.json({ success: true, message: 'Toutes vos données ont été supprimées.' });
}
