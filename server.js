import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { Liquid } from 'liquidjs';
import { registerMiddleware } from './lib/middleware.js';
import { createApiClient } from './lib/apiClient.js';
import { registerRoutes } from './routes/index.js';

dotenv.config({ path: path.resolve('.env') });

const port = Number(process.env.PORT) || 8000;

function getApiBaseUrl() {
  const rawUrl = process.env.API_BASE_URL || 'https://api.gijsnagtegaal.nl';
  return String(rawUrl).replace(/\/$/, '');
}

function registerLiquidViewEngine(app) {
  const viewsDir = path.resolve('views');
  const engine = new Liquid({
    root: viewsDir,
    extname: '.liquid',
    cache: process.env.NODE_ENV === 'production',
  });

  app.engine('liquid', engine.express());
  app.set('views', viewsDir);
  app.set('view engine', 'liquid');
}

function registerErrorHandlers(app) {
  app.use((req, res) => {
    res.status(404).send('Not Found');
  });


  app.use((err, req, res, next) => {
    console.error('❌ ERROR:', err);
    res.status(500).send('Internal Server Error');
  });
}

const app = express();
registerLiquidViewEngine(app);
registerMiddleware(app, { publicDir: 'public' });

const apiClient = createApiClient({ apiBaseUrl: getApiBaseUrl() });
registerRoutes(app, { apiClient });
registerErrorHandlers(app);

const server = app.listen(port, () => {

  console.log(`🚀 Site running at http://localhost:${port}`);
});

server.on('error', (error) => {

  console.error('Server failed to start:', error);
  process.exitCode = 1;
});

server.ref();