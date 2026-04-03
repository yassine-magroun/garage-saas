import { supabase } from './supabase';

export type Garage = {
  id: string;
  name: string;
};

export type GarageContext = {
  garageId: string;
};

export const getGarageId = async (): Promise<string> => {
  // Dev/demo mode: bypass auth + users table lookup entirely
  const envGarageId = process.env.NEXT_PUBLIC_GARAGE_ID;
  if (envGarageId) return envGarageId;

  // Production: resolve from Supabase Auth session -> users table
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throw sessionError;

  const userId = session?.user?.id;
  if (!userId) throw new Error('Utilisateur non authentifié');

  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('garage_id')
    .eq('id', userId)
    .single();

  if (userError) throw userError;
  if (!userRow?.garage_id) {
    throw new Error('Garage non défini pour cet utilisateur');
  }

  return userRow.garage_id;
};

export const getGarageContext = async (): Promise<GarageContext> => {
  const garageId = await getGarageId();
  return { garageId };
};