# kvutsa-mcp

An MCP server for Kvutsa. It lets AI assistants (Claude, ChatGPT and other MCP clients) list Kvutsa's **public presale projects** (listings).

- **One tool, read-only, public data, no login.**
- **A thin layer over kvutsa-backend.** It only calls the backend's public HTTP API (`/api/...`).
- **Built on the current MCP standard.** It uses the `2026-07-28` spec and the v2 TypeScript SDK (`@modelcontextprotocol/server`). Older 2025 clients are still served.
- **Same folder layout and conventions as getstatus-mcp.** Settings live in `src/config/<env>.ts`, with no `.env` file.

Node 24 · TypeScript 5.9 (ESM) · Express 5 · Zod 4 · PM2

## Commands

```bash
nvm use            # Node 24.21.0 (.nvmrc)
npm install
npm run dev        # NODE_ENV=local, tsx watch → http://localhost:3200/mcp
npm run typecheck
npm run lint
npm run build      # emits dist/
npm start          # runs dist/server.js
NODE_ENV=prod npm run deploy   # build + pm2 start ecosystem.config.cjs
npm run redeploy               # build + pm2 reload kvutsa-mcp
```

For local development, kvutsa-backend must run on port 3100 (`npm run dev` in `../kvutsa-backend`).

## The tool

**`search_listings`** returns public, live presale projects, newest first, page by page.

| Input | |
|---|---|
| `city` | Optional. A city name in Hebrew or English (`"Tel Aviv"`, `"תל אביב"`). The tool looks up the city code itself. If the name matches several cities, it returns them so the AI can ask the user which one. |
| `page`, `limit` | Paging. `limit` is 10 by default, 20 at most. |
| `sort` | `-publishedAt` (newest first, the default) or `publishedAt` |

Each listing comes back without internal IDs, with at most 3 images, and with a `url` to its page on the Kvutsa website.

It uses two kvutsa-backend routes:
- `GET /api/cities/public?q=` resolves the city name.
- `GET /api/listings` returns the listings.

## Connecting AI clients

Start the server first with `npm run dev`. Its endpoint is `http://localhost:3200/mcp`.

### Claude Code (local, simplest)

```bash
claude mcp add --transport http kvutsa http://localhost:3200/mcp
```

Then run `/mcp` inside Claude Code to check it's connected, and ask "Which new projects are on Kvutsa in Tel Aviv?".

### MCP Inspector (local, for debugging)

1. Run `npm run inspector`. It opens in the browser.
2. Choose "Streamable HTTP" and enter `http://localhost:3200/mcp`.
3. Click Connect, then go to Tools → `search_listings`.

### Claude Desktop (local)

Claude Desktop can reach a local HTTP server through the `mcp-remote` bridge. Add this to `claude_desktop_config.json` (Settings → Developer → Edit Config), then restart Claude Desktop:

```json
{
  "mcpServers": {
    "kvutsa": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "http://localhost:3200/mcp"]
    }
  }
}
```

### claude.ai, Claude Desktop/mobile connectors, ChatGPT (need a public HTTPS URL)

These clients call the server from the internet. `localhost` doesn't work for them, and claude.ai doesn't accept a URL with a custom port.

**For testing,** expose your local server with a tunnel:
1. Run `ngrok http 3200`. You get a URL like `https://abcd-1-2-3-4.ngrok-free.app`.
2. Add the tunnel hostname to `allowedHosts` in `src/config/local.ts`, e.g. `'abcd-1-2-3-4.ngrok-free.app'`. Without it, the Host-header check answers 403.
3. Restart `npm run dev`.

**In production,** use the deployed URL, e.g. `https://mcp.kvutsa.com/mcp` (see Deployment).

Then add the URL in each client:
- **claude.ai** (also syncs to Claude Desktop and mobile): Customize → Connectors → **Add custom connector**. Enter `https://<host>/mcp` and leave OAuth empty. On Team and Enterprise plans, an Owner adds it for the organization.
- **ChatGPT:** add a custom MCP server or connector from Settings (Apps & Connectors; on some plans you first enable Developer mode under Advanced). Enter `https://<host>/mcp` with no authentication. The menu names and the plans that allow it have changed several times, so check OpenAI's help pages.

## Configuration

There is no `.env`. Like getstatus-mcp, the config reads only `NODE_ENV` (`local`, `dev`, `staging` or `prod`) and `PORT`. Everything else is in `src/config/`:

| Setting | Where | Notes |
|---|---|---|
| `port` | `<env>.ts` (or `PORT`) | 3200 |
| `kvutsaBackendBaseUrl` | `<env>.ts` | `http://127.0.0.1:3100/api`: kvutsa-backend on the same server |
| `siteUrl` | `<env>.ts` | Used for links. local: `localhost:3004`, staging: `kvutsa.staging.getsts.io`, prod: `kvutsa.com` |
| `allowedHosts` | `<env>.ts` | The public hostname(s) of this server. **Required** outside local, or the server won't start (TODO in `dev.ts`, `staging.ts` and `prod.ts`) |

## Deployment

The same pattern as getstatus-mcp:
1. Set `allowedHosts` in `src/config/<env>.ts`.
2. Run `NODE_ENV=<env> npm run deploy` on the server.
3. Point an nginx `location /mcp` at `http://127.0.0.1:3200/mcp`, behind HTTPS.

## Project structure

```
src/
  server.ts                        entry point: config, listen, graceful shutdown
  app.ts                           Express app: /mcp and /_health
  config/                          default.ts (schema + defaults), local/dev/staging/prod.ts, index.ts
  mcp/public/
    server.ts                      getPublicServer(): McpServer + instructions + tools
    tools/                         searchListings.ts, index.ts
    tool-descriptions/             searchListings.md (what the AI reads)
  services/
    kvutsaBackendClient.ts         the only place that calls kvutsa-backend
    mcpResponse.ts                 success / error responses, READ_ONLY annotations
    requestContext.ts              AsyncLocalStorage (tool + client) and registerToolsWithContext
  types/                           backend response types + McpTool
  utils/                           loadToolDescription.ts, publicViews.ts, logger.ts
```
