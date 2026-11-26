import type { McpTool } from '../../../types/index.js';
import { searchListingsTool } from './searchListings.js';

// tools/list returns them in this order (the spec asks for a deterministic order).
export const tools: McpTool[] = [searchListingsTool];
