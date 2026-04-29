import { XMLParser } from 'fast-xml-parser';
import type { VersionEntry, DownloadableFile } from '../types';

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '@_',
	textNodeName: '#text',
	isArray: (_name: string, jpath: string) => {
		return [
			'metaList.metadata',
			'metadataResponse.bulletin',
			'bulletin.componentList.component'
		].some((p) => jpath.endsWith(p));
	}
});

export function validateProductXml(xmlText: string): boolean {
	try {
		const parsed = parser.parse(xmlText);
		const entries = parsed?.metaList?.metadata;
		if (!Array.isArray(entries)) return false;
		return entries.some(
			(m: Record<string, unknown>) => typeof m.url === 'string' && !m.url.includes('info-only')
		);
	} catch {
		return false;
	}
}

export function parseProductXml(xmlText: string): VersionEntry[] {
	try {
		const parsed = parser.parse(xmlText);
		const metadataList = parsed?.metaList?.metadata;
		if (!Array.isArray(metadataList)) return [];

		const entries: VersionEntry[] = [];

		for (const meta of metadataList) {
			const url = meta.url;
			if (!url || typeof url !== 'string') continue;
			if (url.includes('info-only')) continue;

			const parts = url.split('/');
			if (parts.length < 5) continue;

			const version = parts[1];
			const build = parts[2];
			const qualifiers = parts.slice(3, -1);
			const displayQualifier = qualifiers.map(capitalize).join(' / ');

			entries.push({
				id: url,
				displayVersion: `${version} (Build ${build})${displayQualifier ? ` - ${displayQualifier}` : ''}`,
				version,
				build,
				qualifiers
			});
		}

		entries.sort((a, b) => {
			const cmp = compareVersions(b.version, a.version);
			if (cmp !== 0) return cmp;
			return parseInt(b.build) - parseInt(a.build);
		});

		return entries;
	} catch {
		return [];
	}
}

export function parseMetadataXml(
	xmlText: string,
	pathFragment: string,
	waybackTimestamp: string
): DownloadableFile[] {
	const baseVmwareUrl = 'https://softwareupdate.vmware.com/cds/vmw-desktop/';
	const baseBroadcomUrl = 'https://softwareupdate-prod.broadcom.com/cds/vmw-desktop/';
	const cdnMirror =
		'softwareupdate-prod.broadcom.com:443:softwareupdate-prod.broadcom.com.cdn.cloudflare.net:443';

	try {
		const parsed = parser.parse(xmlText);
		const bulletins = parsed?.metadataResponse?.bulletin;
		if (!Array.isArray(bulletins)) return [];

		const files: DownloadableFile[] = [];

		for (const bulletin of bulletins) {
			const components = bulletin?.componentList?.component;
			if (!Array.isArray(components)) continue;

			for (const component of components) {
				const rp = component.relativePath;
				let fileName: string | undefined;
				if (typeof rp === 'string') {
					fileName = rp;
				} else if (rp && typeof rp['#text'] === 'string') {
					fileName = rp['#text'];
				}
				if (!fileName) continue;

				const name = component.payload || component.componentID || fileName;

				let checksumType: string | undefined;
				let checksumValue: string | undefined;
				if (component.checksum) {
					checksumType = component.checksum.checksumType;
					checksumValue = component.checksum.checksum;
				}

				const fullPath = `${pathFragment}${fileName}`;
				const waybackUrl = `https://web.archive.org/web/${waybackTimestamp}id_/${baseVmwareUrl}${fullPath}`;
				const curlCommand = `curl --connect-to "${cdnMirror}" "${baseBroadcomUrl}${fullPath}"`;

				files.push({
					name,
					fileName,
					pathFragment,
					checksumType,
					checksumValue,
					waybackUrl,
					curlCommand
				});
			}
		}

		return files;
	} catch {
		return [];
	}
}

function capitalize(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1);
}

function compareVersions(a: string, b: string): number {
	const aParts = a.split('.').map(Number);
	const bParts = b.split('.').map(Number);
	for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
		const diff = (aParts[i] || 0) - (bParts[i] || 0);
		if (diff !== 0) return diff;
	}
	return 0;
}
