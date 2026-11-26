import type { Config } from './default.js';

export const productionConfig: Partial<Config> = {
  port: 3200,
  kvutsaBackendBaseUrl: 'http://127.0.0.1:3100/api',
  siteUrl: 'https://kvutsa.com',
  // TODO: the public hostname of this MCP server (e.g. 'mcp.kvutsa.com'). Startup fails until it is set.
  allowedHosts: [],
};
