import { auth } from '@clerk/nextjs/server';
import { supabase } from '../../../lib/supabase';
import { getGarageByClerkUserId } from '../../../lib/api';
import type { LivreDePolice } from '../../../lib/types';

function mapRow(r: Record<string, unknown>): LivreDePolice {
  return {
    id: String(r.id),
    garageId: String(r.garage_id),
    numeroOrdre: Number(r.numero_ordre),
    marque: String(r.marque),
    modele: String(r.modele),
    immatriculation: String(r.immatriculation),
    vin: r.vin != null ? String(r.vin) : null,
    annee: r.annee != null ? Number(r.annee) : null,
    couleur: r.couleur != null ? String(r.couleur) : null,
    kilometrageAchat: r.kilometrage_achat != null ? Number(r.kilometrage_achat) : null,
    dateAchat: String(r.date_achat),
    prixAchat: Number(r.prix_achat),
    vendeurNom: r.vendeur_nom != null ? String(r.vendeur_nom) : null,
    vendeurIdentite: r.vendeur_identite != null ? String(r.vendeur_identite) : null,
    vendeurAdresse: r.vendeur_adresse != null ? String(r.vendeur_adresse) : null,
    modeReglementAchat: String(r.mode_reglement_achat ?? 'Espèces'),
    coutReparations: Number(r.cout_reparations ?? 0),
    notesReparations: r.notes_reparations != null ? String(r.notes_reparations) : null,
    dateVente: r.date_vente != null ? String(r.date_vente) : null,
    prixVente: r.prix_vente != null ? Number(r.prix_vente) : null,
    acheteurNom: r.acheteur_nom != null ? String(r.acheteur_nom) : null,
    acheteurIdentite: r.acheteur_identite != null ? String(r.acheteur_identite) : null,
    acheteurAdresse: r.acheteur_adresse != null ? String(r.acheteur_adresse) : null,
    modeReglementVente: r.mode_reglement_vente != null ? String(r.mode_reglement_vente) : null,
    photos: Array.isArray(r.photos) ? (r.photos as string[]) : [],
    statut: (r.statut as LivreDePolice['statut']) ?? 'en_stock',
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

async function resolveGarageId(userId: string): Promise<string | null> {
  const garage = await getGarageByClerkUserId(userId);
  return garage?.id ?? null;
}

export async function GET(): Promise<Response> {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const garageId = await resolveGarageId(userId);
  if (!garageId) return Response.json({ error: 'Garage introuvable' }, { status: 404 });

  const { data, error } = await supabase
    .from('livre_de_police')
    .select('*')
    .eq('garage_id', garageId)
    .order('numero_ordre', { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json((data ?? []).map((r) => mapRow(r as Record<string, unknown>)));
}

export async function POST(req: Request): Promise<Response> {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const garageId = await resolveGarageId(userId);
  if (!garageId) return Response.json({ error: 'Garage introuvable' }, { status: 404 });

  const body = (await req.json()) as Record<string, unknown>;
  // Remove computed/generated fields before insert
  const { statut: _s, id: _id, garage_id: _gid, numero_ordre: _no, created_at: _ca, updated_at: _ua, ...payload } = body;
  void _s; void _id; void _gid; void _no; void _ca; void _ua;

  const { data, error } = await supabase
    .from('livre_de_police')
    .insert({ garage_id: garageId, ...payload })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(mapRow(data as Record<string, unknown>), { status: 201 });
}

export async function PUT(req: Request): Promise<Response> {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const garageId = await resolveGarageId(userId);
  if (!garageId) return Response.json({ error: 'Garage introuvable' }, { status: 404 });

  const body = (await req.json()) as Record<string, unknown>;
  const { id, statut: _s, garage_id: _gid, numero_ordre: _no, created_at: _ca, updated_at: _ua, ...payload } = body;
  void _s; void _gid; void _no; void _ca; void _ua;

  if (!id) return Response.json({ error: 'id requis' }, { status: 400 });

  const { data, error } = await supabase
    .from('livre_de_police')
    .update(payload)
    .eq('id', id)
    .eq('garage_id', garageId)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(mapRow(data as Record<string, unknown>));
}
