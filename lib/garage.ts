export type Garage = {
  id: string;
  name: string;
};

export type GarageContext = {
  garageId: string;
};

// Module-level cache — valid for the lifetime of the browser session
let cachedGarageId: string | null = null;

export const getGarageId = async (): Promise<string> => {
  // Dev/demo mode: bypass auth entirely
  const envGarageId = process.env.NEXT_PUBLIC_GARAGE_ID;
  if (envGarageId) return envGarageId;

  if (cachedGarageId) return cachedGarageId;

  const res = await fetch('/api/garage/me');
  if (!res.ok) throw new Error('Utilisateur non authentifié');

  const json = await res.json() as { garageId: string | null };

  if (!json.garageId) {
    // No garage configured — redirect to onboarding
    if (typeof window !== 'undefined') {
      window.location.href = '/onboarding';
    }
    throw new Error('Garage non configuré');
  }

  cachedGarageId = json.garageId;
  return json.garageId;
};

export const getGarageContext = async (): Promise<GarageContext> => {
  const garageId = await getGarageId();
  return { garageId };
};

/** Call this after creating/switching a garage to force a fresh lookup. */
export const clearGarageCache = (): void => {
  cachedGarageId = null;
};
