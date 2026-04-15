/**
 * PM2 Ecosystem — PAPE-D Project Tracker
 * Serveur : mshpcmu.ci (cPanel)
 * PM2 installé dans : ~/.local/node_modules/.bin/pm2
 *
 * Premier démarrage PROD :
 *   PORT=3000 pm2 start scripts/hebergeur-start.js --name pape-tracker --log ~/logs/pape-tracker/prod.log
 *
 * Premier démarrage PREPROD :
 *   PORT=3001 pm2 start scripts/hebergeur-start.js --name pape-tracker-preprod --log ~/logs/pape-tracker/preprod.log
 *
 * Reload sans downtime (fait automatiquement par CI/CD) :
 *   pm2 reload pape-tracker
 *   pm2 reload pape-tracker-preprod
 *
 * Persistance au redémarrage serveur :
 *   (crontab -l; echo "@reboot sleep 30 && /home/mshpcmu/.local/node_modules/.bin/pm2 resurrect") | crontab -
 */

module.exports = {
  apps: [
    {
      // ── PROD — branch master — paped-projet.mshpcmu.ci ───────────
      name: 'pape-tracker',
      script: 'scripts/hebergeur-start.js',
      cwd: '/home/mshpcmu/apps/pape-tracker',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      out_file: '/home/mshpcmu/logs/pape-tracker/prod-out.log',
      error_file: '/home/mshpcmu/logs/pape-tracker/prod-error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      // ── PREPROD — branch dev — dev-paped-projet.mshpcmu.ci ───────
      name: 'pape-tracker-preprod',
      script: 'scripts/hebergeur-start.js',
      cwd: '/home/mshpcmu/apps/pape-tracker-preprod',
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      out_file: '/home/mshpcmu/logs/pape-tracker/preprod-out.log',
      error_file: '/home/mshpcmu/logs/pape-tracker/preprod-error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
