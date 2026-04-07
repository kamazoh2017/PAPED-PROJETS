/**
 * Calcule les prochaines dates d'occurrence pour une TacheOperationnelle.
 * Retourne toutes les dates dans la fenêtre [depuis, jusqu'au].
 */
export function calculerDatesOccurrences(
  periodicite: string,
  configRaw: string | null,
  dateDebut: Date,
  dateFin: Date | null,
  depuis: Date,
  jusqua: Date
): Date[] {
  const config: Record<string, unknown> = configRaw ? JSON.parse(configRaw) : {};
  const dates: Date[] = [];

  // Borne effective de départ : max(dateDebut, depuis)
  const borneDebut = dateDebut > depuis ? dateDebut : depuis;
  // Borne effective de fin
  const borneFin   = dateFin && dateFin < jusqua ? dateFin : jusqua;

  if (borneDebut > borneFin) return [];

  switch (periodicite) {
    case 'QUOTIDIENNE': {
      const cur = startOfDay(borneDebut);
      while (cur <= borneFin) {
        dates.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
      }
      break;
    }
    case 'HEBDOMADAIRE': {
      // jourDeLaSemaine : "LUNDI" | "MARDI" | ... | "DIMANCHE"
      const jourCible = jourSemaineCible(String(config.jourDeLaSemaine ?? 'LUNDI'));
      const cur = prochaineOccurrenceHebdo(borneDebut, jourCible);
      while (cur <= borneFin) {
        dates.push(new Date(cur));
        cur.setDate(cur.getDate() + 7);
      }
      break;
    }
    case 'MENSUELLE': {
      // jourDuMois : 1-28 (on cap à 28 pour éviter les soucis de mois courts)
      const jour = Math.min(Math.max(Number(config.jourDuMois ?? 1), 1), 28);
      const cur = prochaineOccurrenceMensuelle(borneDebut, jour);
      while (cur <= borneFin) {
        dates.push(new Date(cur));
        cur.setMonth(cur.getMonth() + 1);
      }
      break;
    }
    case 'TRIMESTRIELLE': {
      // debutTrimestre: true → 1er jan, 1er avr, 1er juil, 1er oct
      // sinon jourDuMois + moisDuTrimestre (1|2|3, défaut 1)
      const cur = prochaineOccurrenceTrimestrielle(borneDebut, config);
      while (cur <= borneFin) {
        dates.push(new Date(cur));
        cur.setMonth(cur.getMonth() + 3);
      }
      break;
    }
    case 'SEMESTRIELLE': {
      // 1er jan et 1er juil par défaut, ou mois (1|7) + jourDuMois
      const cur = prochaineOccurrenceSemestrielle(borneDebut, config);
      while (cur <= borneFin) {
        dates.push(new Date(cur));
        cur.setMonth(cur.getMonth() + 6);
      }
      break;
    }
    case 'ANNUELLE': {
      // mois (1-12) + jour (1-28)
      const mois = Math.min(Math.max(Number(config.mois ?? 1), 1), 12);
      const jour = Math.min(Math.max(Number(config.jour  ?? 1), 1), 28);
      const cur  = prochaineOccurrenceAnnuelle(borneDebut, mois, jour);
      while (cur <= borneFin) {
        dates.push(new Date(cur));
        cur.setFullYear(cur.getFullYear() + 1);
      }
      break;
    }
    case 'AD_HOC':
    default:
      // Pas de génération automatique
      break;
  }

  return dates;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

const JOURS_SEMAINE: Record<string, number> = {
  DIMANCHE: 0, LUNDI: 1, MARDI: 2, MERCREDI: 3, JEUDI: 4, VENDREDI: 5, SAMEDI: 6,
};

function jourSemaineCible(nom: string): number {
  return JOURS_SEMAINE[nom.toUpperCase()] ?? 1; // défaut LUNDI
}

function prochaineOccurrenceHebdo(depuis: Date, jourCible: number): Date {
  const d = startOfDay(depuis);
  const diff = (jourCible - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d;
}

function prochaineOccurrenceMensuelle(depuis: Date, jourDuMois: number): Date {
  const d = new Date(depuis.getFullYear(), depuis.getMonth(), jourDuMois);
  if (d < depuis) d.setMonth(d.getMonth() + 1);
  return d;
}

function prochaineOccurrenceTrimestrielle(depuis: Date, config: Record<string, unknown>): Date {
  const moisTrimestre = [0, 3, 6, 9]; // Jan, Avr, Juil, Oct
  const jourDuMois    = Math.min(Math.max(Number(config.jourDuMois ?? 1), 1), 28);
  const moisOffset    = Math.min(Math.max(Number(config.moisDuTrimestre ?? 1), 1), 3) - 1;

  // Trouver le prochain trimestre
  for (let y = depuis.getFullYear(); y <= depuis.getFullYear() + 1; y++) {
    for (const moisBase of moisTrimestre) {
      const d = new Date(y, moisBase + moisOffset, jourDuMois);
      if (d >= depuis) return d;
    }
  }
  return new Date(depuis);
}

function prochaineOccurrenceSemestrielle(depuis: Date, config: Record<string, unknown>): Date {
  const moisSemestre = [0, 6]; // Jan, Juil
  const jourDuMois   = Math.min(Math.max(Number(config.jourDuMois ?? 1), 1), 28);

  for (let y = depuis.getFullYear(); y <= depuis.getFullYear() + 1; y++) {
    for (const mois of moisSemestre) {
      const d = new Date(y, mois, jourDuMois);
      if (d >= depuis) return d;
    }
  }
  return new Date(depuis);
}

function prochaineOccurrenceAnnuelle(depuis: Date, mois: number, jour: number): Date {
  const d = new Date(depuis.getFullYear(), mois - 1, jour);
  if (d < depuis) d.setFullYear(d.getFullYear() + 1);
  return d;
}
