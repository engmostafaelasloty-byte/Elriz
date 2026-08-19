import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function settingsApiPlugin() {
  return {
    name: 'settings-api-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/save-settings' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const settingsPath = path.resolve(process.cwd(), 'public/settings.json');
              fs.writeFileSync(settingsPath, body, 'utf-8');
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, message: 'Settings saved globally' }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), settingsApiPlugin()],
  server: {
    port: 5173,
    host: true
  }
});
