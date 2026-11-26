import { z } from 'zod';

export const ENV_NAMES = ['local', 'dev', 'staging', 'prod', 'test'] as const;
export type EnvName = (typeof ENV_NAMES)[number];

export const ConfigSchema = z.object({
  env: z.enum(ENV_NAMES),
  port: z.number().int().min(1).max(65535),
  host: z.string().min(1),
  kvutsaBackendBaseUrl: z.url().meta({ description: 'kvutsa-backend base URL, including /api' }),
  backendTimeoutMs: z.number().int().positive(),
  siteUrl: z.url().meta({ description: 'The public Kvutsa website, for links in tool results' }),
  allowedHosts: z.array(z.string()).default([]),
  mcp: z.object({
    public: z.object({
      name: z.string(),
      title: z.string(),
      version: z.string(),
    }),
  }),
});

export type Config = z.infer<typeof ConfigSchema>;

export const defaultConfig: Omit<Config, 'env'> = {
  port: 3200,
  host: '127.0.0.1',
  kvutsaBackendBaseUrl: 'http://127.0.0.1:3100/api',
  backendTimeoutMs: 10_000,
  siteUrl: 'https://kvutsa.com',
  allowedHosts: [],
  mcp: {
    public: {
      name: 'kvutsa',
      title: 'Kvutsa',
      version: '0.1.0',
    },
  },
};
