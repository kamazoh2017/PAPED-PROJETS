/**
 * Génère prisma/seed.js depuis les données actuelles de la base de données.
 * Usage : node scripts/generate-seed.js
 * Prérequis : db-export.json généré au préalable.
 */

const fs   = require('fs');
const path = require('path');

const data    = require('../db-export.json');
const outPath = path.join(__dirname, '..', 'prisma', 'seed.js');

function date(v) {
  if (!v) return 'null';
  return `new Date("${v}")`;
}

function str(v) {
  if (v === null || v === undefined) return 'null';
  return JSON.stringify(v);
}

function bool(v) { return v ? 'true' : 'false'; }
function num(v)  { return v === null || v === undefined ? '0' : v; }

// ── Build equipe map  ──────────────────────────────────────────────────────────
const equipeMap = {};
data.projets.forEach(p => {
  equipeMap[p.id] = (p.equipeProjet || []).map(e => e.id);
});

// ── Helpers ────────────────────────────────────────────────────────────────────
function upsertEntite(e) {
  return `
  await prisma.entite.upsert({
    where: { id: ${str(e.id)} },
    update: { libelle: ${str(e.libelle)}, tutelle: ${str(e.tutelle)} },
    create: { id: ${str(e.id)}, libelle: ${str(e.libelle)}, tutelle: ${str(e.tutelle)} },
  });`;
}

function upsertPersonne(p) {
  return `
  await prisma.personneRessource.upsert({
    where: { id: ${str(p.id)} },
    update: {
      nom: ${str(p.nom)}, prenoms: ${str(p.prenoms)},
      telephone: ${str(p.telephone)}, email: ${str(p.email)},
      fonction: ${str(p.fonction)}, entiteId: ${str(p.entiteId)},
      estChefProjet: ${bool(p.estChefProjet)},
    },
    create: {
      id: ${str(p.id)}, nom: ${str(p.nom)}, prenoms: ${str(p.prenoms)},
      telephone: ${str(p.telephone)}, email: ${str(p.email)},
      fonction: ${str(p.fonction)}, entiteId: ${str(p.entiteId)},
      estChefProjet: ${bool(p.estChefProjet)},
    },
  });`;
}

function upsertCompte(c) {
  const isSuperAdmin = c.estSuperAdmin;
  const loginField   = c.login ? `login: ${str(c.login)},` : '';
  const personneField = c.personneId ? `personneId: ${str(c.personneId)},` : '';
  const mdpField     = isSuperAdmin
    ? `motDePasseHash: hashPassword(DEFAULT_PASSWORD),`
    : `motDePasseHash: hashPassword(DEFAULT_PASSWORD),`;
  const doitChanger  = isSuperAdmin ? 'false' : 'true';

  return `
  await prisma.compteAcces.upsert({
    where: { id: ${str(c.id)} },
    update: {
      ${loginField}
      estSuperAdmin: ${bool(c.estSuperAdmin)},
      estActif: ${bool(c.estActif)},
      doitChangerMdp: ${doitChanger},
      ${personneField}
    },
    create: {
      id: ${str(c.id)},
      ${loginField}
      estSuperAdmin: ${bool(c.estSuperAdmin)},
      estActif: ${bool(c.estActif)},
      doitChangerMdp: ${doitChanger},
      ${mdpField}
      ${personneField}
    },
  });`;
}

function upsertPermissions(c) {
  if (!c.permissions || c.permissions.length === 0) return '';
  return `
  await prisma.permissionPageAction.deleteMany({ where: { compteId: ${str(c.id)} } });
  await prisma.permissionPageAction.createMany({ data: [
${c.permissions.map(p => `    { compteId: ${str(p.compteId)}, pageKey: ${str(p.pageKey)}, actionKey: ${str(p.actionKey)}, autorise: ${bool(p.autorise)} }`).join(',\n')}
  ]});`;
}

function upsertProjet(p) {
  const equipe = (equipeMap[p.id] || []).map(id => `{ id: ${str(id)} }`).join(', ');
  return `
  await prisma.projet.upsert({
    where: { id: ${str(p.id)} },
    update: {
      libelle: ${str(p.libelle)},
      description: ${str(p.description)},
      statut: ${str(p.statut)},
      etatAvancement: ${str(p.etatAvancement)},
      chefProjetId: ${str(p.chefProjetId)},
      dateDebutPrevisionnelle: ${date(p.dateDebutPrevisionnelle)},
      dateFinPrevisionnelle: ${date(p.dateFinPrevisionnelle)},
      dateDebutEffective: ${date(p.dateDebutEffective)},
      dateFinEffective: ${date(p.dateFinEffective)},
      tauxAvancementReel: ${num(p.tauxAvancementReel)},
      tauxAvancementAttendu: ${num(p.tauxAvancementAttendu)},
      tauxAchevementReel: ${num(p.tauxAchevementReel)},
      tauxAchevementAttendu: ${num(p.tauxAchevementAttendu)},
      equipeProjet: { set: [${equipe}] },
    },
    create: {
      id: ${str(p.id)},
      libelle: ${str(p.libelle)},
      description: ${str(p.description)},
      statut: ${str(p.statut)},
      etatAvancement: ${str(p.etatAvancement)},
      chefProjetId: ${str(p.chefProjetId)},
      dateDebutPrevisionnelle: ${date(p.dateDebutPrevisionnelle)},
      dateFinPrevisionnelle: ${date(p.dateFinPrevisionnelle)},
      dateDebutEffective: ${date(p.dateDebutEffective)},
      dateFinEffective: ${date(p.dateFinEffective)},
      tauxAvancementReel: ${num(p.tauxAvancementReel)},
      tauxAvancementAttendu: ${num(p.tauxAvancementAttendu)},
      tauxAchevementReel: ${num(p.tauxAchevementReel)},
      tauxAchevementAttendu: ${num(p.tauxAchevementAttendu)},
      equipeProjet: { connect: [${equipe}] },
    },
  });`;
}

function upsertTache(t) {
  return `
  await prisma.tache.upsert({
    where: { id: ${str(t.id)} },
    update: {
      projetId: ${str(t.projetId)},
      libelle: ${str(t.libelle)},
      description: ${str(t.description)},
      priorite: ${str(t.priorite)},
      assigneAId: ${str(t.assigneAId)},
      statut: ${str(t.statut)},
      etatAvancement: ${str(t.etatAvancement)},
      progression: ${num(t.progression)},
      poidsPriorite: ${num(t.poidsPriorite)},
      ordre: ${num(t.ordre)},
      dateDebutPrevisionnelle: ${date(t.dateDebutPrevisionnelle)},
      dateFinPrevisionnelle: ${date(t.dateFinPrevisionnelle)},
      dateDebutEffective: ${date(t.dateDebutEffective)},
      dateFinEffective: ${date(t.dateFinEffective)},
    },
    create: {
      id: ${str(t.id)},
      projetId: ${str(t.projetId)},
      libelle: ${str(t.libelle)},
      description: ${str(t.description)},
      priorite: ${str(t.priorite)},
      assigneAId: ${str(t.assigneAId)},
      statut: ${str(t.statut)},
      etatAvancement: ${str(t.etatAvancement)},
      progression: ${num(t.progression)},
      poidsPriorite: ${num(t.poidsPriorite)},
      ordre: ${num(t.ordre)},
      dateDebutPrevisionnelle: ${date(t.dateDebutPrevisionnelle)},
      dateFinPrevisionnelle: ${date(t.dateFinPrevisionnelle)},
      dateDebutEffective: ${date(t.dateDebutEffective)},
      dateFinEffective: ${date(t.dateFinEffective)},
    },
  });`;
}

function upsertRisque(r) {
  return `
  await prisma.risqueProjet.upsert({
    where: { id: ${str(r.id)} },
    update: { libelle: ${str(r.libelle)}, taux: ${num(r.taux)}, gravite: ${str(r.gravite)}, couleur: ${str(r.couleur)} },
    create: { id: ${str(r.id)}, projetId: ${str(r.projetId)}, libelle: ${str(r.libelle)}, taux: ${num(r.taux)}, gravite: ${str(r.gravite)}, couleur: ${str(r.couleur)} },
  });`;
}

// ── Generate seed.js ──────────────────────────────────────────────────────────
const lines = [];
lines.push(`/**
 * Seed complet — généré automatiquement depuis la base de données locale.
 * Contient : entités, personnes, comptes (mot de passe par défaut), projets,
 *            tâches, risques et permissions.
 * Idempotent (upserts). Mot de passe par défaut : ${`'0123456789'`}
 * Super admin  : super@super / 0123456789
 * Autres comptes : login@pape-d / 0123456789 (doitChangerMdp = true)
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

async function main() {
  console.log('[seed] Démarrage du seed complet...');
`);

lines.push(`\n  // ── Entités ──────────────────────────────────────────────────────────────────`);
data.entites.forEach(e => lines.push(upsertEntite(e)));
lines.push(`  console.log('[seed] Entités : OK (${data.entites.length})');`);

lines.push(`\n  // ── Personnes ressources ─────────────────────────────────────────────────────`);
data.personnes.forEach(p => lines.push(upsertPersonne(p)));
lines.push(`  console.log('[seed] Personnes : OK (${data.personnes.length})');`);

lines.push(`\n  // ── Comptes d'accès ───────────────────────────────────────────────────────────`);
data.comptes.forEach(c => lines.push(upsertCompte(c)));
lines.push(`  console.log('[seed] Comptes : OK (${data.comptes.length})');`);

lines.push(`\n  // ── Permissions ──────────────────────────────────────────────────────────────`);
data.comptes.forEach(c => { if (c.permissions?.length) lines.push(upsertPermissions(c)); });
lines.push(`  console.log('[seed] Permissions : OK');`);

lines.push(`\n  // ── Projets ──────────────────────────────────────────────────────────────────`);
data.projets.forEach(p => lines.push(upsertProjet(p)));
lines.push(`  console.log('[seed] Projets : OK (${data.projets.length})');`);

lines.push(`\n  // ── Tâches ───────────────────────────────────────────────────────────────────`);
data.taches.forEach(t => lines.push(upsertTache(t)));
lines.push(`  console.log('[seed] Tâches : OK (${data.taches.length})');`);

lines.push(`\n  // ── Risques ──────────────────────────────────────────────────────────────────`);
data.risques.forEach(r => lines.push(upsertRisque(r)));
lines.push(`  console.log('[seed] Risques : OK (${data.risques.length})');`);

lines.push(`
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
`);

fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log(`[generate-seed] prisma/seed.js généré (${fs.statSync(outPath).size} bytes)`);
