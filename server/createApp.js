import express from 'express';
import cors from 'cors';
import path from 'path';
import { registerLiquidViewEngine } from './lib/viewEngine.js';
import { createApiClient } from './lib/apiClient.js';
import { projectRootDir } from './lib/paths.js';
import { registerRoutes } from './routes/index.js';

function getApiBaseUrl() {
  const rawUrl = process.env.API_BASE_URL || 'https://api.gijsnagtegaal.nl';
  return String(rawUrl).replace(/\/$/, '');
}

function notFoundHandler(req, res) {
  res.status(404).send('Not Found');
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error('❌ ERROR:', err);
  res.status(500).send('Internal Server Error');
}

export function createApp() {
  const app = express();

  registerLiquidViewEngine(app);

  app.use(cors());
  app.use(express.static(path.join(projectRootDir, 'public')));
  app.use(express.json());

  const apiClient = createApiClient({ apiBaseUrl: getApiBaseUrl() });
  registerRoutes(app, { apiClient });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

