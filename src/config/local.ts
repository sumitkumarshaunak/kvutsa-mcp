import type { Config } from './default.js';

export const localConfig: Partial<Config> = {
  port: 3200,
  kvutsaBackendBaseUrl: 'http://127.0.0.1:3100/api',
  siteUrl: 'http://localhost:3004',
  // To reach this local server from claude.ai or ChatGPT through a tunnel (ngrok), add the
  // tunnel hostname here, e.g. 'abcd-1-2-3-4.ngrok-free.app'.
  allowedHosts: [],
};
