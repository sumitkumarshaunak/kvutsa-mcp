import type { Config } from './default.js';

export const developmentConfig: Partial<Config> = {
  port: 3200,
  // kvutsa-backend runs on the same server, on port 3100 in every environment.
  kvutsaBackendBaseUrl: 'http://127.0.0.1:3100/api',
  // dev has no public Kvutsa site, so links use the default (kvutsa.com).
  // TODO: the public hostname of this MCP server (e.g. 'mcp.kvutsa.com'). Startup fails until it is set.
  allowedHosts: [],
};
