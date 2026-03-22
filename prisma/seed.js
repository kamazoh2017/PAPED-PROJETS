/**
 * Seed complet — généré automatiquement depuis la base de données locale.
 * Utilise les clés naturelles uniques pour les upserts → idempotent sur
 * SQLite (dev) ET PostgreSQL (Railway preprod/prod).
 *
 * Données : 1 entité(s), 11 personnes, 12 comptes,
 *           4 projets, 57 tâches, 40 risques, 880 permissions.
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
  return `${salt}:${hash}`;
}

// ── Données source (ids locaux utilisés pour les références croisées) ──────────

const ENTITES = [
  {
    "localId": "cmmxcj6z300022pkwcilo3fdt",
    "libelle": "PAPE-D",
    "tutelle": "MSHPCMU"
  }
];

const PERSONNES = [
  {
    "localId": "cmmxckc4j00042pkw06iid9ra",
    "localEntiteId": "cmmxcj6z300022pkwcilo3fdt",
    "nom": "BEGUHE",
    "prenoms": "KAMA",
    "telephone": "0758637661",
    "email": "kama.beguhe@gmail.com",
    "fonction": "CONSULTANT IT",
    "estChefProjet": false
  },
  {
    "localId": "cmmxdby5n00082pkwvgxl1mfk",
    "localEntiteId": "cmmxcj6z300022pkwcilo3fdt",
    "nom": "ODY",
    "prenoms": "VENANCE",
    "telephone": "0757895758",
    "email": "venance.ody@mshpcmu.ci",
    "fonction": "CONSULTANT IT",
    "estChefProjet": false
  },
  {
    "localId": "cmmxdct8h000a2pkwj8m4exce",
    "localEntiteId": "cmmxcj6z300022pkwcilo3fdt",
    "nom": "EDI",
    "prenoms": "K. CHARLES",
    "telephone": "0757377819",
    "email": "charles.edi@mshpcmu.ci",
    "fonction": "COORDINATEUR PROJET",
    "estChefProjet": false
  },
  {
    "localId": "cmmxddhqm000c2pkw74jpq77d",
    "localEntiteId": "cmmxcj6z300022pkwcilo3fdt",
    "nom": "TIENE",
    "prenoms": "LEATICIA",
    "telephone": "0102237257",
    "email": "leaticia.tiene@mshpcmu.ci",
    "fonction": "ASSISTANTE PROJET",
    "estChefProjet": false
  },
  {
    "localId": "cmmxdfccc000g2pkwcihmzpek",
    "localEntiteId": "cmmxcj6z300022pkwcilo3fdt",
    "nom": "ABE",
    "prenoms": "SERGE",
    "telephone": "0707993986",
    "email": "serge.abe@mshpcmu.ci",
    "fonction": "CONSULTANT IT",
    "estChefProjet": false
  },
  {
    "localId": "cmmxdhcu8000i2pkwjcsoo194",
    "localEntiteId": "cmmxcj6z300022pkwcilo3fdt",
    "nom": "YOUKOUA",
    "prenoms": "STEPANE",
    "telephone": "0777273610",
    "email": "stephane.youkoua@mshpcmu.ci",
    "fonction": "RESPONSABLE DU DEPLOIEMENT DU SIH",
    "estChefProjet": false
  },
  {
    "localId": "cmn1wpwkm0ljj7mnedupjdizg",
    "localEntiteId": "cmmxcj6z300022pkwcilo3fdt",
    "nom": "ADOU",
    "prenoms": "MARTIN-PHILIPPE",
    "telephone": "0709400636",
    "email": "mphilippe.adou@mshpcmu.ci",
    "fonction": "CONSULTANT IT",
    "estChefProjet": false
  },
  {
    "localId": "cmn1wuwis0lxh7mnerl4jgx7b",
    "localEntiteId": "cmmxcj6z300022pkwcilo3fdt",
    "nom": "BERTE",
    "prenoms": "FATIM",
    "telephone": "0777103307",
    "email": "fatim.berte@mshpcmu.ci",
    "fonction": "RESPONSABLE COMMUNICATION",
    "estChefProjet": false
  },
  {
    "localId": "cmn1ww3ba0m0b7mneqhgxd4su",
    "localEntiteId": "cmmxcj6z300022pkwcilo3fdt",
    "nom": "TOURE",
    "prenoms": "FATI",
    "telephone": "0749755520",
    "email": "fati.toure@mshpcmu.ci",
    "fonction": "RESPONSABLE SUIVI ET EVALUATION",
    "estChefProjet": false
  },
  {
    "localId": "cmn1wx6i80m357mnedvy7c814",
    "localEntiteId": "cmmxcj6z300022pkwcilo3fdt",
    "nom": "ADAHI",
    "prenoms": "CYRIAQUE",
    "telephone": "0797500449",
    "email": "cyriaque.kouadio@mshpcmu.ci",
    "fonction": "ASSISTANT COMMUNICATION",
    "estChefProjet": false
  },
  {
    "localId": "cmn1wydab0m5z7mnex6txxjvz",
    "localEntiteId": "cmmxcj6z300022pkwcilo3fdt",
    "nom": "TRAORE",
    "prenoms": "AMINATOU",
    "telephone": "0709682488",
    "email": "aminatou.traore@mshpcmu.ci",
    "fonction": "ASSISTANTE COMPTABLE",
    "estChefProjet": false
  }
];

const COMPTES = [
  {
    "localId": "cmmxbr8pu000010ajvcstz7z4",
    "login": "super@super",
    "estSuperAdmin": true,
    "estActif": true,
    "localPersonneId": null,
    "permissions": []
  },
  {
    "localId": "cmmxckszr00062pkwi9eblw7q",
    "login": null,
    "estSuperAdmin": false,
    "estActif": true,
    "localPersonneId": "cmmxckc4j00042pkw06iid9ra",
    "permissions": [
      {
        "pageKey": "comptes-acces",
        "actionKey": "change-password",
        "autorise": true
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "create",
        "autorise": true
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "manage-authz",
        "autorise": true
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "suspend",
        "autorise": true
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "add-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "add-equipe",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "create-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "delete",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "delete-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "delete-tache",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-chef",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-debut-eff",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-debut-prev",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-fin-eff",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-fin-prev",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-statut",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-assigne",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-dates-eff",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-dates-prev",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-priorite",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-statut-av",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-statut-exec",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-a-faire",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-en-attente",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-en-cours",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-termine",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-valide",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "remove-equipe",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "reply-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "save-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-chef",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-comments",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-debut-eff",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-debut-prev",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-detail-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-detail-tache-tab",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-entites",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-equipe",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-exec",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-fin-eff",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-fin-prev",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-gantt",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-historique",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-info",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-pp",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-statut",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-assigne",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-dates-eff",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-dates-prev",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-info",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-priorite",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-statut-av",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-statut-exec",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-taches",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "create",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "delete",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "update",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "create",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "delete",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "update",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "profil",
        "actionKey": "change-password",
        "autorise": true
      },
      {
        "pageKey": "profil",
        "actionKey": "edit-info",
        "autorise": true
      },
      {
        "pageKey": "profil",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "projets",
        "actionKey": "create",
        "autorise": true
      },
      {
        "pageKey": "projets",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "projets",
        "actionKey": "view-detail",
        "autorise": true
      },
      {
        "pageKey": "tableau-de-bord",
        "actionKey": "view",
        "autorise": true
      }
    ]
  },
  {
    "localId": "cmn1x6co80pgd7mnesmfvhcwj",
    "login": null,
    "estSuperAdmin": false,
    "estActif": true,
    "localPersonneId": "cmmxdby5n00082pkwvgxl1mfk",
    "permissions": [
      {
        "pageKey": "comptes-acces",
        "actionKey": "change-password",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "create",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "manage-authz",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "suspend",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "add-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "add-equipe",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "create-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "delete",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "delete-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "delete-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-chef",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-debut-eff",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-debut-prev",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-fin-eff",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-fin-prev",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-statut",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-assigne",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-dates-eff",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-dates-prev",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-priorite",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-statut-av",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-statut-exec",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-a-faire",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-en-attente",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-en-cours",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-termine",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-valide",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "remove-equipe",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "reply-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "save-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-chef",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-comments",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-debut-eff",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-debut-prev",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-detail-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-detail-tache-tab",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-entites",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-equipe",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-exec",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-fin-eff",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-fin-prev",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-gantt",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-historique",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-info",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-pp",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-statut",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-assigne",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-dates-eff",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-dates-prev",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-info",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-priorite",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-statut-av",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-statut-exec",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-taches",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "create",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "delete",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "update",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "create",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "delete",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "update",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "profil",
        "actionKey": "change-password",
        "autorise": true
      },
      {
        "pageKey": "profil",
        "actionKey": "edit-info",
        "autorise": true
      },
      {
        "pageKey": "profil",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "projets",
        "actionKey": "create",
        "autorise": true
      },
      {
        "pageKey": "projets",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "projets",
        "actionKey": "view-detail",
        "autorise": true
      },
      {
        "pageKey": "tableau-de-bord",
        "actionKey": "view",
        "autorise": true
      }
    ]
  },
  {
    "localId": "cmn1x6gtx0pja7mnevyl9g65i",
    "login": null,
    "estSuperAdmin": false,
    "estActif": true,
    "localPersonneId": "cmmxdct8h000a2pkwj8m4exce",
    "permissions": [
      {
        "pageKey": "comptes-acces",
        "actionKey": "change-password",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "create",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "manage-authz",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "suspend",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "add-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "add-equipe",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "create-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "delete",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "delete-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "delete-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-chef",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-debut-eff",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-debut-prev",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-fin-eff",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-fin-prev",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-statut",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-assigne",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-dates-eff",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-dates-prev",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-priorite",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-statut-av",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-statut-exec",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-a-faire",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-en-attente",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-en-cours",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-termine",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-valide",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "remove-equipe",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "reply-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "save-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-chef",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-comments",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-debut-eff",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-debut-prev",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-detail-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-detail-tache-tab",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-entites",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-equipe",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-exec",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-fin-eff",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-fin-prev",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-gantt",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-historique",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-info",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-pp",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-statut",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-assigne",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-dates-eff",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-dates-prev",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-info",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-priorite",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-statut-av",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-statut-exec",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-taches",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "create",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "delete",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "update",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "create",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "delete",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "update",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "profil",
        "actionKey": "change-password",
        "autorise": true
      },
      {
        "pageKey": "profil",
        "actionKey": "edit-info",
        "autorise": true
      },
      {
        "pageKey": "profil",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "projets",
        "actionKey": "create",
        "autorise": true
      },
      {
        "pageKey": "projets",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "projets",
        "actionKey": "view-detail",
        "autorise": true
      },
      {
        "pageKey": "tableau-de-bord",
        "actionKey": "view",
        "autorise": true
      }
    ]
  },
  {
    "localId": "cmn1x6k4f0pm77mne3zp49f4d",
    "login": null,
    "estSuperAdmin": false,
    "estActif": true,
    "localPersonneId": "cmmxddhqm000c2pkw74jpq77d",
    "permissions": [
      {
        "pageKey": "comptes-acces",
        "actionKey": "change-password",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "create",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "manage-authz",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "suspend",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "add-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "add-equipe",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "create-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "delete",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "delete-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "delete-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-chef",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-debut-eff",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-debut-prev",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-fin-eff",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-fin-prev",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-statut",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-assigne",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-dates-eff",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-dates-prev",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-priorite",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-statut-av",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-statut-exec",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-a-faire",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-en-attente",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-en-cours",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-termine",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-valide",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "remove-equipe",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "reply-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "save-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-chef",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-comments",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-debut-eff",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-debut-prev",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-detail-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-detail-tache-tab",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-entites",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-equipe",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-exec",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-fin-eff",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-fin-prev",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-gantt",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-historique",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-info",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-pp",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-statut",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-assigne",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-dates-eff",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-dates-prev",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-info",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-priorite",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-statut-av",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-statut-exec",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-taches",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "create",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "delete",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "update",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "create",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "delete",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "update",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "profil",
        "actionKey": "change-password",
        "autorise": true
      },
      {
        "pageKey": "profil",
        "actionKey": "edit-info",
        "autorise": true
      },
      {
        "pageKey": "profil",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "projets",
        "actionKey": "create",
        "autorise": true
      },
      {
        "pageKey": "projets",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "projets",
        "actionKey": "view-detail",
        "autorise": true
      },
      {
        "pageKey": "tableau-de-bord",
        "actionKey": "view",
        "autorise": true
      }
    ]
  },
  {
    "localId": "cmn1x6nx60pp47mne11d21xmi",
    "login": null,
    "estSuperAdmin": false,
    "estActif": true,
    "localPersonneId": "cmmxdfccc000g2pkwcihmzpek",
    "permissions": [
      {
        "pageKey": "comptes-acces",
        "actionKey": "change-password",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "create",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "manage-authz",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "suspend",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "add-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "add-equipe",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "create-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "delete",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "delete-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "delete-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-chef",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-debut-eff",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-debut-prev",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-fin-eff",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-fin-prev",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-statut",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-assigne",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-dates-eff",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-dates-prev",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-priorite",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-statut-av",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-statut-exec",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-a-faire",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-en-attente",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-en-cours",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-termine",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-valide",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "remove-equipe",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "reply-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "save-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-chef",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-comments",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-debut-eff",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-debut-prev",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-detail-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-detail-tache-tab",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-entites",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-equipe",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-exec",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-fin-eff",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-fin-prev",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-gantt",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-historique",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-info",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-pp",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-statut",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-assigne",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-dates-eff",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-dates-prev",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-info",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-priorite",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-statut-av",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-statut-exec",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-taches",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "create",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "delete",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "update",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "create",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "delete",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "update",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "profil",
        "actionKey": "change-password",
        "autorise": true
      },
      {
        "pageKey": "profil",
        "actionKey": "edit-info",
        "autorise": true
      },
      {
        "pageKey": "profil",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "projets",
        "actionKey": "create",
        "autorise": true
      },
      {
        "pageKey": "projets",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "projets",
        "actionKey": "view-detail",
        "autorise": true
      },
      {
        "pageKey": "tableau-de-bord",
        "actionKey": "view",
        "autorise": true
      }
    ]
  },
  {
    "localId": "cmn1x6qr00ps17mne7cyzoilu",
    "login": null,
    "estSuperAdmin": false,
    "estActif": true,
    "localPersonneId": "cmmxdhcu8000i2pkwjcsoo194",
    "permissions": [
      {
        "pageKey": "comptes-acces",
        "actionKey": "change-password",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "create",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "manage-authz",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "suspend",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "add-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "add-equipe",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "create-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "delete",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "delete-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "delete-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-chef",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-debut-eff",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-debut-prev",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-fin-eff",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-fin-prev",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-statut",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-assigne",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-dates-eff",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-dates-prev",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-priorite",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-statut-av",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-statut-exec",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-a-faire",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-en-attente",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-en-cours",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-termine",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-valide",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "remove-equipe",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "reply-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "save-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-chef",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-comments",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-debut-eff",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-debut-prev",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-detail-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-detail-tache-tab",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-entites",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-equipe",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-exec",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-fin-eff",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-fin-prev",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-gantt",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-historique",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-info",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-pp",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-statut",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-assigne",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-dates-eff",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-dates-prev",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-info",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-priorite",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-statut-av",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-statut-exec",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-taches",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "create",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "delete",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "update",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "create",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "delete",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "update",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "profil",
        "actionKey": "change-password",
        "autorise": true
      },
      {
        "pageKey": "profil",
        "actionKey": "edit-info",
        "autorise": true
      },
      {
        "pageKey": "profil",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "projets",
        "actionKey": "create",
        "autorise": true
      },
      {
        "pageKey": "projets",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "projets",
        "actionKey": "view-detail",
        "autorise": true
      },
      {
        "pageKey": "tableau-de-bord",
        "actionKey": "view",
        "autorise": true
      }
    ]
  },
  {
    "localId": "cmn1x6u720puy7mnefa41k2ri",
    "login": null,
    "estSuperAdmin": false,
    "estActif": true,
    "localPersonneId": "cmn1wpwkm0ljj7mnedupjdizg",
    "permissions": [
      {
        "pageKey": "comptes-acces",
        "actionKey": "change-password",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "create",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "manage-authz",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "suspend",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "add-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "add-equipe",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "create-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "delete",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "delete-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "delete-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-chef",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-debut-eff",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-debut-prev",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-fin-eff",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-fin-prev",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-statut",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-assigne",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-dates-eff",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-dates-prev",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-priorite",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-statut-av",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-statut-exec",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-a-faire",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-en-attente",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-en-cours",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-termine",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-valide",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "remove-equipe",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "reply-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "save-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-chef",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-comments",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-debut-eff",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-debut-prev",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-detail-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-detail-tache-tab",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-entites",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-equipe",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-exec",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-fin-eff",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-fin-prev",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-gantt",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-historique",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-info",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-pp",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-statut",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-assigne",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-dates-eff",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-dates-prev",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-info",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-priorite",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-statut-av",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-statut-exec",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-taches",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "create",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "delete",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "update",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "create",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "delete",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "update",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "profil",
        "actionKey": "change-password",
        "autorise": true
      },
      {
        "pageKey": "profil",
        "actionKey": "edit-info",
        "autorise": true
      },
      {
        "pageKey": "profil",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "projets",
        "actionKey": "create",
        "autorise": true
      },
      {
        "pageKey": "projets",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "projets",
        "actionKey": "view-detail",
        "autorise": true
      },
      {
        "pageKey": "tableau-de-bord",
        "actionKey": "view",
        "autorise": true
      }
    ]
  },
  {
    "localId": "cmn1x6y1m0pxv7mnengprq7d3",
    "login": null,
    "estSuperAdmin": false,
    "estActif": true,
    "localPersonneId": "cmn1wuwis0lxh7mnerl4jgx7b",
    "permissions": [
      {
        "pageKey": "comptes-acces",
        "actionKey": "change-password",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "create",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "manage-authz",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "suspend",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "add-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "add-equipe",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "create-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "delete",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "delete-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "delete-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-chef",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-debut-eff",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-debut-prev",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-fin-eff",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-fin-prev",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-statut",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-assigne",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-dates-eff",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-dates-prev",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-priorite",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-statut-av",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-statut-exec",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-a-faire",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-en-attente",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-en-cours",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-termine",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-valide",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "remove-equipe",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "reply-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "save-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-chef",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-comments",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-debut-eff",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-debut-prev",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-detail-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-detail-tache-tab",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-entites",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-equipe",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-exec",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-fin-eff",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-fin-prev",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-gantt",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-historique",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-info",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-pp",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-statut",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-assigne",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-dates-eff",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-dates-prev",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-info",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-priorite",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-statut-av",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-statut-exec",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-taches",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "create",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "delete",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "update",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "create",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "delete",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "update",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "profil",
        "actionKey": "change-password",
        "autorise": true
      },
      {
        "pageKey": "profil",
        "actionKey": "edit-info",
        "autorise": true
      },
      {
        "pageKey": "profil",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "projets",
        "actionKey": "create",
        "autorise": true
      },
      {
        "pageKey": "projets",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "projets",
        "actionKey": "view-detail",
        "autorise": true
      },
      {
        "pageKey": "tableau-de-bord",
        "actionKey": "view",
        "autorise": true
      }
    ]
  },
  {
    "localId": "cmn1x70ys0q0s7mnec18cjq19",
    "login": null,
    "estSuperAdmin": false,
    "estActif": true,
    "localPersonneId": "cmn1ww3ba0m0b7mneqhgxd4su",
    "permissions": [
      {
        "pageKey": "comptes-acces",
        "actionKey": "change-password",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "create",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "manage-authz",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "suspend",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "add-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "add-equipe",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "create-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "delete",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "delete-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "delete-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-chef",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-debut-eff",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-debut-prev",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-fin-eff",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-fin-prev",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-statut",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-assigne",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-dates-eff",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-dates-prev",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-priorite",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-statut-av",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-statut-exec",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-a-faire",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-en-attente",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-en-cours",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-termine",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-valide",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "remove-equipe",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "reply-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "save-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-chef",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-comments",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-debut-eff",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-debut-prev",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-detail-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-detail-tache-tab",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-entites",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-equipe",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-exec",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-fin-eff",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-fin-prev",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-gantt",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-historique",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-info",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-pp",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-statut",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-assigne",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-dates-eff",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-dates-prev",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-info",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-priorite",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-statut-av",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-statut-exec",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-taches",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "create",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "delete",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "update",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "create",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "delete",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "update",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "profil",
        "actionKey": "change-password",
        "autorise": true
      },
      {
        "pageKey": "profil",
        "actionKey": "edit-info",
        "autorise": true
      },
      {
        "pageKey": "profil",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "projets",
        "actionKey": "create",
        "autorise": true
      },
      {
        "pageKey": "projets",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "projets",
        "actionKey": "view-detail",
        "autorise": true
      },
      {
        "pageKey": "tableau-de-bord",
        "actionKey": "view",
        "autorise": true
      }
    ]
  },
  {
    "localId": "cmn1x73xx0q3p7mneh2z96qn1",
    "login": null,
    "estSuperAdmin": false,
    "estActif": true,
    "localPersonneId": "cmn1wx6i80m357mnedvy7c814",
    "permissions": [
      {
        "pageKey": "comptes-acces",
        "actionKey": "change-password",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "create",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "manage-authz",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "suspend",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "add-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "add-equipe",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "create-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "delete",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "delete-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "delete-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-chef",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-debut-eff",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-debut-prev",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-fin-eff",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-fin-prev",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-statut",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-assigne",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-dates-eff",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-dates-prev",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-priorite",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-statut-av",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-statut-exec",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-a-faire",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-en-attente",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-en-cours",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-termine",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-valide",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "remove-equipe",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "reply-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "save-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-chef",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-comments",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-debut-eff",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-debut-prev",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-detail-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-detail-tache-tab",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-entites",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-equipe",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-exec",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-fin-eff",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-fin-prev",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-gantt",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-historique",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-info",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-pp",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-statut",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-assigne",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-dates-eff",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-dates-prev",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-info",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-priorite",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-statut-av",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-statut-exec",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-taches",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "create",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "delete",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "update",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "create",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "delete",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "update",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "profil",
        "actionKey": "change-password",
        "autorise": true
      },
      {
        "pageKey": "profil",
        "actionKey": "edit-info",
        "autorise": true
      },
      {
        "pageKey": "profil",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "projets",
        "actionKey": "create",
        "autorise": true
      },
      {
        "pageKey": "projets",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "projets",
        "actionKey": "view-detail",
        "autorise": true
      },
      {
        "pageKey": "tableau-de-bord",
        "actionKey": "view",
        "autorise": true
      }
    ]
  },
  {
    "localId": "cmn1x770e0q6m7mnewumjbkgq",
    "login": null,
    "estSuperAdmin": false,
    "estActif": true,
    "localPersonneId": "cmn1wydab0m5z7mnex6txxjvz",
    "permissions": [
      {
        "pageKey": "comptes-acces",
        "actionKey": "change-password",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "create",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "manage-authz",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "suspend",
        "autorise": false
      },
      {
        "pageKey": "comptes-acces",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "add-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "add-equipe",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "create-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "delete",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "delete-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "delete-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-chef",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-debut-eff",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-debut-prev",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-fin-eff",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-fin-prev",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-statut",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-assigne",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-dates-eff",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-dates-prev",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-priorite",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-statut-av",
        "autorise": false
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "edit-tache-statut-exec",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-a-faire",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-en-attente",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-en-cours",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-termine",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "move-valide",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "remove-equipe",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "reply-comment",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "save-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-chef",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-comments",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-debut-eff",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-debut-prev",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-detail-tache",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-detail-tache-tab",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-entites",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-equipe",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-exec",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-fin-eff",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-fin-prev",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-gantt",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-historique",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-info",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-pp",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-statut",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-assigne",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-dates-eff",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-dates-prev",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-description",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-info",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-libelle",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-priorite",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-statut-av",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-tache-statut-exec",
        "autorise": true
      },
      {
        "pageKey": "detail-projet",
        "actionKey": "view-taches",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "create",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "delete",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "update",
        "autorise": true
      },
      {
        "pageKey": "entites",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "create",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "delete",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "update",
        "autorise": true
      },
      {
        "pageKey": "personnes",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "profil",
        "actionKey": "change-password",
        "autorise": true
      },
      {
        "pageKey": "profil",
        "actionKey": "edit-info",
        "autorise": true
      },
      {
        "pageKey": "profil",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "projets",
        "actionKey": "create",
        "autorise": true
      },
      {
        "pageKey": "projets",
        "actionKey": "view",
        "autorise": true
      },
      {
        "pageKey": "projets",
        "actionKey": "view-detail",
        "autorise": true
      },
      {
        "pageKey": "tableau-de-bord",
        "actionKey": "view",
        "autorise": true
      }
    ]
  }
];

const PROJETS = [
  {
    "localId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "Mise en place d'une plateforme de gestion des projets-taches PAPE-D PROJETS&TACHES: phase 1 - v1 fondation",
    "description": "Phase fondatrice de la plateforme : infrastructure technique, authentification, gestion des entités, personnes, comptes, projets, tâches (Kanban & Gantt), commentaires, historique, tableau de bord et calcul des risques.",
    "statut": "En cours",
    "etatAvancement": "en-avance",
    "localChefId": "cmmxckc4j00042pkw06iid9ra",
    "dateDebutPrevisionnelle": "2026-03-17T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-24T00:00:00.000Z",
    "dateDebutEffective": "2026-03-17T00:00:00.000Z",
    "dateFinEffective": null,
    "tauxAvancementReel": 97,
    "tauxAvancementAttendu": 68,
    "tauxAchevementReel": 93,
    "tauxAchevementAttendu": 80,
    "localEquipeIds": [
      "cmmxckc4j00042pkw06iid9ra"
    ]
  },
  {
    "localId": "cmn01zn81001r10k5n5cgkeot",
    "libelle": "Mise en place d'une plateforme de gestion des projets-taches PAPE-D PROJETS&TACHES: phase 2 - v1 affiner fondation",
    "description": "Consolidation de la fondation : amélioration de l'expérience utilisateur, gestion des parties prenantes, tâches périodiques, interface d'administration des permissions et édition des entités.",
    "statut": "En cours",
    "etatAvancement": "a-lheure",
    "localChefId": "cmmxckc4j00042pkw06iid9ra",
    "dateDebutPrevisionnelle": "2026-03-25T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-26T00:00:00.000Z",
    "dateDebutEffective": null,
    "dateFinEffective": null,
    "tauxAvancementReel": 9,
    "tauxAvancementAttendu": 0,
    "tauxAchevementReel": 0,
    "tauxAchevementAttendu": 0,
    "localEquipeIds": [
      "cmmxckc4j00042pkw06iid9ra"
    ]
  },
  {
    "localId": "cmn01zn92002910k5azo99fyw",
    "libelle": "Mise en place d'une plateforme de gestion des projets-taches PAPE-D PROJETS&TACHES: phase 3 - v1 fondation plus",
    "description": "Enrichissement de la plateforme : tableau de bord personnel, filtres avancés, recherche globale, sécurité (réinitialisation MDP), notifications in-app, historique projet, export PDF et jalons dans le Gantt.",
    "statut": "En cours",
    "etatAvancement": "a-lheure",
    "localChefId": "cmmxckc4j00042pkw06iid9ra",
    "dateDebutPrevisionnelle": "2026-03-27T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-28T00:00:00.000Z",
    "dateDebutEffective": null,
    "dateFinEffective": null,
    "tauxAvancementReel": 8,
    "tauxAvancementAttendu": 0,
    "tauxAchevementReel": 11,
    "tauxAchevementAttendu": 0,
    "localEquipeIds": [
      "cmmxckc4j00042pkw06iid9ra"
    ]
  },
  {
    "localId": "cmn01zna7002t10k594hk00xp",
    "libelle": "Mise en place d'une plateforme de gestion des projets-taches PAPE-D PROJETS&TACHES: Phase 4 - v2",
    "description": "Évolutions majeures de la plateforme vers la version 2 : notifications email, pièces jointes, sous-tâches hiérarchiques avancées, vue calendrier, rapports avancés, gestion budgétaire, dashboard personnalisable, PWA, API Swagger et multi-organisations.",
    "statut": "En démarrage",
    "etatAvancement": "a-lheure",
    "localChefId": "cmmxckc4j00042pkw06iid9ra",
    "dateDebutPrevisionnelle": "2026-03-29T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-04-11T00:00:00.000Z",
    "dateDebutEffective": null,
    "dateFinEffective": null,
    "tauxAvancementReel": 0,
    "tauxAvancementAttendu": 0,
    "tauxAchevementReel": 0,
    "tauxAchevementAttendu": 0,
    "localEquipeIds": []
  }
];

const TACHES = [
  {
    "localId": "cmn01zn4k000310k5ha5d5ipy",
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "Initialisation du projet Next.js 15 avec TypeScript",
    "description": "Mise en place du dépôt Git, configuration de Next.js 15 (App Router), TypeScript strict, ESLint, Prettier et structure de dossiers src/app.",
    "priorite": "Bloquant",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "Validé",
    "etatAvancement": "a-lheure",
    "progression": 100,
    "poidsPriorite": 3,
    "ordre": 1,
    "dateDebutPrevisionnelle": "2026-03-19T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-21T00:00:00.000Z",
    "dateDebutEffective": "2026-03-19T00:00:00.000Z",
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn4o000510k5khvk4kxf",
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "Configuration Prisma ORM + SQLite (dev) / PostgreSQL (prod)",
    "description": "Initialisation de Prisma, datasource SQLite pour le développement local et PostgreSQL pour Railway en production. Script de build Railway pour patcher le schema.",
    "priorite": "Bloquant",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "Validé",
    "etatAvancement": "a-lheure",
    "progression": 100,
    "poidsPriorite": 3,
    "ordre": 2,
    "dateDebutPrevisionnelle": "2026-03-19T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-21T00:00:00.000Z",
    "dateDebutEffective": "2026-03-19T00:00:00.000Z",
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn4t000710k5l68a5wrw",
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "Modèle de données fondateur (Entite, PersonneRessource, Projet, Tache)",
    "description": "Définition des modèles Prisma principaux : Entite, PersonneRessource (avec estChefProjet), Projet, Tache avec tous leurs champs, relations et mappings de tables.",
    "priorite": "Bloquant",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "Validé",
    "etatAvancement": "a-lheure",
    "progression": 100,
    "poidsPriorite": 3,
    "ordre": 3,
    "dateDebutPrevisionnelle": "2026-03-21T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-21T00:00:00.000Z",
    "dateDebutEffective": "2026-03-21T00:00:00.000Z",
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn4y000910k5murv8wq4",
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "Système d'authentification par cookie HTTP-only",
    "description": "Création du modèle SessionAuth, hash bcrypt des mots de passe, API /api/auth/login et /api/auth/logout, cookie pape_session sécurisé (httpOnly, sameSite=strict).",
    "priorite": "Bloquant",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "Validé",
    "etatAvancement": "a-lheure",
    "progression": 100,
    "poidsPriorite": 3,
    "ordre": 4,
    "dateDebutPrevisionnelle": "2026-03-22T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-24T00:00:00.000Z",
    "dateDebutEffective": "2026-03-22T00:00:00.000Z",
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn53000b10k5fvyamrbw",
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "Middleware Edge pour protection des routes API",
    "description": "middleware.ts à la racine : intercepte toutes les routes /api/* (sauf /api/auth/*) et retourne 401 si le cookie de session est absent.",
    "priorite": "Bloquant",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "Validé",
    "etatAvancement": "a-lheure",
    "progression": 100,
    "poidsPriorite": 3,
    "ordre": 5,
    "dateDebutPrevisionnelle": "2026-03-20T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-20T00:00:00.000Z",
    "dateDebutEffective": "2026-03-20T00:00:00.000Z",
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn58000d10k5bs9sefgx",
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "Helpers requireAuth() et canDo() pour les API routes",
    "description": "lib/require-auth.ts : requireAuth() valide la session et charge l'utilisateur, canDo() vérifie les permissions par page/action, forbidden() retourne 403.",
    "priorite": "Bloquant",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "Validé",
    "etatAvancement": "a-lheure",
    "progression": 100,
    "poidsPriorite": 3,
    "ordre": 6,
    "dateDebutPrevisionnelle": "2026-03-18T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-19T00:00:00.000Z",
    "dateDebutEffective": "2026-03-18T00:00:00.000Z",
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn5e000f10k5dosx6enu",
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "Modèle de permissions par page/action (PermissionPageAction)",
    "description": "Table permissions_page_action avec compteId, pageKey, actionKey, autorise. Interface d'administration pour gérer les autorisations par compte.",
    "priorite": "Critique",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "Validé",
    "etatAvancement": "a-lheure",
    "progression": 100,
    "poidsPriorite": 2,
    "ordre": 7,
    "dateDebutPrevisionnelle": "2026-03-19T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-20T00:00:00.000Z",
    "dateDebutEffective": "2026-03-19T00:00:00.000Z",
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn5k000h10k53gnh4c3v",
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "Super-admin seed idempotent au démarrage Railway",
    "description": "Script scripts/railway-start.js : crée ou met à jour le compte super-admin depuis les variables d'environnement SUPER_ADMIN_* de façon idempotente.",
    "priorite": "Critique",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "Validé",
    "etatAvancement": "a-lheure",
    "progression": 100,
    "poidsPriorite": 2,
    "ordre": 8,
    "dateDebutPrevisionnelle": "2026-03-18T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-19T00:00:00.000Z",
    "dateDebutEffective": "2026-03-18T00:00:00.000Z",
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn5o000j10k5abmdtg3l",
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "CRUD Entités (API + page /entites)",
    "description": "API /api/entites (GET/POST) et /api/entites/[id] (GET/PUT/DELETE). Page front-end avec liste, formulaire de création/édition et suppression.",
    "priorite": "Critique",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "Validé",
    "etatAvancement": "a-lheure",
    "progression": 100,
    "poidsPriorite": 2,
    "ordre": 9,
    "dateDebutPrevisionnelle": "2026-03-18T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-19T00:00:00.000Z",
    "dateDebutEffective": "2026-03-18T00:00:00.000Z",
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn5t000l10k567xjbcx7",
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "CRUD Personnes ressources (API + page /personnes)",
    "description": "API /api/personnes (GET/POST) et /api/personnes/[id] (GET/PUT/DELETE). Champs : nom, prénoms, téléphone, email, fonction, entité, estChefProjet. Validation unicité email/téléphone.",
    "priorite": "Critique",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "Validé",
    "etatAvancement": "a-lheure",
    "progression": 100,
    "poidsPriorite": 2,
    "ordre": 10,
    "dateDebutPrevisionnelle": "2026-03-20T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-20T00:00:00.000Z",
    "dateDebutEffective": "2026-03-20T00:00:00.000Z",
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn5x000n10k52zlew9w5",
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "CRUD Comptes d'accès (API + page /comptes-acces)",
    "description": "API /api/comptes-acces (GET/POST) et /api/comptes-acces/[id] (GET/PUT/DELETE). Création de compte lié à une personne, login par email ou téléphone (10 chiffres).",
    "priorite": "Critique",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "Validé",
    "etatAvancement": "a-lheure",
    "progression": 100,
    "poidsPriorite": 2,
    "ordre": 11,
    "dateDebutPrevisionnelle": "2026-03-23T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-24T00:00:00.000Z",
    "dateDebutEffective": "2026-03-23T00:00:00.000Z",
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn60000p10k57cv4zyid",
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "Gestion des autorisations par compte (/comptes-acces/autorisations/[id])",
    "description": "Page dédiée à la gestion des permissions d'un compte. Matrice de cases à cocher par page/action. API /api/comptes-acces/[id]/autorisations.",
    "priorite": "Critique",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "Validé",
    "etatAvancement": "a-lheure",
    "progression": 100,
    "poidsPriorite": 2,
    "ordre": 12,
    "dateDebutPrevisionnelle": "2026-03-19T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-21T00:00:00.000Z",
    "dateDebutEffective": "2026-03-19T00:00:00.000Z",
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn64000r10k5yypr50q8",
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "CRUD Projets (API + page /projets)",
    "description": "API /api/projets (GET/POST) et /api/projets/[id] (GET/PUT/DELETE). Champs : libellé, description, statut, chefProjet, dates. Liste paginée avec indicateurs de progression.",
    "priorite": "Critique",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "Validé",
    "etatAvancement": "a-lheure",
    "progression": 100,
    "poidsPriorite": 2,
    "ordre": 13,
    "dateDebutPrevisionnelle": "2026-03-20T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-21T00:00:00.000Z",
    "dateDebutEffective": "2026-03-20T00:00:00.000Z",
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn67000t10k5nhld9z9v",
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "Page détail projet avec onglets (Backlog, Kanban, Gantt, Équipe, Infos)",
    "description": "app/projets/[id]/page.tsx : onglets Backlog, Kanban, Gantt, Équipe du projet et Informations générales. Navigation et gestion d'état centralisée.",
    "priorite": "Critique",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "Validé",
    "etatAvancement": "a-lheure",
    "progression": 100,
    "poidsPriorite": 2,
    "ordre": 14,
    "dateDebutPrevisionnelle": "2026-03-17T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-19T00:00:00.000Z",
    "dateDebutEffective": "2026-03-17T00:00:00.000Z",
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn6b000v10k5688yt9st",
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "Backlog des tâches : liste, création, priorités",
    "description": "Onglet Backlog : liste des tâches triées par ordre, badges de priorité (Bloquant/Critique/Normal), formulaire de création rapide, glisser-déposer pour réordonner.",
    "priorite": "Critique",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "Validé",
    "etatAvancement": "a-lheure",
    "progression": 100,
    "poidsPriorite": 2,
    "ordre": 15,
    "dateDebutPrevisionnelle": "2026-03-19T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-20T00:00:00.000Z",
    "dateDebutEffective": "2026-03-19T00:00:00.000Z",
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn6g000x10k5t401g9sc",
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "Vue Kanban des tâches par statut",
    "description": "Onglet Kanban : colonnes À planifier, A faire, En cours, Terminé, Validé. Cartes déplaçables entre colonnes avec mise à jour du statut via API.",
    "priorite": "Critique",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "Validé",
    "etatAvancement": "a-lheure",
    "progression": 100,
    "poidsPriorite": 2,
    "ordre": 16,
    "dateDebutPrevisionnelle": "2026-03-18T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-20T00:00:00.000Z",
    "dateDebutEffective": "2026-03-18T00:00:00.000Z",
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn6j000z10k51y5j1dp5",
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "Diagramme de Gantt des tâches",
    "description": "Onglet Gantt : visualisation temporelle des tâches avec barres de progression, composant ProjectGantt. Affichage des dates prévisionnelles et effectives.",
    "priorite": "Critique",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "Validé",
    "etatAvancement": "a-lheure",
    "progression": 100,
    "poidsPriorite": 2,
    "ordre": 17,
    "dateDebutPrevisionnelle": "2026-03-17T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-18T00:00:00.000Z",
    "dateDebutEffective": "2026-03-17T00:00:00.000Z",
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn6n001110k514rk6otz",
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "Panel de détail d'une tâche (slide-over)",
    "description": "Panneau latéral pour voir/éditer une tâche : libellé, description, priorité, statut, assignation, dates. Onglets Détails / Commentaires / Historique.",
    "priorite": "Critique",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "Validé",
    "etatAvancement": "a-lheure",
    "progression": 100,
    "poidsPriorite": 2,
    "ordre": 18,
    "dateDebutPrevisionnelle": "2026-03-21T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-22T00:00:00.000Z",
    "dateDebutEffective": "2026-03-21T00:00:00.000Z",
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn6q001310k5mnpx3vhr",
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "Assignation de tâche + ajout auto à l'équipe projet",
    "description": "Lors de l'assignation d'une tâche à une personne, celle-ci est automatiquement ajoutée à l'équipe du projet (equipeProjet) si elle n'en fait pas encore partie.",
    "priorite": "Critique",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "Validé",
    "etatAvancement": "a-lheure",
    "progression": 100,
    "poidsPriorite": 2,
    "ordre": 19,
    "dateDebutPrevisionnelle": "2026-03-21T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-22T00:00:00.000Z",
    "dateDebutEffective": "2026-03-21T00:00:00.000Z",
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn6v001510k538o4xrtb",
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "Remplissage automatique des dates effectives selon le statut",
    "description": "Quand une tâche passe au statut 'En cours', dateDebutEffective est remplie automatiquement. Quand elle passe à 'Terminé', dateFinEffective est remplie.",
    "priorite": "Normal",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "Validé",
    "etatAvancement": "a-lheure",
    "progression": 100,
    "poidsPriorite": 1,
    "ordre": 20,
    "dateDebutPrevisionnelle": "2026-03-20T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-21T00:00:00.000Z",
    "dateDebutEffective": "2026-03-20T00:00:00.000Z",
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn6y001710k5ney1gz0b",
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "Commentaires sur les tâches (API + UI)",
    "description": "Modèle CommentaireTache avec support de réponses imbriquées (parentId). API /api/taches/[id]/commentaires. Affichage dans l'onglet Commentaires du panel.",
    "priorite": "Critique",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "Validé",
    "etatAvancement": "a-lheure",
    "progression": 100,
    "poidsPriorite": 2,
    "ordre": 21,
    "dateDebutPrevisionnelle": "2026-03-17T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-19T00:00:00.000Z",
    "dateDebutEffective": "2026-03-17T00:00:00.000Z",
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn71001910k5xhk0idss",
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "Historique d'activité des tâches (ActiviteTache)",
    "description": "Modèle ActiviteTache : enregistre création, changements de statut et réassignations. API /api/taches/[id]/activites. Timeline dans l'onglet Historique du panel.",
    "priorite": "Critique",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "Validé",
    "etatAvancement": "a-lheure",
    "progression": 100,
    "poidsPriorite": 2,
    "ordre": 22,
    "dateDebutPrevisionnelle": "2026-03-20T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-22T00:00:00.000Z",
    "dateDebutEffective": "2026-03-20T00:00:00.000Z",
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn75001b10k5lmdoji2q",
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "Tableau de bord (/tableau-de-bord)",
    "description": "Page synthèse : projets actifs avec barre de progression, distribution des tâches par statut, projets en retard, indicateurs de risque calculés et persistés.",
    "priorite": "Critique",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "Validé",
    "etatAvancement": "a-lheure",
    "progression": 100,
    "poidsPriorite": 2,
    "ordre": 23,
    "dateDebutPrevisionnelle": "2026-03-22T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-23T00:00:00.000Z",
    "dateDebutEffective": "2026-03-22T00:00:00.000Z",
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn79001d10k5mwturuvy",
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "Calcul et persistance des scores de risque projet",
    "description": "Calcul de 5 indicateurs (retard, hors-délai, progression, suspendu, global) depuis les données de tâches. Upsert via /api/projets/[id]/risques avec clé unique [projetId, libelle].",
    "priorite": "Critique",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "Validé",
    "etatAvancement": "a-lheure",
    "progression": 100,
    "poidsPriorite": 2,
    "ordre": 24,
    "dateDebutPrevisionnelle": "2026-03-19T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-21T00:00:00.000Z",
    "dateDebutEffective": "2026-03-19T00:00:00.000Z",
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn7d001f10k5d6f0yrg7",
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "Gestion de l'équipe projet (onglet Équipe)",
    "description": "Onglet Équipe du détail projet : liste des membres, ajout/retrait manuel, affichage du chef de projet. Les assignations de tâches alimentent aussi l'équipe.",
    "priorite": "Normal",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "Validé",
    "etatAvancement": "a-lheure",
    "progression": 100,
    "poidsPriorite": 1,
    "ordre": 25,
    "dateDebutPrevisionnelle": "2026-03-19T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-19T00:00:00.000Z",
    "dateDebutEffective": "2026-03-19T00:00:00.000Z",
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn7g001h10k59n0yc03s",
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "Navigation principale et composant PageHeader",
    "description": "Navigation.tsx : menu latéral avec liens vers toutes les sections, indicateur de section active, bouton de déconnexion. PageHeader.tsx : en-tête de page réutilisable.",
    "priorite": "Normal",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "Validé",
    "etatAvancement": "a-lheure",
    "progression": 100,
    "poidsPriorite": 1,
    "ordre": 26,
    "dateDebutPrevisionnelle": "2026-03-21T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-23T00:00:00.000Z",
    "dateDebutEffective": "2026-03-21T00:00:00.000Z",
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn7k001j10k5pwogq6vu",
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "Déploiement Railway (build + runtime idempotents)",
    "description": "Scripts scripts/railway-build.js et scripts/railway-start.js. Gestion du patch SQLite→PostgreSQL, prisma db push, seed super-admin. Variables d'environnement Railway documentées.",
    "priorite": "Critique",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "Validé",
    "etatAvancement": "a-lheure",
    "progression": 100,
    "poidsPriorite": 2,
    "ordre": 27,
    "dateDebutPrevisionnelle": "2026-03-19T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-21T00:00:00.000Z",
    "dateDebutEffective": "2026-03-19T00:00:00.000Z",
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn7o001l10k57wcticds",
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "Login par email ou numéro de téléphone (10 chiffres)",
    "description": "L'identifiant de connexion accepte soit l'email, soit le numéro de téléphone à 10 chiffres de la personne ressource liée au compte. Validation côté serveur.",
    "priorite": "Normal",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "Validé",
    "etatAvancement": "a-lheure",
    "progression": 100,
    "poidsPriorite": 1,
    "ordre": 28,
    "dateDebutPrevisionnelle": "2026-03-19T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-19T00:00:00.000Z",
    "dateDebutEffective": "2026-03-19T00:00:00.000Z",
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn7r001n10k5n0glscwa",
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "Sous-tâches en checklist avec délai et assignation",
    "description": "Modèle SousTache : libellé, assigneAId (optionnel), dateEcheance (optionnelle), estCochee. Visibilité : le propriétaire de la tâche voit toutes les sous-tâches, l'assigné ne voit que les siennes. Auto-progression : première case cochée → tâche 'En cours', toutes cochées → tâche 'Terminé'.",
    "priorite": "Critique",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "En cours",
    "etatAvancement": "a-lheure",
    "progression": 50,
    "poidsPriorite": 2,
    "ordre": 29,
    "dateDebutPrevisionnelle": null,
    "dateFinPrevisionnelle": null,
    "dateDebutEffective": "2026-03-22T09:17:01.979Z",
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn7w001p10k54xreq529",
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "Jalons de projet avec livrables nominatifs",
    "description": "Modèle JalonProjet : titre, description, datePrevisionnelle, dateEffective, statut calculé (À venir / Atteint / En retard). Livrables nominatifs liés aux jalons ET aux tâches (modèle Livrable). Affichage dans la page projet.",
    "priorite": "Critique",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "En cours",
    "etatAvancement": "a-lheure",
    "progression": 50,
    "poidsPriorite": 2,
    "ordre": 30,
    "dateDebutPrevisionnelle": null,
    "dateFinPrevisionnelle": null,
    "dateDebutEffective": "2026-03-22T09:17:13.696Z",
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn86001t10k59iux9y43",
    "localProjetId": "cmn01zn81001r10k5n5cgkeot",
    "libelle": "Interface d'édition du flag estChefProjet sur une personne",
    "description": "Ajouter dans la page ou le formulaire d'édition d'une personne ressource la possibilité de cocher/décocher 'Est chef de projet', avec persistance via l'API PUT /api/personnes/[id].",
    "priorite": "Normal",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "À planifier",
    "etatAvancement": "a-lheure",
    "progression": 0,
    "poidsPriorite": 1,
    "ordre": 1,
    "dateDebutPrevisionnelle": "2026-03-25T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-25T00:00:00.000Z",
    "dateDebutEffective": null,
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn8a001v10k528lj02q3",
    "localProjetId": "cmn01zn81001r10k5n5cgkeot",
    "libelle": "CRUD Parties prenantes (API + UI dans le détail projet)",
    "description": "Modèle PartiePrenante déjà en base. Créer les API routes manquantes et l'interface dans l'onglet Informations du projet pour gérer les parties prenantes (ajout, édition, suppression).",
    "priorite": "Normal",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "À planifier",
    "etatAvancement": "a-lheure",
    "progression": 0,
    "poidsPriorite": 1,
    "ordre": 2,
    "dateDebutPrevisionnelle": "2026-03-25T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-25T00:00:00.000Z",
    "dateDebutEffective": null,
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn8d001x10k5k4gots1e",
    "localProjetId": "cmn01zn81001r10k5n5cgkeot",
    "libelle": "Module tâches périodiques (API + page /taches-periodiques)",
    "description": "Modèle TachePerodique déjà en base. Créer les API routes CRUD et la page de gestion des tâches périodiques avec périodicité, responsable, entité d'exécution et suivi du statut.",
    "priorite": "Normal",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "À planifier",
    "etatAvancement": "a-lheure",
    "progression": 0,
    "poidsPriorite": 1,
    "ordre": 3,
    "dateDebutPrevisionnelle": "2026-03-25T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-26T00:00:00.000Z",
    "dateDebutEffective": null,
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn8h001z10k5yotbpbiv",
    "localProjetId": "cmn01zn81001r10k5n5cgkeot",
    "libelle": "UI adaptive selon les permissions (masquer sections non autorisées)",
    "description": "Côté front-end, vérifier les permissions de l'utilisateur connecté et masquer/désactiver les boutons et sections auxquels il n'a pas accès (ex: bouton Créer projet, onglet Équipe).",
    "priorite": "Critique",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "En cours",
    "etatAvancement": "a-lheure",
    "progression": 50,
    "poidsPriorite": 2,
    "ordre": 4,
    "dateDebutPrevisionnelle": "2026-03-25T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-26T00:00:00.000Z",
    "dateDebutEffective": null,
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn8l002110k5i1p65tgw",
    "localProjetId": "cmn01zn81001r10k5n5cgkeot",
    "libelle": "Page profil utilisateur (modifier son mot de passe)",
    "description": "Page /profil permettant à l'utilisateur connecté de modifier son mot de passe. Workflow doitChangerMdp : redirection forcée à la première connexion.",
    "priorite": "Critique",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "À planifier",
    "etatAvancement": "a-lheure",
    "progression": 0,
    "poidsPriorite": 2,
    "ordre": 5,
    "dateDebutPrevisionnelle": "2026-03-25T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-26T00:00:00.000Z",
    "dateDebutEffective": null,
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn8p002310k5xj3uc2lo",
    "localProjetId": "cmn01zn81001r10k5n5cgkeot",
    "libelle": "Édition des entités depuis la page /entites",
    "description": "Formulaire d'édition inline ou en modal pour modifier le libellé et la tutelle d'une entité existante. API PUT /api/entites/[id] (à créer).",
    "priorite": "Normal",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "À planifier",
    "etatAvancement": "a-lheure",
    "progression": 0,
    "poidsPriorite": 1,
    "ordre": 6,
    "dateDebutPrevisionnelle": "2026-03-25T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-26T00:00:00.000Z",
    "dateDebutEffective": null,
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn8t002510k5zcjq8rxd",
    "localProjetId": "cmn01zn81001r10k5n5cgkeot",
    "libelle": "Désactivation/réactivation de comptes d'accès",
    "description": "Ajouter un bouton Désactiver/Réactiver sur la page des comptes d'accès. Un compte désactivé (estActif=false) ne peut plus se connecter. API PATCH /api/comptes-acces/[id]/statut.",
    "priorite": "Critique",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "À planifier",
    "etatAvancement": "a-lheure",
    "progression": 0,
    "poidsPriorite": 2,
    "ordre": 7,
    "dateDebutPrevisionnelle": "2026-03-25T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-26T00:00:00.000Z",
    "dateDebutEffective": null,
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn8x002710k506yi9zdi",
    "localProjetId": "cmn01zn81001r10k5n5cgkeot",
    "libelle": "Réordonnancement drag-and-drop du backlog",
    "description": "Permettre le réordonnancement des tâches dans le Backlog par glisser-déposer avec persistance du champ 'ordre' via appel API PATCH bulk.",
    "priorite": "Normal",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "À planifier",
    "etatAvancement": "a-lheure",
    "progression": 0,
    "poidsPriorite": 1,
    "ordre": 8,
    "dateDebutPrevisionnelle": "2026-03-25T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-26T00:00:00.000Z",
    "dateDebutEffective": null,
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn97002b10k5ul8nge8l",
    "localProjetId": "cmn01zn92002910k5azo99fyw",
    "libelle": "Vue 'Mes tâches' dans le tableau de bord",
    "description": "Section personnalisée dans le tableau de bord affichant uniquement les tâches assignées à l'utilisateur connecté, triées par priorité et date d'échéance.",
    "priorite": "Critique",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "À planifier",
    "etatAvancement": "a-lheure",
    "progression": 0,
    "poidsPriorite": 2,
    "ordre": 1,
    "dateDebutPrevisionnelle": "2026-03-27T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-27T00:00:00.000Z",
    "dateDebutEffective": null,
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn9b002d10k5om5dbz92",
    "localProjetId": "cmn01zn92002910k5azo99fyw",
    "libelle": "Filtres sur la page projets (statut, chef de projet, période)",
    "description": "Ajouter des filtres sur la liste des projets : par statut (En démarrage, En cours, Terminé…), par chef de projet, par fourchette de dates.",
    "priorite": "Normal",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "À planifier",
    "etatAvancement": "a-lheure",
    "progression": 0,
    "poidsPriorite": 1,
    "ordre": 2,
    "dateDebutPrevisionnelle": "2026-03-27T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-27T00:00:00.000Z",
    "dateDebutEffective": null,
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn9f002f10k5c0rf38o1",
    "localProjetId": "cmn01zn92002910k5azo99fyw",
    "libelle": "Filtres dans le Backlog et le Kanban (priorité, assigné, statut)",
    "description": "Barre de filtres dans les onglets Backlog et Kanban du détail projet : filtrer par priorité, assigné, statut. Filtre persisté en mémoire le temps de la session.",
    "priorite": "Normal",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "Terminé",
    "etatAvancement": "a-lheure",
    "progression": 90,
    "poidsPriorite": 1,
    "ordre": 3,
    "dateDebutPrevisionnelle": "2026-03-27T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-27T00:00:00.000Z",
    "dateDebutEffective": null,
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn9j002h10k5ttbl9x5m",
    "localProjetId": "cmn01zn92002910k5azo99fyw",
    "libelle": "Recherche globale (projets, tâches, personnes)",
    "description": "Barre de recherche dans la navigation principale retournant des résultats multi-entités : projets, tâches, personnes ressources. Raccourci clavier Ctrl+K.",
    "priorite": "Normal",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "À planifier",
    "etatAvancement": "a-lheure",
    "progression": 0,
    "poidsPriorite": 1,
    "ordre": 4,
    "dateDebutPrevisionnelle": "2026-03-27T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-28T00:00:00.000Z",
    "dateDebutEffective": null,
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn9o002j10k5wihwygqp",
    "localProjetId": "cmn01zn92002910k5azo99fyw",
    "libelle": "Réinitialisation du mot de passe par l'admin",
    "description": "Action admin sur un compte : générer un mot de passe temporaire et mettre doitChangerMdp=true, forçant l'utilisateur à changer son mot de passe à la prochaine connexion.",
    "priorite": "Critique",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "À planifier",
    "etatAvancement": "a-lheure",
    "progression": 0,
    "poidsPriorite": 2,
    "ordre": 5,
    "dateDebutPrevisionnelle": "2026-03-27T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-28T00:00:00.000Z",
    "dateDebutEffective": null,
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn9s002l10k5qnouwrek",
    "localProjetId": "cmn01zn92002910k5azo99fyw",
    "libelle": "Notifications in-app (assignation, commentaire, changement statut)",
    "description": "Système de notifications internes : création d'un modèle Notification, endpoint SSE ou polling, cloche dans la navigation avec badge de comptage non-lus.",
    "priorite": "Normal",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "À planifier",
    "etatAvancement": "a-lheure",
    "progression": 0,
    "poidsPriorite": 1,
    "ordre": 6,
    "dateDebutPrevisionnelle": "2026-03-27T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-27T00:00:00.000Z",
    "dateDebutEffective": null,
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn9w002n10k529lp2hz0",
    "localProjetId": "cmn01zn92002910k5azo99fyw",
    "libelle": "Historique des modifications du projet (journal)",
    "description": "Enregistrement des événements projet : changement de statut, ajout/retrait de membres, modification des informations générales. Affichage dans un onglet Journal du détail projet.",
    "priorite": "Normal",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "À planifier",
    "etatAvancement": "a-lheure",
    "progression": 0,
    "poidsPriorite": 1,
    "ordre": 7,
    "dateDebutPrevisionnelle": "2026-03-27T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-27T00:00:00.000Z",
    "dateDebutEffective": null,
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zn9z002p10k5mtzq1ujv",
    "localProjetId": "cmn01zn92002910k5azo99fyw",
    "libelle": "Export PDF du rapport de projet",
    "description": "Bouton 'Exporter PDF' dans le détail projet générant un rapport avec informations générales, liste des tâches, équipe, jalons et indicateurs de risque.",
    "priorite": "Normal",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "À planifier",
    "etatAvancement": "a-lheure",
    "progression": 0,
    "poidsPriorite": 1,
    "ordre": 8,
    "dateDebutPrevisionnelle": "2026-03-27T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-27T00:00:00.000Z",
    "dateDebutEffective": null,
    "dateFinEffective": null
  },
  {
    "localId": "cmn01zna2002r10k59zr34svk",
    "localProjetId": "cmn01zn92002910k5azo99fyw",
    "libelle": "Affichage des jalons dans le diagramme de Gantt",
    "description": "Intégrer les jalons de projet (JalonProjet) dans la vue Gantt comme marqueurs de point-dans-le-temps distincts des barres de tâches, avec indicateur de statut coloré.",
    "priorite": "Normal",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "À planifier",
    "etatAvancement": "a-lheure",
    "progression": 0,
    "poidsPriorite": 1,
    "ordre": 9,
    "dateDebutPrevisionnelle": "2026-03-27T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-27T00:00:00.000Z",
    "dateDebutEffective": null,
    "dateFinEffective": null
  },
  {
    "localId": "cmn01znac002v10k5hndqshal",
    "localProjetId": "cmn01zna7002t10k594hk00xp",
    "libelle": "Notifications par email (assignation, rappels d'échéance)",
    "description": "Envoi d'emails transactionnels via SMTP/SendGrid : notification d'assignation à une tâche, rappel J-1 avant échéance. Configuration des préférences par utilisateur.",
    "priorite": "Normal",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "À planifier",
    "etatAvancement": "a-lheure",
    "progression": 0,
    "poidsPriorite": 1,
    "ordre": 1,
    "dateDebutPrevisionnelle": "2026-04-03T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-04-05T00:00:00.000Z",
    "dateDebutEffective": null,
    "dateFinEffective": null
  },
  {
    "localId": "cmn01znag002x10k58cp9zxd8",
    "localProjetId": "cmn01zna7002t10k594hk00xp",
    "libelle": "Pièces jointes sur tâches et commentaires",
    "description": "Upload de fichiers associés aux tâches et commentaires. Stockage S3/R2 ou équivalent. Modèle PieceJointe avec tacheId ou commentaireId, taille, type MIME, URL.",
    "priorite": "Normal",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "À planifier",
    "etatAvancement": "a-lheure",
    "progression": 0,
    "poidsPriorite": 1,
    "ordre": 2,
    "dateDebutPrevisionnelle": "2026-04-10T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-04-11T00:00:00.000Z",
    "dateDebutEffective": null,
    "dateFinEffective": null
  },
  {
    "localId": "cmn01znak002z10k59iusq5xc",
    "localProjetId": "cmn01zna7002t10k594hk00xp",
    "libelle": "Sous-tâches hiérarchiques V2 (tâches enfants complètes)",
    "description": "Extension au-delà des checklists : sous-tâches avec leur propre assignation, priorité, dates, statut Kanban et intégration dans le Gantt. Profondeur 1 niveau.",
    "priorite": "Normal",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "À planifier",
    "etatAvancement": "a-lheure",
    "progression": 0,
    "poidsPriorite": 1,
    "ordre": 3,
    "dateDebutPrevisionnelle": "2026-04-10T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-04-10T00:00:00.000Z",
    "dateDebutEffective": null,
    "dateFinEffective": null
  },
  {
    "localId": "cmn01znao003110k5t8hhrnvc",
    "localProjetId": "cmn01zna7002t10k594hk00xp",
    "libelle": "Vue calendrier des tâches et jalons",
    "description": "Vue calendrier mensuelle/hebdomadaire affichant les tâches (par date d'échéance) et les jalons. Navigation temporelle, drag-and-drop pour modifier les dates.",
    "priorite": "Normal",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "À planifier",
    "etatAvancement": "a-lheure",
    "progression": 0,
    "poidsPriorite": 1,
    "ordre": 4,
    "dateDebutPrevisionnelle": "2026-03-30T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-03-30T00:00:00.000Z",
    "dateDebutEffective": null,
    "dateFinEffective": null
  },
  {
    "localId": "cmn01znau003310k5pnu2q4fk",
    "localProjetId": "cmn01zna7002t10k594hk00xp",
    "libelle": "Rapports avancés (burndown, vélocité, taux de complétion)",
    "description": "Section Rapports avec graphiques : burndown chart, vélocité de l'équipe, taux de complétion par période. Export CSV des données.",
    "priorite": "Normal",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "À planifier",
    "etatAvancement": "a-lheure",
    "progression": 0,
    "poidsPriorite": 1,
    "ordre": 5,
    "dateDebutPrevisionnelle": "2026-04-01T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-04-01T00:00:00.000Z",
    "dateDebutEffective": null,
    "dateFinEffective": null
  },
  {
    "localId": "cmn01znaz003510k5nzja7gj0",
    "localProjetId": "cmn01zna7002t10k594hk00xp",
    "libelle": "Gestion budgétaire des projets",
    "description": "Champs budget alloué et budget consommé sur les projets. Possibilité de ventiler le budget par tâche ou phase. Indicateurs d'écart budgétaire dans le tableau de bord.",
    "priorite": "Normal",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "À planifier",
    "etatAvancement": "a-lheure",
    "progression": 0,
    "poidsPriorite": 1,
    "ordre": 6,
    "dateDebutPrevisionnelle": "2026-04-04T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-04-05T00:00:00.000Z",
    "dateDebutEffective": null,
    "dateFinEffective": null
  },
  {
    "localId": "cmn01znb6003710k5qfrnpssd",
    "localProjetId": "cmn01zna7002t10k594hk00xp",
    "libelle": "Dashboard personnalisable (widgets drag-and-drop)",
    "description": "Permettre à chaque utilisateur de personnaliser son tableau de bord en ajoutant, supprimant et réorganisant des widgets (mes tâches, projets actifs, indicateurs, etc.).",
    "priorite": "Normal",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "À planifier",
    "etatAvancement": "a-lheure",
    "progression": 0,
    "poidsPriorite": 1,
    "ordre": 7,
    "dateDebutPrevisionnelle": "2026-03-31T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-04-01T00:00:00.000Z",
    "dateDebutEffective": null,
    "dateFinEffective": null
  },
  {
    "localId": "cmn01znba003910k5aacua5aa",
    "localProjetId": "cmn01zna7002t10k594hk00xp",
    "libelle": "PWA / expérience mobile optimisée",
    "description": "Transformer la plateforme en Progressive Web App : manifest, service worker, expérience hors-ligne basique, icônes, écran de démarrage. Interface responsive mobile-first.",
    "priorite": "Normal",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "À planifier",
    "etatAvancement": "a-lheure",
    "progression": 0,
    "poidsPriorite": 1,
    "ordre": 8,
    "dateDebutPrevisionnelle": "2026-04-06T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-04-06T00:00:00.000Z",
    "dateDebutEffective": null,
    "dateFinEffective": null
  },
  {
    "localId": "cmn01znbe003b10k5w03fzjop",
    "localProjetId": "cmn01zna7002t10k594hk00xp",
    "libelle": "Documentation API Swagger / OpenAPI",
    "description": "Génération automatique de la documentation OpenAPI à partir des routes Next.js. Interface Swagger UI accessible à /api/docs pour les développeurs.",
    "priorite": "Normal",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "À planifier",
    "etatAvancement": "a-lheure",
    "progression": 0,
    "poidsPriorite": 1,
    "ordre": 9,
    "dateDebutPrevisionnelle": "2026-04-06T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-04-06T00:00:00.000Z",
    "dateDebutEffective": null,
    "dateFinEffective": null
  },
  {
    "localId": "cmn01znbj003d10k5xsc4kljw",
    "localProjetId": "cmn01zna7002t10k594hk00xp",
    "libelle": "Support multi-organisations (tenants)",
    "description": "Isolation des données par organisation : modèle Organisation, clé étrangère sur toutes les entités, sous-domaine ou path-based routing par tenant.",
    "priorite": "Normal",
    "localAssigneId": "cmmxckc4j00042pkw06iid9ra",
    "statut": "À planifier",
    "etatAvancement": "a-lheure",
    "progression": 0,
    "poidsPriorite": 1,
    "ordre": 10,
    "dateDebutPrevisionnelle": "2026-04-10T00:00:00.000Z",
    "dateFinPrevisionnelle": "2026-04-10T00:00:00.000Z",
    "dateDebutEffective": null,
    "dateFinEffective": null
  }
];

const RISQUES = [
  {
    "localProjetId": "cmn01zna7002t10k594hk00xp",
    "libelle": "Retard",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zna7002t10k594hk00xp",
    "libelle": "Hors délai",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zna7002t10k594hk00xp",
    "libelle": "Progression faible",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zna7002t10k594hk00xp",
    "libelle": "Suspendu",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zna7002t10k594hk00xp",
    "libelle": "Global",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zn92002910k5azo99fyw",
    "libelle": "Retard",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zn92002910k5azo99fyw",
    "libelle": "Hors délai",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zn92002910k5azo99fyw",
    "libelle": "Progression faible",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zn92002910k5azo99fyw",
    "libelle": "Suspendu",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zn92002910k5azo99fyw",
    "libelle": "Global",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zn81001r10k5n5cgkeot",
    "libelle": "Retard",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zn81001r10k5n5cgkeot",
    "libelle": "Hors délai",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zn81001r10k5n5cgkeot",
    "libelle": "Progression faible",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zn81001r10k5n5cgkeot",
    "libelle": "Suspendu",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zn81001r10k5n5cgkeot",
    "libelle": "Global",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "retard",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "horsDelai",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "progression",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "suspendu",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "global",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zn81001r10k5n5cgkeot",
    "libelle": "retard",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zn81001r10k5n5cgkeot",
    "libelle": "horsDelai",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zn81001r10k5n5cgkeot",
    "libelle": "progression",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zn81001r10k5n5cgkeot",
    "libelle": "suspendu",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zn81001r10k5n5cgkeot",
    "libelle": "global",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zn92002910k5azo99fyw",
    "libelle": "retard",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zn92002910k5azo99fyw",
    "libelle": "horsDelai",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zn92002910k5azo99fyw",
    "libelle": "progression",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zn92002910k5azo99fyw",
    "libelle": "suspendu",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zn92002910k5azo99fyw",
    "libelle": "global",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zna7002t10k594hk00xp",
    "libelle": "retard",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zna7002t10k594hk00xp",
    "libelle": "horsDelai",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zna7002t10k594hk00xp",
    "libelle": "progression",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zna7002t10k594hk00xp",
    "libelle": "suspendu",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zna7002t10k594hk00xp",
    "libelle": "global",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "Retard",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "Hors délai",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "Progression faible",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "Suspendu",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  },
  {
    "localProjetId": "cmn01zn4f000110k5zeqh4p8p",
    "libelle": "Global",
    "taux": 0,
    "gravite": "Faible",
    "couleur": "Vert"
  }
];

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
