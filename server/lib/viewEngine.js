import path from 'path';
import { Liquid } from 'liquidjs';
import { projectRootDir } from './paths.js';

export function registerLiquidViewEngine(app) {
  const viewsDir = path.join(projectRootDir, 'views');
  const engine = new Liquid({
    root: viewsDir,
    extname: '.liquid',
    cache: process.env.NODE_ENV === 'production',
  });

  app.engine('liquid', engine.express());
  app.set('views', viewsDir);
  app.set('view engine', 'liquid');
}

