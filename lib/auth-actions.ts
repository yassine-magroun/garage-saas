'use server';

import { createClient } from '@supabase/supabase-js';

/**
 * Server-side auth actions (bypass RLS constraints for signup)
 * These run on the server with ability to use service role keys if needed
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration for server actions');
}

const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

export async function createGarageForNewUser(
  userId: string,
  garageName: string
): Promise<{ id: string; name: string }> {
  console.log('[AuthActions] Creating garage for user:', userId, garageName);

  try {
    // Try to find existing garage first
    const { data: existing } = await supabaseServer
      .from('garages')
      .select('id, name')
      .eq('name', garageName)
      .single();

    if (existing) {
      console.log('[AuthActions] Found existing garage:', existing.id);
      // Now create or update user row
      const { error: userError } = await supabaseServer
        .from('users')
        .upsert({ id: userId, garage_id: existing.id, role: 'owner' }, { onConflict: 'id' });

      if (userError) {
        console.error('[AuthActions] Error creating user row:', userError);
        throw userError;
      }

      return { id: existing.id, name: existing.name };
    }

    // Create new garage
    const { data: newGarage, error: garageError } = await supabaseServer
      .from('garages')
      .insert({ name: garageName })
      .select('id, name')
      .single();

    if (garageError) {
      console.error('[AuthActions] Error creating garage:', garageError);
      throw garageError;
    }

    // Create user row
    const { error: userError } = await supabaseServer
      .from('users')
      .upsert({ id: userId, garage_id: newGarage.id, role: 'owner' }, { onConflict: 'id' });

    if (userError) {
      console.error('[AuthActions] Error creating user row:', userError);
      throw userError;
    }

    console.log('[AuthActions] Garage and user created successfully');
    return { id: newGarage.id, name: newGarage.name };
  } catch (err) {
    console.error('[AuthActions] createGarageForNewUser failed:', err);
    throw err;
  }
}
