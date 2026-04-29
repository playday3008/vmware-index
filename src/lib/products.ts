import type { ProductConfig } from './types';

// prettier-ignore
export const products: ProductConfig[] = [
	{ id: 'ws-windows',       name: 'Workstation Pro for Windows',      xmlFile: 'ws-windows.xml'       },
	{ id: 'ws-linux',         name: 'Workstation Pro for Linux',        xmlFile: 'ws-linux.xml'         },
	{ id: 'fusion-universal', name: 'Fusion Pro for macOS (Universal)', xmlFile: 'fusion-universal.xml' },
	{ id: 'fusion-arm64',     name: 'Fusion Pro for macOS (ARM64)',     xmlFile: 'fusion-arm64.xml'     },
	{ id: 'fusion-intel',     name: 'Fusion Pro for macOS (Intel)',     xmlFile: 'fusion.xml'           },
	{ id: 'player-linux',     name: 'Player for Linux',                 xmlFile: 'player-linux.xml'     },
	{ id: 'player-windows',   name: 'Player for Windows',               xmlFile: 'player-windows.xml'   },
	{ id: 'vmrc-linux',       name: 'Remote Console for Linux',         xmlFile: 'vmrc-linux.xml'       },
	{ id: 'vmrc-macos',       name: 'Remote Console for macOS',         xmlFile: 'vmrc-macos.xml'       },
	{ id: 'vmrc-windows',     name: 'Remote Console for Windows',       xmlFile: 'vmrc-windows.xml'     }
];
