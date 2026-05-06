import path from 'path';
import { fileURLToPath } from 'url';

const serverDir = path.dirname(fileURLToPath(import.meta.url));

export const projectRootDir = path.resolve(serverDir, '..', '..');

