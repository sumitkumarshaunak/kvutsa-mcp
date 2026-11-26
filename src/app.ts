import type { Express, NextFunction, Request, Response } from 'express';
import { createMcpExpressApp } from '@modelcontextprotocol/express';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { createMcpHandler, type McpHttpHandler } from '@modelcontextprotocol/server';
import type { Config } from './config/index.js';
import { getPublicServer } from './mcp/public/server.js';
import type { KvutsaBackendClient } from './services/kvutsaBackendClient.js';
import { capUserAgent } from './services/requestContext.js';
import { errorFields, logger } from './utils/logger.js';

export interface App {
  app: Express;
  mcp: McpHttpHandler;
}

type AppConfig = Pick<Config, 'host' | 'allowedHosts' | 'siteUrl' | 'mcp'>;


export function createApp(config: AppConfig, backend: KvutsaBackendClient): App {
  const app = createMcpExpressApp({
    host: config.host,
    allowedHosts: ['localhost', '127.0.0.1', '[::1]', ...config.allowedHosts],
  });

  const mcp = createMcpHandler(
    (ctx) => getPublicServer(config, { backend, siteUrl: config.siteUrl }, capUserAgent(ctx.requestInfo?.headers.get('user-agent'))),
    { onerror: (err) => logger.warn('mcp request rejected', errorFields(err)) },
  );
  const handle = toNodeHandler(mcp, { onerror: (err) => logger.error('mcp adapter error', errorFields(err)) });

  app.all('/mcp', (req: Request, res: Response) => handle(req, res, req.body));

  app.get('/_health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', version: config.mcp.public.version, uptime: process.uptime() });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('unhandled error', errorFields(err));
    if (!res.headersSent) res.status(500).json({ error: 'internal_error' });
  });

  return { app, mcp };
}
