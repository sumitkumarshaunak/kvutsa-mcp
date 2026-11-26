import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export type ToolScope = 'public';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * Reads src/mcp/<scope>/tool-descriptions/<toolFile>.md. The path is resolved from the project
 * root, so it works from src/ (tsx, tests) and from dist/ (the .md files stay in src/).
 */
export function loadToolDescription(toolFile: string, scope: ToolScope = 'public'): string {
  const path = join(ROOT, 'src/mcp', scope, 'tool-descriptions', `${toolFile}.md`);
  try {
    return readFileSync(path, 'utf-8').trim();
  } catch (error) {
    throw new Error(`Failed to load tool description '${toolFile}' (scope: ${scope})`, { cause: error });
  }
}
