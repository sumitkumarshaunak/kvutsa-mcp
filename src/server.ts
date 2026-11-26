import { createApp } from './app.js';
import { loadConfig } from './config/index.js';
import { createKvutsaBackendClient } from './services/kvutsaBackendClient.js';
import { errorFields, logger } from './utils/logger.js';

const config = loadConfig();
const backend = createKvutsaBackendClient({ baseUrl: config.kvutsaBackendBaseUrl, timeoutMs: config.backendTimeoutMs });
const { app, mcp } = createApp(config, backend);

const server = app.listen(config.port, config.host, () => {
  logger.info('kvutsa-mcp started', {
    env: config.env,
    endpoint: `http://${config.host}:${config.port}/mcp`,
    backend: config.kvutsaBackendBaseUrl,
  });
});

server.on('error', (err: NodeJS.ErrnoException) => {
  logger.error(err.code === 'EADDRINUSE' ? `port ${config.port} is already in use` : 'server error', errorFields(err));
  process.exit(1);
});

let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info('shutting down', { signal });
  // Must stay below PM2's kill_timeout (ecosystem.config.cjs).
  const force = setTimeout(() => process.exit(1), 10_000);
  force.unref();
  await mcp.close().catch((err) => logger.error('closing mcp handler failed', errorFields(err)));
  server.close(() => process.exit(0));
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  logger.error('unhandled rejection', errorFields(reason));
  process.exit(1);
});
