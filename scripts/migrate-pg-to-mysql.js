/**
 * Migration de données Railway (PostgreSQL) → Hébergeur (MySQL)
 *
 * Ce script lit toutes les données depuis la base PostgreSQL de Railway
 * et les insère dans la base MySQL de l'hébergeur.
 *
 * Prérequis :
 *   1. Avoir généré les deux clients Prisma :
 *        npm run migration:generate
 *   2. Que la base MySQL cible soit vide ou que --force soit passé
 *      (dans ce cas les tables sont vidées avant import)
 *
 * Usage :
 *   SOURCE_DATABASE_URL="postgresql://..." \
 *   TARGET_DATABASE_URL="mysql://..."      \
 *   node scripts/migrate-pg-to-mysql.js
 *
 *   Avec réinitialisation forcée des tables cibles :
 *   ... node scripts/migrate-pg-to-mysql.js --force
 */

'use strict';

const { PrismaClient: PgClient }    = require('../node_modules/.prisma/client-postgresql');
const { PrismaClient: MySQLClient } = require('../node_modules/.prisma/client-mysql');

// ─── Couleurs console ─────────────────────────────────────────────────────────
const c = {
  green:  (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red:    (s) => `\x1b[31m${s}\x1b[0m`,
  cyan:   (s) => `\x1b[36m${s}\x1b[0m`,
  bold:   (s) => `\x1b[1m${s}\x1b[0m`,
};

const FORCE = process.argv.includes('--force');

// ─── Initialisation des clients ───────────────────────────────────────────────
const source = new PgClient({
  datasources: { db: { url: process.env.SOURCE_DATABASE_URL } },
  log: [],
});

const target = new MySQLClient({
  datasources: { db: { url: process.env.TARGET_DATABASE_URL } },
  log: [],
});

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function log(msg)   { console.log(`  ${msg}`); }
function ok(msg)    { console.log(c.green(`  ✓ ${msg}`)); }
function warn(msg)  { console.log(c.yellow(`  ⚠ ${msg}`)); }
function fail(msg)  { console.error(c.red(`  ✗ ${msg}`)); }
function section(title) {
  console.log('\n' + c.bold(c.cyan(`── ${title} `)) + '─'.repeat(Math.max(0, 60 - title.length)));
}

async function importMany(label, records, insertFn) {
  if (records.length === 0) { warn(`${label} : aucune donnée`); return 0; }
  let inserted = 0;
  let errors   = 0;
  for (const record of records) {
    try {
      await insertFn(record);
      inserted++;
    } catch (err) {
      errors++;
      if (errors <= 3) fail(`${label} id=${record.id} : ${err.message}`);
      if (errors === 4) fail(`${label} : ... (autres erreurs masquées)`);
    }
  }
  if (errors > 0) warn(`${label} : ${inserted} insérés, ${errors} erreurs`);
  else ok(`${label} : ${inserted} enregistrements importés`);
  return inserted;
}

// ─── Vider les tables dans l'ordre inverse des FK (si --force) ───────────────
async function clearTarget() {
  warn('--force activé : suppression de toutes les données MySQL cibles...');
  // Désactiver les FK checks le temps du nettoyage
  await target.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');
  const tables = [
    'historique_modifications',
    'commentaires_occurrences',
    'commentaires_taches',
    'activites_taches',
    'risques_projets',
    'sous_taches',
    'parties_prenantes',
    'occurrences_taches',
    'taches_operationnelles',
    'operations',
    'taches_periodiques',
    'taches',
    'sessions_auth',
    'permissions_page_action',
    'comptes_acces',
    '_EquipeProjet',          // table de jointure many-to-many
    'projets',
    'personnes_ressources',
    'acteurs_collectifs',
    'entites',
  ];
  for (const t of tables) {
    await target.$executeRawUnsafe(`DELETE FROM \`${t}\``);
  }
  await target.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');
  ok('Tables vidées');
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  // ── Vérifications préliminaires
  if (!process.env.SOURCE_DATABASE_URL) {
    fail('SOURCE_DATABASE_URL non définie (PostgreSQL Railway)');
    process.exit(1);
  }
  if (!process.env.TARGET_DATABASE_URL) {
    fail('TARGET_DATABASE_URL non définie (MySQL hébergeur)');
    process.exit(1);
  }

  console.log(c.bold('\n╔══════════════════════════════════════════════╗'));
  console.log(c.bold('║   Migration PostgreSQL (Railway) → MySQL      ║'));
  console.log(c.bold('╚══════════════════════════════════════════════╝'));
  log(`Source : ${process.env.SOURCE_DATABASE_URL.replace(/:\/\/[^@]+@/, '://***@')}`);
  log(`Cible  : ${process.env.TARGET_DATABASE_URL.replace(/:\/\/[^@]+@/, '://***@')}`);

  await source.$connect();
  await target.$connect();
  log('Connexions établies');

  if (FORCE) await clearTarget();

  // ═══════════════════════════════════════════════════════════
  // 1. ENTITÉS (table auto-référentielle : parentId)
  //    → On insère d'abord sans parentId, puis on patch.
  // ═══════════════════════════════════════════════════════════
  section('1. Entités');
  const entites = await source.entite.findMany();
  // Passe 1 : sans parentId
  await importMany('Entite (passe 1/2)', entites, (e) =>
    target.entite.upsert({
      where: { id: e.id },
      update: {},
      create: { ...e, parentId: null },
    })
  );
  // Passe 2 : rétablir les parentId
  const entitesAvecParent = entites.filter((e) => e.parentId !== null);
  if (entitesAvecParent.length > 0) {
    await importMany('Entite (passe 2/2 — hiérarchie)', entitesAvecParent, (e) =>
      target.entite.update({ where: { id: e.id }, data: { parentId: e.parentId } })
    );
  } else {
    ok('Entite (passe 2/2) : aucune hiérarchie à rétablir');
  }

  // ═══════════════════════════════════════════════════════════
  // 2. ACTEURS COLLECTIFS
  // ═══════════════════════════════════════════════════════════
  section('2. Acteurs collectifs');
  const acteurs = await source.acteurCollectif.findMany();
  await importMany('ActeurCollectif', acteurs, (a) =>
    target.acteurCollectif.upsert({
      where: { id: a.id },
      update: { ...a },
      create: { ...a },
    })
  );

  // ═══════════════════════════════════════════════════════════
  // 3. PERSONNES RESSOURCES
  // ═══════════════════════════════════════════════════════════
  section('3. Personnes ressources');
  const personnes = await source.personneRessource.findMany();
  await importMany('PersonneRessource', personnes, (p) =>
    target.personneRessource.upsert({
      where: { id: p.id },
      update: { ...p },
      create: { ...p },
    })
  );

  // ═══════════════════════════════════════════════════════════
  // 4. COMPTES ACCÈS
  // ═══════════════════════════════════════════════════════════
  section('4. Comptes accès');
  const comptes = await source.compteAcces.findMany();
  await importMany('CompteAcces', comptes, (c) =>
    target.compteAcces.upsert({
      where: { id: c.id },
      update: { ...c },
      create: { ...c },
    })
  );

  // ═══════════════════════════════════════════════════════════
  // 5. PROJETS (sans équipe — la jointure vient après)
  // ═══════════════════════════════════════════════════════════
  section('5. Projets');
  const projets = await source.projet.findMany();
  await importMany('Projet', projets, (p) =>
    target.projet.upsert({
      where: { id: p.id },
      update: { ...p },
      create: { ...p },
    })
  );

  // ═══════════════════════════════════════════════════════════
  // 6. ÉQUIPE PROJET (table de jointure many-to-many)
  //    Prisma génère la table _EquipeProjet avec colonnes A et B.
  //    A = PersonneRessource (ordre alpha), B = Projet
  // ═══════════════════════════════════════════════════════════
  section('6. Équipes projet (jointure)');
  let equipeRows;
  try {
    equipeRows = await source.$queryRaw`SELECT "A", "B" FROM "_EquipeProjet"`;
  } catch {
    // PostgreSQL peut utiliser des guillemets doubles ou le nom exact
    try {
      equipeRows = await source.$queryRaw`SELECT "A", "B" FROM _EquipeProjet`;
    } catch (err2) {
      warn(`Impossible de lire _EquipeProjet : ${err2.message}`);
      equipeRows = [];
    }
  }
  if (equipeRows.length > 0) {
    let inserted = 0, errors = 0;
    for (const row of equipeRows) {
      try {
        await target.$executeRaw`
          INSERT IGNORE INTO \`_EquipeProjet\` (A, B) VALUES (${row.A}, ${row.B})
        `;
        inserted++;
      } catch (err) {
        errors++;
        if (errors <= 3) fail(`EquipeProjet A=${row.A} B=${row.B} : ${err.message}`);
      }
    }
    if (errors) warn(`EquipeProjet : ${inserted} insérés, ${errors} erreurs`);
    else ok(`EquipeProjet : ${inserted} relations importées`);
  } else {
    warn('EquipeProjet : aucune relation');
  }

  // ═══════════════════════════════════════════════════════════
  // 7. SESSIONS & PERMISSIONS
  // ═══════════════════════════════════════════════════════════
  section('7. Sessions & Permissions');
  const sessions = await source.sessionAuth.findMany();
  await importMany('SessionAuth', sessions, (s) =>
    target.sessionAuth.upsert({
      where: { id: s.id },
      update: { ...s },
      create: { ...s },
    })
  );

  const permissions = await source.permissionPageAction.findMany();
  await importMany('PermissionPageAction', permissions, (p) =>
    target.permissionPageAction.upsert({
      where: { id: p.id },
      update: { ...p },
      create: { ...p },
    })
  );

  // ═══════════════════════════════════════════════════════════
  // 8. TÂCHES PÉRIODIQUES
  // ═══════════════════════════════════════════════════════════
  section('8. Tâches périodiques');
  const tachesPeriodiques = await source.tachePerodique.findMany();
  await importMany('TachePerodique', tachesPeriodiques, (t) =>
    target.tachePerodique.upsert({
      where: { id: t.id },
      update: { ...t },
      create: { ...t },
    })
  );

  // ═══════════════════════════════════════════════════════════
  // 9. OPÉRATIONS + TÂCHES OPÉRATIONNELLES
  // ═══════════════════════════════════════════════════════════
  section('9. Opérations');
  const operations = await source.operation.findMany();
  await importMany('Operation', operations, (o) =>
    target.operation.upsert({
      where: { id: o.id },
      update: { ...o },
      create: { ...o },
    })
  );

  const tachesOp = await source.tacheOperationnelle.findMany();
  await importMany('TacheOperationnelle', tachesOp, (t) =>
    target.tacheOperationnelle.upsert({
      where: { id: t.id },
      update: { ...t },
      create: { ...t },
    })
  );

  // ═══════════════════════════════════════════════════════════
  // 10. TÂCHES PROJET + SOUS-TÂCHES
  // ═══════════════════════════════════════════════════════════
  section('10. Tâches & sous-tâches');
  const taches = await source.tache.findMany();
  await importMany('Tache', taches, (t) =>
    target.tache.upsert({
      where: { id: t.id },
      update: { ...t },
      create: { ...t },
    })
  );

  const sousTaches = await source.sousTache.findMany();
  await importMany('SousTache', sousTaches, (s) =>
    target.sousTache.upsert({
      where: { id: s.id },
      update: { ...s },
      create: { ...s },
    })
  );

  // ═══════════════════════════════════════════════════════════
  // 11. OCCURRENCES
  // ═══════════════════════════════════════════════════════════
  section('11. Occurrences');
  const occurrences = await source.occurrenceTache.findMany();
  await importMany('OccurrenceTache', occurrences, (o) =>
    target.occurrenceTache.upsert({
      where: { id: o.id },
      update: { ...o },
      create: { ...o },
    })
  );

  // ═══════════════════════════════════════════════════════════
  // 12. PARTIES PRENANTES & RISQUES
  // ═══════════════════════════════════════════════════════════
  section('12. Parties prenantes & Risques');
  const pp = await source.partiePrenante.findMany();
  await importMany('PartiePrenante', pp, (p) =>
    target.partiePrenante.upsert({
      where: { id: p.id },
      update: { ...p },
      create: { ...p },
    })
  );

  const risques = await source.risqueProjet.findMany();
  await importMany('RisqueProjet', risques, (r) =>
    target.risqueProjet.upsert({
      where: { id: r.id },
      update: { ...r },
      create: { ...r },
    })
  );

  // ═══════════════════════════════════════════════════════════
  // 13. COMMENTAIRES (auto-référentiels : parentId)
  //     → Passe 1 sans parentId, passe 2 rétablit les threads.
  // ═══════════════════════════════════════════════════════════
  section('13. Commentaires tâches');
  const commentsTaches = await source.commentaireTache.findMany();
  await importMany('CommentaireTache (passe 1/2)', commentsTaches, (c) =>
    target.commentaireTache.upsert({
      where: { id: c.id },
      update: { ...c, parentId: null },
      create: { ...c, parentId: null },
    })
  );
  const commentsAvecParent = commentsTaches.filter((c) => c.parentId !== null);
  if (commentsAvecParent.length > 0) {
    await importMany('CommentaireTache (passe 2/2 — threads)', commentsAvecParent, (c) =>
      target.commentaireTache.update({ where: { id: c.id }, data: { parentId: c.parentId } })
    );
  } else {
    ok('CommentaireTache (passe 2/2) : aucun thread');
  }

  section('14. Commentaires occurrences');
  const commentsOcc = await source.commentaireOccurrence.findMany();
  await importMany('CommentaireOccurrence (passe 1/2)', commentsOcc, (c) =>
    target.commentaireOccurrence.upsert({
      where: { id: c.id },
      update: { ...c, parentId: null },
      create: { ...c, parentId: null },
    })
  );
  const commentsOccAvecParent = commentsOcc.filter((c) => c.parentId !== null);
  if (commentsOccAvecParent.length > 0) {
    await importMany('CommentaireOccurrence (passe 2/2 — threads)', commentsOccAvecParent, (c) =>
      target.commentaireOccurrence.update({ where: { id: c.id }, data: { parentId: c.parentId } })
    );
  } else {
    ok('CommentaireOccurrence (passe 2/2) : aucun thread');
  }

  // ═══════════════════════════════════════════════════════════
  // 15. ACTIVITÉS TÂCHES
  // ═══════════════════════════════════════════════════════════
  section('15. Activités tâches');
  const activites = await source.activiteTache.findMany();
  await importMany('ActiviteTache', activites, (a) =>
    target.activiteTache.upsert({
      where: { id: a.id },
      update: { ...a },
      create: { ...a },
    })
  );

  // ═══════════════════════════════════════════════════════════
  // 16. HISTORIQUE MODIFICATIONS
  // ═══════════════════════════════════════════════════════════
  section('16. Historique modifications');
  const historique = await source.historiqueModification.findMany();
  await importMany('HistoriqueModification', historique, (h) =>
    target.historiqueModification.upsert({
      where: { id: h.id },
      update: { ...h },
      create: { ...h },
    })
  );

  // ═══════════════════════════════════════════════════════════
  // RÉSUMÉ
  // ═══════════════════════════════════════════════════════════
  console.log('\n' + c.bold(c.green('╔══════════════════════════════════════════════╗')));
  console.log(c.bold(c.green('║   Migration terminée avec succès              ║')));
  console.log(c.bold(c.green('╚══════════════════════════════════════════════╝\n')));

  await source.$disconnect();
  await target.$disconnect();
}

main().catch(async (err) => {
  fail(`Erreur fatale : ${err.message}`);
  console.error(err);
  await source.$disconnect().catch(() => {});
  await target.$disconnect().catch(() => {});
  process.exit(1);
});
