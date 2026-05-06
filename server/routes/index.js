import { createHomeRoutes } from './homeRoutes.js';
import { createBlogRoutes } from './blogRoutes.js';
import { createContactRoutes } from './contactRoutes.js';

export function registerRoutes(app, { apiClient }) {
  app.use(createHomeRoutes({ apiClient }));
  app.use(createBlogRoutes({ apiClient }));
  app.use(createContactRoutes());
}

