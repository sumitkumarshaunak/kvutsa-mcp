import type { CallToolResult, ToolAnnotations } from '@modelcontextprotocol/server';
import { errorFields, logger } from '../utils/logger.js';
import { BackendError, BackendUnavailableError } from './kvutsaBackendClient.js';

/** Every tool in this server only reads public Kvutsa data. */
export const READ_ONLY: ToolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

/** structuredContent for current clients, the same JSON as text for older ones. */
export function createMcpSuccessResponse<T extends Record<string, unknown>>(data: T): CallToolResult {
  return {
    structuredContent: data,
    content: [{ type: 'text', text: JSON.stringify(data) }],
  };
}

/** A tool error the AI can read: it may fix its input or tell the user. */
export function createMcpErrorResponse(message: string): CallToolResult {
  return { isError: true, content: [{ type: 'text', text: message }] };
}

interface ErrorOptions {
  toolName: string;
  /** The message for a 404. */
  notFoundMessage: string;
}

/** Maps a failure to a tool error (never a protocol error). */
export function createMcpError(err: unknown, opts: ErrorOptions): CallToolResult {
  if (err instanceof BackendError) {
    if (err.status === 404) return createMcpErrorResponse(opts.notFoundMessage);
    if (err.status === 400) return createMcpErrorResponse(`Kvutsa rejected the input (${err.code ?? 'invalid input'}). Check the arguments and try again.`);
    if (err.status === 429) return createMcpErrorResponse('Too many requests to Kvutsa right now. Wait a little and try again.');
  }
  if (err instanceof BackendUnavailableError) {
    logger.warn('backend unavailable', { tool: opts.toolName, ...errorFields(err.cause) });
    return createMcpErrorResponse('Kvutsa is temporarily unavailable. Try again in a few minutes.');
  }
  logger.error('tool failed', { tool: opts.toolName, ...errorFields(err) });
  return createMcpErrorResponse('Something went wrong while reading Kvutsa data.');
}
