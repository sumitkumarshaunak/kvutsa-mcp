import { ConfigSchema, ENV_NAMES, defaultConfig, type Config, type EnvName } from './default.js';
import { localConfig } from './local.js';
import { developmentConfig } from './dev.js';
import { stagingConfig } from './staging.js';
import { productionConfig } from './prod.js';

export type { Config, EnvName } from './default.js';

const ENV_CONFIGS: Record<EnvName, Partial<Config>> = {
  local: localConfig,
  test: localConfig,
  dev: developmentConfig,
  staging: stagingConfig,
  prod: productionConfig,
};

/**
 * default.ts, then the file for NODE_ENV. Like getstatus-mcp, the only environment variables
 * read are NODE_ENV and PORT: every other setting lives in src/config/<env>.ts.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const nodeEnv = env.NODE_ENV || 'local';
  if (!(ENV_NAMES as readonly string[]).includes(nodeEnv)) {
    throw new Error(`NODE_ENV must be one of ${ENV_NAMES.join(', ')} (got ${nodeEnv})`);
  }
  const name = nodeEnv as EnvName;

  const merged: Record<string, unknown> = { ...defaultConfig, ...ENV_CONFIGS[name], env: name };
  if (env.PORT) merged.port = Number(env.PORT);

  const result = ConfigSchema.safeParse(merged);
  if (!result.success) throw new Error(`Invalid configuration: ${result.error.message}`);
  const config = result.data;

  // Behind nginx every request carries the public hostname; without it in allowedHosts the
  // Host-header check answers 403 to everything. Fail at startup instead.
  if (name !== 'local' && name !== 'test' && config.allowedHosts.length === 0) {
    throw new Error(`allowedHosts is empty for NODE_ENV=${name}: add the public hostname in src/config/${name}.ts`);
  }

  config.kvutsaBackendBaseUrl = config.kvutsaBackendBaseUrl.replace(/\/+$/, '');
  config.siteUrl = config.siteUrl.replace(/\/+$/, '');
  return config;
}
