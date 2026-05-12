import cors from 'cors';
import express from 'express';
import path from 'path';

export function registerMiddleware(app, { publicDir }) {
  
  app.use((req, res, next) => {
    res.locals.currentPath = req.path; 
    next();
  });

  app.use(cors());
  app.use(express.static(path.resolve(publicDir)));
  app.use(express.json());
}