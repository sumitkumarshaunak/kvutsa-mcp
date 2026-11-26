# kvutsa-mcp

An MCP server (spec 2026-07-28, TypeScript SDK v2) over kvutsa-backend's public HTTP API. It uses the same folder layout as `../getstatus-mcp`. Read the README first.

## Rules

- **Only call kvutsa-backend through `src/services/kvutsaBackendClient.ts`.** Add a method there for each new route. Never connect to MongoDB, and never call `fetch` inside a tool.
- **Use SDK v2 packages only:** `@modelcontextprotocol/server`, `/express`, `/node`. Never use the v1 `@modelcontextprotocol/sdk`.
- **No `.env`.** Settings go in `src/config/<env>.ts`. The config reads only `NODE_ENV` and `PORT`.
- **No login yet.** Every tool reads public data and uses `annotations: READ_ONLY`. Tools that change data or need a user wait for OAuth, and will go in `src/mcp/private/`.
- **Credentials:** never take tokens, passwords or OTP codes as tool inputs.
- **TypeScript stays on 5.9.** typescript-eslint does not support TypeScript 7 yet.

## Adding a tool

1. **Find the route.** Pick an existing public route in kvutsa-backend (`src/routes/*.routes.ts`) and read its controller, so you know the exact query parameters and response shape.
2. **Add the backend call.** Put the response type in `src/types/<name>.ts` and export it from `src/types/index.ts`. Add a method to `KvutsaBackendClient`.
3. **Write the description** in `src/mcp/public/tool-descriptions/<toolFile>.md`, using the sections `<purpose>`, `<use_cases>`, `<negative_use_cases>`, `<rules>`.
4. **Write the tool** in `src/mcp/public/tools/<toolFile>.ts`, as a `McpTool`:
   - a `snake_case` name and a `title`
   - `description: loadToolDescription('<toolFile>')`
   - an input schema (`z.object`, with limits on every field) and an output schema (use `z.looseObject` for backend objects)
   - `annotations: READ_ONLY`
   - `execute` wrapped in `try` / `createMcpError`, returning `createMcpSuccessResponse`
   - internal IDs removed and a `url` added (see `src/utils/publicViews.ts`)
5. **Register it** in `src/mcp/public/tools/index.ts`. The array order is the `tools/list` order.
6. **Check it.** Run `npm run typecheck && npm run lint`. Then try it against the local backend with `npm run dev` and the MCP Inspector, or with Claude Code (`claude mcp add --transport http kvutsa http://localhost:3200/mcp`).
