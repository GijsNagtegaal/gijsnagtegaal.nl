import { Router } from 'express';

export function createPortfolioRoutes({ apiClient }) {
  const router = Router();

  router.get('/portfolio', async (req, res) => {
    try {
      const portfolioItems = await apiClient.fetchItems('portfolio_items');
      res.render('portfolio', { portfolioItems });
    } catch (error) {
      console.error('Failed to load portfolio data:', error);
      res.render('portfolio', { portfolioItems: [] });
    }
  });

  return router;
}

