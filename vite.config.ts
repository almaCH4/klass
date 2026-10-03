import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function pronoteDevPlugin(): Plugin {
  return {
    name: 'pronote-dev-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/pronote')) {
          const authHeader = req.headers['authorization'];
          if (!authHeader) {
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Cache-Control', 'private, no-store');
            res.end(JSON.stringify({
              success: false,
              error: 'Authentification requise : en-tête Authorization Bearer manquant.'
            }));
            return;
          }

          const icalUrl = process.env.ICAL_URL;
          if (!icalUrl) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Cache-Control', 'private, no-store');
            res.end(JSON.stringify({
              success: false,
              error: 'Variable ICAL_URL non configurée dans l\'environnement local (.env). Sur Cloudflare Worker, configurez le secret ICAL_URL dans Settings > Variables and Secrets.'
            }));
            return;
          }

          try {
            const fetchRes = await fetch(icalUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            });
            if (!fetchRes.ok) {
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.setHeader('Cache-Control', 'private, no-store');
              res.end(JSON.stringify({ success: false, error: `Erreur Pronote : Code ${fetchRes.status}` }));
              return;
            }
            const icsText = await fetchRes.text();
            
            // Dynamic import of icsParser
            const { parseFullIcsContent } = await import('./src/utils/icsParser');
            const urlObj = new URL(req.url, 'http://localhost');
            const classId = urlObj.searchParams.get('classId') || 'local';
            const parsed = parseFullIcsContent(icsText, classId);

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Cache-Control', 'private, no-store');
            res.end(JSON.stringify({
              success: true,
              courses: parsed.courses,
              homework: parsed.homework,
              sessions: parsed.sessions,
              availableGroups: parsed.availableGroups
            }));
          } catch (err: any) {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Cache-Control', 'private, no-store');
            res.end(JSON.stringify({ success: false, error: err.message || 'Erreur réseau vers Pronote' }));
          }
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), pronoteDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.', '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
