import { McpServer } from '@modelcontextprotocol/server';
import type { Config } from '../../config/index.js';
import { registerToolsWithContext } from '../../services/requestContext.js';
import type { ToolContext } from '../../types/index.js';
import { tools } from './tools/index.js';

const INSTRUCTIONS = `Kvutsa (קבוצה, kvutsa.com) by GetStatus helps people buy new apartments together.
Developers publish "listings": presale projects offered to buyer groups.

How to use this server:
- search_listings lists the public presale projects, optionally in one city (pass the city name).
- Every listing has a url. Joining or signing up happens on the Kvutsa website, so share the url.
- Answer in the user's language. City names and project details may be in Hebrew.`;

// The tool list only changes on deploy.
const ONE_HOUR_MS = 60 * 60 * 1000;

/** A fresh public server, built once per HTTP request (stateless serving). */
export function getPublicServer(config: Pick<Config, 'mcp' | 'siteUrl'>, ctx: ToolContext, clientName?: string): McpServer {
  const server = new McpServer(
    {
      ...config.mcp.public,
      description: 'Search public Kvutsa presale projects in Israel.',
      websiteUrl: config.siteUrl,
    },
    {
      instructions: INSTRUCTIONS,
      cacheHints: {
        'tools/list': { ttlMs: ONE_HOUR_MS, cacheScope: 'public' },
        'server/discover': { ttlMs: ONE_HOUR_MS, cacheScope: 'public' },
      },
    },
  );

  registerToolsWithContext(server, tools, ctx, clientName);
  return server;
}
