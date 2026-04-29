## Project Overview

VMware Product Download Index — a SvelteKit app that indexes VMware product downloads by fetching XML metadata from Broadcom/VMware update servers with Wayback Machine fallback.

## Tech Stack

- **Framework**: SvelteKit (Svelte 5, runes mode)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS v4 with `@theme` custom properties (dark VMware theme)
- **Deployment**: Cloudflare Workers (`@sveltejs/adapter-cloudflare`)
- **Package Manager**: bun
- **Testing**: vitest (unit, server project), playwright (e2e)
- **Dependencies**: fast-xml-parser, pako (gzip decompression)

## Architecture

### Server modules (`src/lib/server/`)

- `cache.ts` — In-memory TTL cache (Map-based, 24h default)
- `products.ts` — Product lookup (re-exports shared config + `getProduct()`)
- `xml-parser.ts` — XML parsing for product XML (`metaList`) and metadata XML (`metadataResponse`) using fast-xml-parser
- `cdx.ts` — Wayback Machine CDX API timestamp resolver with fallback timestamps
- `sources.ts` — 3-source fallback fetcher: Broadcom → VMware → Wayback Machine

### Shared (`src/lib/`)

- `types.ts` — All TypeScript interfaces (ProductConfig, VersionEntry, DownloadableFile, API responses)
- `products.ts` — Static product config for 10 VMware products (importable by client and server)

### API routes

- `GET /api/products/[productId]/versions` — Returns version list with source info
- `GET /api/products/[productId]/files?path=<gz-path>` — Returns downloadable files (decompresses metadata.xml.gz)

### Components (`src/lib/components/`)

- `ProductSelector.svelte` — Product dropdown
- `VersionSelector.svelte` — Version dropdown + submit button
- `StatusLog.svelte` — Verbose fetch status with timing
- `FileCard.svelte` — Download card (Wayback link, CDN curl command, checksum copy)
- `FileList.svelte` — List of FileCards

## Commands

```bash
bun run dev          # Start dev server
bun run build        # Build for Cloudflare Workers
bun run check        # Type check (svelte-kit sync + svelte-check)
bun run test:unit    # Run vitest
bun run lint         # Prettier + ESLint check
bun run format       # Prettier format
bun run deploy       # Build + wrangler deploy
```

## Testing

Server tests use vitest with `--project server`. Run individual test files:

```bash
bun run test:unit -- --project server src/lib/server/cache.test.ts
```

## Key Constants

- Broadcom base: `https://softwareupdate-prod.broadcom.com/cds/vmw-desktop/`
- VMware base: `https://softwareupdate.vmware.com/cds/vmw-desktop/`
- Wayback CDX: `https://web.archive.org/cdx/search/cdx`
- Timeouts: Broadcom/VMware 3s, Wayback 10s, CDX 5s
- Cache TTL: 24h in-memory, 86400s HTTP Cache-Control

## Svelte MCP Tools

The Svelte MCP server provides documentation and code analysis:

- **list-sections** — Discover available Svelte/SvelteKit doc sections
- **get-documentation** — Fetch full documentation for specific sections
- **svelte-autofixer** — Analyze Svelte code for issues (use before finalizing components)
- **playground-link** — Generate Svelte Playground links
