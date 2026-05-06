import path from 'path';
import dotenv from 'dotenv';
import { projectRootDir } from '../lib/paths.js';

export function loadEnv() {
  dotenv.config({ path: path.join(projectRootDir, '.env') });
}

