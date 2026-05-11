import { createHomeRoutes } from './home.js';
import { createPortfolioRoutes } from './portfolio.js';
import { createContactRoutes } from './contact.js';

export function registerRoutes(app, { apiClient }) {
  app.use(createHomeRoutes({ apiClient }));
  app.use(createPortfolioRoutes({ apiClient }));
  app.use(createContactRoutes());
}

