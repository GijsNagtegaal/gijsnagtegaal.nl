import { loadEnv } from './server/config/env.js';
import { createApp } from './server/createApp.js';

loadEnv();

const port = Number(process.env.PORT) || 8000;
const app = createApp();

const server = app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 Site running at http://localhost:${port}`);
});

server.on('error', (error) => {
  // eslint-disable-next-line no-console
  console.error('Server failed to start:', error);
  process.exitCode = 1;
});

// Ensure the server keeps the process alive (some environments unref sockets).
server.ref();