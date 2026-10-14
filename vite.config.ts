import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-contact-handler',
        configureServer(server) {
          server.middlewares.use('/api/contact', (req, res) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', (chunk) => {
                body += chunk;
              });
              req.on('end', () => {
                try {
                  const data = JSON.parse(body || '{}');
                  console.log('MaxiCareer Contact Submission Received:', {
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    timestamp: new Date().toISOString(),
                  });
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = 200;
                  res.end(
                    JSON.stringify({
                      success: true,
                      message:
                        'Thank you! Your career consultation request has been submitted successfully. A MaxiCareer mentor will contact you shortly.',
                      data: {
                        name: data.name,
                        email: data.email,
                      },
                    }),
                  );
                } catch {
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = 400;
                  res.end(
                    JSON.stringify({
                      success: false,
                      message: 'Invalid request payload format',
                    }),
                  );
                }
              });
            } else {
              res.statusCode = 405;
              res.end('Method Not Allowed');
            }
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
