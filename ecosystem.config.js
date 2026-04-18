/**
 * PM2 Ecosystem — PAPE-D Project Tracker
 * Serveur : mshpcmu.ci (cPanel)
 * PM2 installé dans : ~/.local/node_modules/.bin/pm2
 *
 * Arborescence serveur :
 *   ~/apps/paped-projet           → code PROD    (branch master, port 3000)
 *   ~/apps/paped-projet-preprod   → code PREPROD (branch preprod, port 3001)
 *   ~/public_html/paped-projet       → reverse proxy Apache (.htaccess → :3000)
 *   ~/public_html/dev-paped-projet   → reverse proxy Apache (.htaccess → :3001)
 *   ~/logs/paped-projet/             → logs PM2
 *
 * Premier démarrage PROD :
 *   pm2 start ecosystem.config.js --only paped-projet
 *
 * Premier démarrage PREPROD :
 *   pm2 start ecosystem.config.js --only paped-projet-preprod
 *
 * Reload sans downtime (fait automatiquement par CI/CD) :
 *   pm2 reload paped-projet
 *   pm2 reload paped-projet-preprod
 *
 * Persistance au redémarrage serveur :
 *   pm2 save
 *   (crontab -l; echo "@reboot sleep 30 && /home/mshpcmu/.local/node_modules/.bin/pm2 resurrect") | crontab -
 */

module.exports = {
  apps: [
    {
      // ── PROD — branch master — paped-projet.mshpcmu.ci ───────────
      name: 'paped-projet',
      script: 'scripts/hebergeur-start.js',
      cwd: '/home/mshpcmu/apps/paped-projet',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      out_file: '/home/mshpcmu/logs/paped-projet/prod-out.log',
      error_file: '/home/mshpcmu/logs/paped-projet/prod-error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      // ── PREPROD — branch preprod — dev-paped-projet.mshpcmu.ci ───
      name: 'paped-projet-preprod',
      script: 'scripts/hebergeur-start.js',
      cwd: '/home/mshpcmu/apps/paped-projet-preprod',
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      out_file: '/home/mshpcmu/logs/paped-projet/preprod-out.log',
      error_file: '/home/mshpcmu/logs/paped-projet/preprod-error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
