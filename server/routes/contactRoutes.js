import { Router } from 'express';

export function createContactRoutes() {
  const router = Router();

  router.post('/contact', (req, res) => {
    console.log('Form received:', req.body);
    res.json({ success: true });
  });

  return router;
}

