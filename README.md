# VMware Product Download Index

A web app that indexes VMware product downloads by fetching XML metadata from Broadcom/VMware update servers, with Wayback Machine as a fallback source.

## Features

- **10 VMware products** — Workstation Pro, Fusion Pro, Player, Remote Console (all platforms)
- **3-source fallback chain** — Broadcom → VMware → Wayback Machine
- **Verbose status logging** — See which sources were tried and how long each took
- **Download links** — Wayback Machine download URLs and CDN curl commands with checksums
- **Dark VMware-themed UI** — Tailwind CSS dark theme

## How It Works

1. Select a product from the dropdown
2. The app fetches the product XML from Broadcom's update server, falling back to VMware's server, then to the Wayback Machine
3. Select a version/build from the populated list
4. Click "Show Downloadable Files" to fetch and decompress the metadata XML
5. Download files via Wayback Machine links or use the CDN curl commands

### Version Qualifiers

- **Core** — Main application installer
- **Packages** — Additional components (VMware Tools ISOs, guest OS drivers, etc.)
- **Windows / Linux** — Host operating system the build targets

## Tech Stack

- [SvelteKit](https://svelte.dev/) (Svelte 5, runes mode)
- [Tailwind CSS](https://tailwindcss.com/) v4
- [Cloudflare Workers](https://workers.cloudflare.com/) deployment
- [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) for XML parsing
- [pako](https://github.com/nodeca/pako) for gzip decompression

## Development

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Type check
bun run check

# Run tests
bun run test:unit

# Build for production
bun run build

# Deploy to Cloudflare Workers
bun run deploy
```

## Project Structure

```
src/
├── lib/
│   ├── components/       # Svelte 5 UI components
│   ├── server/           # Server-only modules (cache, XML parser, fetcher)
│   ├── types.ts          # Shared TypeScript interfaces
│   └── products.ts       # Product config (shared client/server)
├── routes/
│   ├── api/products/     # REST API endpoints
│   ├── +layout.svelte    # App shell (header, footer, dark theme)
│   └── +page.svelte      # Main page orchestrator
├── app.css               # Tailwind config + theme variables
└── app.html              # HTML shell
```

## Data Sources

| Source | URL Base | Timeout |
|--------|----------|---------|
| Broadcom | `softwareupdate-prod.broadcom.com/cds/vmw-desktop/` | 3s |
| VMware | `softwareupdate.vmware.com/cds/vmw-desktop/` | 3s |
| Wayback Machine | `web.archive.org/web/{timestamp}id_/` | 10s |

The app tries each source in order. Currently, the live Broadcom/VMware servers return stripped XML (only `info-only` entries), so the Wayback Machine is the effective primary source.

## License

Not affiliated with VMware or Broadcom.
