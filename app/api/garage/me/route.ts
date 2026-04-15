import { auth } from '@clerk/nextjs/server';
import { getGarageByClerkUserId } from '../../../../lib/api';
import { supabase } from '../../../../lib/supabase';

export async function GET(): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ garageId: null }, { status: 401 });
  }

  const garage = await getGarageByClerkUserId(userId);
  return Response.json({ garageId: garage?.id ?? null });
}

export async function PATCH(req: Request): Promise<Response> {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const garage = await getGarageByClerkUserId(userId);
  if (!garage) return Response.json({ error: 'Garage introuvable' }, { status: 404 });

  const body = (await req.json()) as { comptable_email?: string };
  const { comptable_email } = body;

  if (comptable_email !== undefined) {
    const { error } = await supabase
      .from('garages')
      .update({ comptable_email: comptable_email || null })
      .eq('id', garage.id);

    if (error) return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
