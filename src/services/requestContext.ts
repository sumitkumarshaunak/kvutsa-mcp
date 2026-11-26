import { AsyncLocalStorage } from 'node:async_hooks';
import type { McpServer } from '@modelcontextprotocol/server';
import type { McpTool, ToolContext } from '../types/index.js';

/** Who is calling, for the x-mcp-* audit headers on every kvutsa-backend call. */
export interface McpCallContext {
  toolName: string;
  clientName?: string;
}

const storage = new AsyncLocalStorage<McpCallContext>();

export function runWithMcpContext<T>(ctx: McpCallContext, fn: () => T): T {
  return storage.run(ctx, fn);
}

export function getMcpContext(): McpCallContext | undefined {
  return storage.getStore();
}

const MAX_USER_AGENT = 120;

export function capUserAgent(userAgent: string | null | undefined): string | undefined {
  return userAgent ? userAgent.slice(0, MAX_USER_AGENT) : undefined;
}

/** Registers each tool so its execute() runs inside an McpCallContext. */
export function registerToolsWithContext(server: McpServer, tools: McpTool[], ctx: ToolContext, clientName?: string): void {
  for (const tool of tools) {
    server.registerTool(tool.name, tool.config, (args) =>
      runWithMcpContext({ toolName: tool.name, clientName }, () => tool.execute(args, ctx)),
    );
  }
}
