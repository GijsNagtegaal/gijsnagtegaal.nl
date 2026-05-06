import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';

export function createBlogRoutes({ apiClient }) {
  const router = Router();

  router.get(
    '/blog',
    asyncHandler(async (req, res) => {
      try {
        const posts = await apiClient.fetchItems('blog_posts');
        res.render('blog', { posts });
      } catch (error) {

        console.error('Failed to load blog posts:', error);
        res.render('blog', { posts: [] });
      }
    }),
  );

  return router;
}

