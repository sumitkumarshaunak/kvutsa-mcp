import type { CallToolResult, ToolAnnotations } from '@modelcontextprotocol/server';
import type { z } from 'zod';
import type { KvutsaBackendClient } from '../services/kvutsaBackendClient.js';

/** What every tool's execute() gets besides its arguments. */
export interface ToolContext {
  backend: KvutsaBackendClient;
  /** The public Kvutsa website, for links in results. */
  siteUrl: string;
}

/**
 * A tool definition, registered with server.registerTool by registerToolsWithContext.
 * Every tool has an input schema (z.object({}) when it takes no arguments) and an output schema.
 */
export interface McpTool<Input extends z.ZodType = z.ZodType> {
  name: string;
  config: {
    title: string;
    description: string;
    inputSchema: Input;
    outputSchema: z.ZodType;
    annotations: ToolAnnotations;
  };
  // Method syntax on purpose: lets tools with different inputs share one McpTool[] array.
  execute(args: z.infer<Input>, ctx: ToolContext): Promise<CallToolResult>;
}
