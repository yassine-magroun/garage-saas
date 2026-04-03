import { supabase } from './supabase';
import { createGarageForNewUser } from './auth-actions';

export type AuthUser = {
  id: string;
  email?: string | null;
  role?: string | null;
  garage_id?: string | null;
};

export async function signUp(email: string, password: string, garageName: string) {
  console.log('[Auth] Starting signup for:', email);
  
  try {
    const redirectTo = typeof window !== 'undefined' ? window.location.origin + '/auth/login' : 'http://localhost:3000/auth/login';
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
      },
    });
    
    if (error) {
      console.error('[Auth] Signup error:', error);
      throw error;
    }

    console.log('[Auth] User created:', data.user?.id);

    if (data.user?.id) {
      try {
        await createGarageForNewUser(data.user.id, garageName);
      } catch (err) {
        console.error('[Auth] Could not complete user provisioning:', err);
        // Provisioning can be retried on login
      }
    }

    return data;
  } catch (err) {
    console.error('[Auth] Signup failed:', err);
    throw err;
  }
}

export async function signIn(email: string, password: string) {
  console.log('[Auth] Starting signin for:', email);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      console.error('[Auth] SignIn error:', error);
      throw error;
    }

    console.log('[Auth] User signed in:', data.user?.id);

    if (data.user) {
      try {
        const existing = await getUserRow(data.user.id);
        if (!existing) {
          console.log('[Auth] No user row found, attempting auto-provisioning');
          const defaultGarageName = email.split('@')[0] ? `${email.split('@')[0]}'s Garage` : 'Mon garage';
          try {
            await createGarageForNewUser(data.user.id, defaultGarageName);
            console.log('[Auth] Auto-provisioned user + garage');
          } catch (nestedErr) {
            console.error('[Auth] Auto-provisioning failed:', nestedErr);
          }
        } else {
          console.log('[Auth] User row exists');
        }
      } catch (err) {
        console.error('[Auth] Error checking user row:', err);
        // Don't block login if user row check fails
      }
    }

    return data;
  } catch (err) {
    console.error('[Auth] SignIn failed:', err);
    throw err;
  }
}

export async function upsertAuthUser(userId: string, garageId: string, role: string = 'mechanic') {
  const { data, error } = await supabase
    .from('users')
    .upsert({ id: userId, garage_id: garageId, role }, { onConflict: 'id' });

  if (error) throw error;
  return data;
}

export async function getUserRow(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function ensureUserGarage(garageId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Utilisateur non authentifié');

  const current = await getUserRow(user.id);
  if (!current) {
    await upsertAuthUser(user.id, garageId, 'owner');
  }

  return garageId;
}
