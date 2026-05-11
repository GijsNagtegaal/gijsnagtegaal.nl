import cors from 'cors';
import express from 'express';
import path from 'path';

export function registerMiddleware(app, { publicDir }) {
  app.use(cors());
  app.use(express.static(path.resolve(publicDir)));
  app.use(express.json());
}

