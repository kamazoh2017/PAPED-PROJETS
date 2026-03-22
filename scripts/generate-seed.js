/**
 * Génère prisma/seed.js depuis db-export.json.
 * Le seed produit utilise des clés naturelles uniques (libelle, email, login)
 * pour les upserts — compatible SQLite local ET PostgreSQL Railway.
 * Usage : node scripts/generate-seed.js
 */

const fs   = require('fs');
const path = require('path');
const data = require('../db-export.json');

const outPath = path.join(__dirname, '..', 'prisma', 'seed.js');

// ── Build lookup maps from local data ─────────────────────────────────────────
const entiteById    = Object.fromEntries(data.entites.map(e => [e.id, e]));
const personneById  = Object.fromEntries(data.personnes.map(p => [p.id, p]));

// equipeProjet : projetLocalId -> [personneLocalId, ...]
const equipeMap = {};
data.projets.forEach(p => {
  equipeMap[p.id] = (p.equipeProjet || []).map(e => e.id);
});

function s(v)    { return v === null || v === undefined ? 'null' : JSON.stringify(v); }
function d(v)    { return v ? `new Date(${JSON.stringify(v)})` : 'null'; }
function n(v)    { return v === null || v === undefined ? '0' : v; }
function b(v)    { return v ? 'true' : 'false'; }

// ── Data arrays (inline in generated seed) ────────────────────────────────────

const entitesArr = data.entites.map(e => ({
  localId: e.id,
  libelle: e.libelle,
  tutelle: e.tutelle,
}));

const personnesArr = data.personnes.map(p => ({
  localId: p.id,
  localEntiteId: p.entiteId,
  nom: p.nom,
  prenoms: p.prenoms,
  telephone: p.telephone,
  email: p.email,
  fonction: p.fonction,
  estChefProjet: p.estChefProjet,
}));

// Compte: si login non null → where login, sinon → where personneId (via personneMap)
const comptesArr = data.comptes.map(c => ({
  localId: c.id,
  login: c.login,
  estSuperAdmin: c.estSuperAdmin,
  estActif: c.estActif,
  localPersonneId: c.personneId,
  permissions: (c.permissions || []).map(p => ({
    pageKey: p.pageKey,
    actionKey: p.actionKey,
    autorise: p.autorise,
  })),
}));

const projetsArr = data.projets.map(p => ({
  localId: p.id,
  libelle: p.libelle,
  description: p.description,
  statut: p.statut,
  etatAvancement: p.etatAvancement,
  localChefId: p.chefProjetId,
  dateDebutPrevisionnelle: p.dateDebutPrevisionnelle,
  dateFinPrevisionnelle: p.dateFinPrevisionnelle,
  dateDebutEffective: p.dateDebutEffective,
  dateFinEffective: p.dateFinEffective,
  tauxAvancementReel: p.tauxAvancementReel,
  tauxAvancementAttendu: p.tauxAvancementAttendu,
  tauxAchevementReel: p.tauxAchevementReel,
  tauxAchevementAttendu: p.tauxAchevementAttendu,
  localEquipeIds: equipeMap[p.id] || [],
}));

const tachesArr = data.taches.map(t => ({
  localId: t.id,
  localProjetId: t.projetId,
  libelle: t.libelle,
  description: t.description,
  priorite: t.priorite,
  localAssigneId: t.assigneAId,
  statut: t.statut,
  etatAvancement: t.etatAvancement,
  progression: t.progression,
  poidsPriorite: t.poidsPriorite,
  ordre: t.ordre,
  dateDebutPrevisionnelle: t.dateDebutPrevisionnelle,
  dateFinPrevisionnelle: t.dateFinPrevisionnelle,
  dateDebutEffective: t.dateDebutEffective,
  dateFinEffective: t.dateFinEffective,
}));

const risquesArr = data.risques.map(r => ({
  localProjetId: r.projetId,
  libelle: r.libelle,
  taux: r.taux,
  gravite: r.gravite,
  couleur: r.couleur,
}));

// ── Generate ──────────────────────────────────────────────────────────────────
const out = `/**
 * Seed complet — généré automatiquement depuis la base de données locale.
 * Utilise les clés naturelles uniques pour les upserts → idempotent sur
 * SQLite (dev) ET PostgreSQL (Railway preprod/prod).
 *
 * Données : ${data.entites.length} entité(s), ${data.personnes.length} personnes, ${data.comptes.length} comptes,
 *           ${data.projets.length} projets, ${data.taches.length} tâches, ${data.risques.length} risques, ${data.comptes.reduce((s,c) => s+(c.permissions||[]).length,0)} permissions.
 *
 * Mot de passe par défaut  : 0123456789
 * Super admin              : super@super / 0123456789  (doitChangerMdp=false)
 * Autres comptes           : login / 0123456789        (doitChangerMdp=true)
 */

const { PrismaClient } = require('@prisma/client');
const { randomBytes, scryptSync } = require('crypto');

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = '0123456789';

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return \`\${salt}:\${hash}\`;
}

// ── Données source (ids locaux utilisés pour les références croisées) ──────────

const ENTITES = ${JSON.stringify(entitesArr, null, 2)};

const PERSONNES = ${JSON.stringify(personnesArr, null, 2)};

const COMPTES = ${JSON.stringify(comptesArr, null, 2)};

const PROJETS = ${JSON.stringify(projetsArr, null, 2)};

const TACHES = ${JSON.stringify(tachesArr, null, 2)};

const RISQUES = ${JSON.stringify(risquesArr, null, 2)};

// ── Seed ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('[seed] Démarrage du seed complet...');

  // ── Entités ──────────────────────────────────────────────────────────────────
  const entiteMap = {}; // localId -> railwayId
  for (const e of ENTITES) {
    const r = await prisma.entite.upsert({
      where:  { libelle: e.libelle },
      update: { tutelle: e.tutelle },
      create: { libelle: e.libelle, tutelle: e.tutelle },
    });
    entiteMap[e.localId] = r.id;
  }
  console.log('[seed] Entités : OK (' + ENTITES.length + ')');

  // ── Personnes ressources ──────────────────────────────────────────────────────
  const personneMap = {}; // localId -> railwayId
  for (const p of PERSONNES) {
    const entiteId = entiteMap[p.localEntiteId];
    const r = await prisma.personneRessource.upsert({
      where:  { email: p.email },
      update: { nom: p.nom, prenoms: p.prenoms, telephone: p.telephone, fonction: p.fonction, entiteId, estChefProjet: p.estChefProjet },
      create: { nom: p.nom, prenoms: p.prenoms, telephone: p.telephone, email: p.email, fonction: p.fonction, entiteId, estChefProjet: p.estChefProjet },
    });
    personneMap[p.localId] = r.id;
  }
  console.log('[seed] Personnes : OK (' + PERSONNES.length + ')');

  // ── Comptes d'accès ───────────────────────────────────────────────────────────
  const compteMap = {}; // localId -> railwayId
  for (const c of COMPTES) {
    const personneId = c.localPersonneId ? personneMap[c.localPersonneId] : undefined;
    const doitChangerMdp = c.estSuperAdmin ? false : true;

    let whereClause;
    if (c.login) {
      whereClause = { login: c.login };
    } else {
      // Compte sans login : identifié par personneId
      whereClause = { personneId };
    }

    const r = await prisma.compteAcces.upsert({
      where:  whereClause,
      update: {
        estSuperAdmin: c.estSuperAdmin,
        estActif: c.estActif,
        doitChangerMdp,
        ...(personneId !== undefined ? { personneId } : {}),
      },
      create: {
        ...(c.login ? { login: c.login } : {}),
        estSuperAdmin: c.estSuperAdmin,
        estActif: c.estActif,
        doitChangerMdp,
        motDePasseHash: hashPassword(DEFAULT_PASSWORD),
        ...(personneId !== undefined ? { personneId } : {}),
      },
    });
    compteMap[c.localId] = r.id;
  }
  console.log('[seed] Comptes : OK (' + COMPTES.length + ')');

  // ── Permissions ───────────────────────────────────────────────────────────────
  for (const c of COMPTES) {
    if (!c.permissions || c.permissions.length === 0) continue;
    const railwayCompteId = compteMap[c.localId];
    await prisma.permissionPageAction.deleteMany({ where: { compteId: railwayCompteId } });
    await prisma.permissionPageAction.createMany({
      data: c.permissions.map(p => ({
        compteId: railwayCompteId,
        pageKey:  p.pageKey,
        actionKey: p.actionKey,
        autorise: p.autorise,
      })),
    });
  }
  console.log('[seed] Permissions : OK');

  // ── Projets ───────────────────────────────────────────────────────────────────
  const projetMap = {}; // localId -> railwayId
  for (const p of PROJETS) {
    const chefProjetId = personneMap[p.localChefId];
    const r = await prisma.projet.upsert({
      where:  { libelle: p.libelle },
      update: {
        description: p.description,
        statut: p.statut,
        etatAvancement: p.etatAvancement,
        chefProjetId,
        dateDebutPrevisionnelle: p.dateDebutPrevisionnelle ? new Date(p.dateDebutPrevisionnelle) : null,
        dateFinPrevisionnelle:   p.dateFinPrevisionnelle   ? new Date(p.dateFinPrevisionnelle)   : null,
        dateDebutEffective:      p.dateDebutEffective      ? new Date(p.dateDebutEffective)      : null,
        dateFinEffective:        p.dateFinEffective        ? new Date(p.dateFinEffective)        : null,
        tauxAvancementReel:    p.tauxAvancementReel,
        tauxAvancementAttendu: p.tauxAvancementAttendu,
        tauxAchevementReel:    p.tauxAchevementReel,
        tauxAchevementAttendu: p.tauxAchevementAttendu,
        equipeProjet: { set: p.localEquipeIds.map(lid => ({ id: personneMap[lid] })).filter(x => x.id) },
      },
      create: {
        libelle: p.libelle,
        description: p.description,
        statut: p.statut,
        etatAvancement: p.etatAvancement,
        chefProjetId,
        dateDebutPrevisionnelle: p.dateDebutPrevisionnelle ? new Date(p.dateDebutPrevisionnelle) : null,
        dateFinPrevisionnelle:   p.dateFinPrevisionnelle   ? new Date(p.dateFinPrevisionnelle)   : null,
        dateDebutEffective:      p.dateDebutEffective      ? new Date(p.dateDebutEffective)      : null,
        dateFinEffective:        p.dateFinEffective        ? new Date(p.dateFinEffective)        : null,
        tauxAvancementReel:    p.tauxAvancementReel,
        tauxAvancementAttendu: p.tauxAvancementAttendu,
        tauxAchevementReel:    p.tauxAchevementReel,
        tauxAchevementAttendu: p.tauxAchevementAttendu,
        equipeProjet: { connect: p.localEquipeIds.map(lid => ({ id: personneMap[lid] })).filter(x => x.id) },
      },
    });
    projetMap[p.localId] = r.id;
  }
  console.log('[seed] Projets : OK (' + PROJETS.length + ')');

  // ── Tâches — upsert par projetId + libelle ────────────────────────────────────
  for (const t of TACHES) {
    const projetId   = projetMap[t.localProjetId];
    const assigneAId = t.localAssigneId ? personneMap[t.localAssigneId] : null;
    if (!projetId) continue;

    const existing = await prisma.tache.findFirst({ where: { projetId, libelle: t.libelle } });
    const taskData = {
      libelle: t.libelle,
      description: t.description,
      priorite: t.priorite,
      assigneAId,
      statut: t.statut,
      etatAvancement: t.etatAvancement,
      progression: t.progression,
      poidsPriorite: t.poidsPriorite,
      ordre: t.ordre,
      dateDebutPrevisionnelle: t.dateDebutPrevisionnelle ? new Date(t.dateDebutPrevisionnelle) : null,
      dateFinPrevisionnelle:   t.dateFinPrevisionnelle   ? new Date(t.dateFinPrevisionnelle)   : null,
      dateDebutEffective:      t.dateDebutEffective      ? new Date(t.dateDebutEffective)      : null,
      dateFinEffective:        t.dateFinEffective        ? new Date(t.dateFinEffective)        : null,
    };
    if (existing) {
      await prisma.tache.update({ where: { id: existing.id }, data: taskData });
    } else {
      await prisma.tache.create({ data: { ...taskData, projetId } });
    }
  }
  console.log('[seed] Tâches : OK (' + TACHES.length + ')');

  // ── Risques — upsert par projetId + libelle (contrainte unique du schéma) ─────
  for (const r of RISQUES) {
    const projetId = projetMap[r.localProjetId];
    if (!projetId) continue;
    await prisma.risqueProjet.upsert({
      where:  { projetId_libelle: { projetId, libelle: r.libelle } },
      update: { taux: r.taux, gravite: r.gravite, couleur: r.couleur },
      create: { projetId, libelle: r.libelle, taux: r.taux, gravite: r.gravite, couleur: r.couleur },
    });
  }
  console.log('[seed] Risques : OK (' + RISQUES.length + ')');

  console.log('[seed] Seed complet terminé avec succès.');
}

main()
  .catch((error) => {
    console.error('[seed] Erreur :', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;

fs.writeFileSync(outPath, out, 'utf8');
console.log(`[generate-seed] prisma/seed.js généré (${fs.statSync(outPath).size} bytes)`);
