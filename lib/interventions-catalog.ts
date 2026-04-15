export const INTERVENTIONS_CATALOG = [
  // ENTRETIEN COURANT
  { id: 'vidange',          label: 'Vidange huile moteur',                  categorie: 'Entretien',      prix_defaut: 35  },
  { id: 'filtre_huile',     label: 'Remplacement filtre à huile',           categorie: 'Entretien',      prix_defaut: 15  },
  { id: 'filtre_air',       label: 'Remplacement filtre à air',             categorie: 'Entretien',      prix_defaut: 20  },
  { id: 'bougies',          label: 'Remplacement bougie(s)',                categorie: 'Entretien',      prix_defaut: 25  },
  { id: 'revision_complete',label: 'Révision complète',                     categorie: 'Entretien',      prix_defaut: 120 },
  { id: 'nettoyage_carbu',  label: 'Nettoyage carburateur',                 categorie: 'Entretien',      prix_defaut: 60  },
  { id: 'reglage_soupapes', label: 'Réglage soupapes',                      categorie: 'Entretien',      prix_defaut: 80  },

  // PNEUMATIQUES
  { id: 'pneu_avant',       label: 'Remplacement pneu avant',               categorie: 'Pneumatiques',   prix_defaut: 45  },
  { id: 'pneu_arriere',     label: 'Remplacement pneu arrière',             categorie: 'Pneumatiques',   prix_defaut: 45  },
  { id: 'pneus_2',          label: 'Remplacement 2 pneus',                  categorie: 'Pneumatiques',   prix_defaut: 85  },
  { id: 'equilibrage',      label: 'Équilibrage roue',                      categorie: 'Pneumatiques',   prix_defaut: 20  },
  { id: 'pression',         label: 'Vérification/gonflage pneus',           categorie: 'Pneumatiques',   prix_defaut: 5   },

  // FREINAGE
  { id: 'plaquettes_av',    label: 'Remplacement plaquettes avant',         categorie: 'Freinage',       prix_defaut: 40  },
  { id: 'plaquettes_ar',    label: 'Remplacement plaquettes arrière',       categorie: 'Freinage',       prix_defaut: 35  },
  { id: 'disque_av',        label: 'Remplacement disque avant',             categorie: 'Freinage',       prix_defaut: 80  },
  { id: 'disque_ar',        label: 'Remplacement disque arrière',           categorie: 'Freinage',       prix_defaut: 75  },
  { id: 'liquide_frein',    label: 'Purge/remplacement liquide de frein',   categorie: 'Freinage',       prix_defaut: 30  },
  { id: 'machoires',        label: 'Remplacement mâchoires frein tambour',  categorie: 'Freinage',       prix_defaut: 45  },

  // TRANSMISSION
  { id: 'chaine_kit',       label: 'Kit chaîne (chaîne + pignons)',         categorie: 'Transmission',   prix_defaut: 120 },
  { id: 'chaine',           label: 'Remplacement chaîne seule',             categorie: 'Transmission',   prix_defaut: 50  },
  { id: 'courroie',         label: 'Remplacement courroie transmission',    categorie: 'Transmission',   prix_defaut: 90  },
  { id: 'variateur',        label: 'Révision variateur',                    categorie: 'Transmission',   prix_defaut: 110 },
  { id: 'galets',           label: 'Remplacement galets variateur',         categorie: 'Transmission',   prix_defaut: 40  },
  { id: 'embrayage',        label: 'Révision embrayage',                    categorie: 'Transmission',   prix_defaut: 150 },

  // ÉLECTRICITÉ
  { id: 'batterie',         label: 'Remplacement batterie',                 categorie: 'Électricité',    prix_defaut: 55  },
  { id: 'alternateur',      label: 'Vérification/réparation alternateur',   categorie: 'Électricité',    prix_defaut: 80  },
  { id: 'demarreur',        label: 'Réparation démarreur électrique',       categorie: 'Électricité',    prix_defaut: 70  },
  { id: 'feux',             label: 'Remplacement ampoule(s)/feux LED',      categorie: 'Électricité',    prix_defaut: 20  },
  { id: 'faisceau',         label: 'Réparation faisceau électrique',        categorie: 'Électricité',    prix_defaut: 90  },
  { id: 'cdi',              label: 'Remplacement CDI/calculateur',          categorie: 'Électricité',    prix_defaut: 120 },

  // MOTEUR
  { id: 'segment_piston',   label: 'Remplacement segment/piston',           categorie: 'Moteur',         prix_defaut: 200 },
  { id: 'joint_culasse',    label: 'Remplacement joint de culasse',         categorie: 'Moteur',         prix_defaut: 180 },
  { id: 'joints_spi',       label: 'Remplacement joints spy fourche',       categorie: 'Moteur',         prix_defaut: 100 },
  { id: 'radiateur',        label: 'Réparation/remplacement radiateur',     categorie: 'Moteur',         prix_defaut: 150 },
  { id: 'thermostat',       label: 'Remplacement thermostat',               categorie: 'Moteur',         prix_defaut: 60  },

  // CARROSSERIE
  { id: 'pare_choc',        label: 'Remplacement pare-choc/carénage',       categorie: 'Carrosserie',    prix_defaut: 80  },
  { id: 'retroviseurs',     label: 'Remplacement rétroviseurs',             categorie: 'Carrosserie',    prix_defaut: 30  },
  { id: 'guidon',           label: 'Remplacement guidon/poignées',          categorie: 'Carrosserie',    prix_defaut: 45  },
  { id: 'selle',            label: 'Réparation/remplacement selle',         categorie: 'Carrosserie',    prix_defaut: 60  },
  { id: 'repose_pieds',     label: 'Remplacement repose-pieds',             categorie: 'Carrosserie',    prix_defaut: 25  },

  // DIAGNOSTIC / ADMIN
  { id: 'diagnostic',       label: 'Diagnostic électronique',               categorie: 'Diagnostic',     prix_defaut: 50  },
  { id: 'ct_preparation',   label: 'Préparation contrôle technique',        categorie: 'Diagnostic',     prix_defaut: 40  },
  { id: 'devis',            label: 'Établissement devis',                   categorie: 'Diagnostic',     prix_defaut: 0   },
  { id: 'autre',            label: 'Autre intervention (saisie libre)',      categorie: 'Autre',          prix_defaut: 0   },
] as const;

export type InterventionCatalogItem = (typeof INTERVENTIONS_CATALOG)[number];
export const CATEGORIES = [...new Set(INTERVENTIONS_CATALOG.map((i) => i.categorie))] as string[];
