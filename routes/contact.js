import { Router } from 'express';

export function createContactRoutes() {
  const router = Router();

  router.post('/contact', (req, res) => {

    res.json({ success: true });
  });

  return router;
}

