import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';

export function createHomeRoutes({ apiClient }) {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      try {
        const [projects, techStack] = await Promise.all([
          apiClient.fetchItems('portfolio_items'),
          apiClient.fetchItems('tech_stack'),
        ]);

        res.render('index', { projects, techStack });
      } catch (error) {

        console.error('Failed to load homepage data:', error);
        res.render('index', { 
          currentPath: req.path,
          projects: [], 
          techStack: [] 
        });
      }
    }),
  );

  return router;
}

