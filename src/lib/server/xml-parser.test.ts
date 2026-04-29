import { describe, it, expect } from 'vitest';
import { parseProductXml, validateProductXml, parseMetadataXml } from './xml-parser';

describe('validateProductXml', () => {
	it('returns true when non-info-only entries exist', () => {
		const xml = `<metaList>
			<metadata>
				<url>ws/17.6.3/24583834/windows/core/metadata.xml.gz</url>
			</metadata>
		</metaList>`;
		expect(validateProductXml(xml)).toBe(true);
	});

	it('returns false when only info-only entries exist', () => {
		const xml = `<metaList>
			<metadata>
				<url>info-only/ws-windows/8.0.0/metadata.xml.gz</url>
			</metadata>
		</metaList>`;
		expect(validateProductXml(xml)).toBe(false);
	});

	it('returns false for empty metaList', () => {
		expect(validateProductXml('<metaList></metaList>')).toBe(false);
	});
});

describe('parseProductXml', () => {
	it('parses version entries from 6-segment URL paths', () => {
		const xml = `<metaList>
			<metadata>
				<productId>ws-windows</productId>
				<version>17.0.0</version>
				<url>ws/17.6.3/24583834/windows/core/metadata.xml.gz</url>
				<locale></locale>
			</metadata>
		</metaList>`;

		const entries = parseProductXml(xml);
		expect(entries).toHaveLength(1);
		expect(entries[0]).toEqual({
			id: 'ws/17.6.3/24583834/windows/core/metadata.xml.gz',
			displayVersion: '17.6.3 (Build 24583834) - Windows / Core',
			version: '17.6.3',
			build: '24583834',
			qualifiers: ['windows', 'core']
		});
	});

	it('parses 5-segment URL paths (old fusion, vmrc)', () => {
		const xml = `<metaList>
			<metadata>
				<productId>fusion</productId>
				<version>8.0.0</version>
				<url>fusion/8.0.0/2985594/core/metadata.xml.gz</url>
				<locale></locale>
			</metadata>
		</metaList>`;

		const entries = parseProductXml(xml);
		expect(entries).toHaveLength(1);
		expect(entries[0].qualifiers).toEqual(['core']);
		expect(entries[0].displayVersion).toBe('8.0.0 (Build 2985594) - Core');
	});

	it('skips info-only entries', () => {
		const xml = `<metaList>
			<metadata>
				<url>info-only/ws-windows/8.0.0/metadata.xml.gz</url>
			</metadata>
			<metadata>
				<url>ws/17.6.3/24583834/windows/core/metadata.xml.gz</url>
			</metadata>
		</metaList>`;

		const entries = parseProductXml(xml);
		expect(entries).toHaveLength(1);
		expect(entries[0].version).toBe('17.6.3');
	});

	it('sorts newest version first, then by build number', () => {
		const xml = `<metaList>
			<metadata>
				<url>ws/15.5.0/14665864/windows/core/metadata.xml.gz</url>
			</metadata>
			<metadata>
				<url>ws/17.6.3/24583834/windows/core/metadata.xml.gz</url>
			</metadata>
			<metadata>
				<url>ws/17.0.0/20800274/windows/core/metadata.xml.gz</url>
			</metadata>
		</metaList>`;

		const entries = parseProductXml(xml);
		expect(entries.map((e) => e.version)).toEqual(['17.6.3', '17.0.0', '15.5.0']);
	});

	it('returns empty array for malformed XML', () => {
		expect(parseProductXml('not xml at all')).toEqual([]);
	});
});

describe('parseMetadataXml', () => {
	it('extracts downloadable files with checksums', () => {
		const xml = `<metadataResponse>
			<version>3.5</version>
			<bulletin>
				<componentList>
					<component>
						<payload>VMware-workstation-17.6.3-24583834.exe.tar</payload>
						<checksum>
							<checksumType>sha256</checksumType>
							<checksum>abc123def456</checksum>
						</checksum>
						<relativePath>VMware-workstation-17.6.3-24583834.exe.tar</relativePath>
					</component>
				</componentList>
			</bulletin>
		</metadataResponse>`;

		const files = parseMetadataXml(xml, 'ws/17.6.3/24583834/windows/core/', '20241003182329');
		expect(files).toHaveLength(1);
		expect(files[0].name).toBe('VMware-workstation-17.6.3-24583834.exe.tar');
		expect(files[0].fileName).toBe('VMware-workstation-17.6.3-24583834.exe.tar');
		expect(files[0].pathFragment).toBe('ws/17.6.3/24583834/windows/core/');
		expect(files[0].checksumType).toBe('sha256');
		expect(files[0].checksumValue).toBe('abc123def456');
		expect(files[0].waybackUrl).toContain('web.archive.org/web/20241003182329id_');
		expect(files[0].waybackUrl).toContain(
			'ws/17.6.3/24583834/windows/core/VMware-workstation-17.6.3-24583834.exe.tar'
		);
		expect(files[0].curlCommand).toContain('--connect-to');
		expect(files[0].curlCommand).toContain('cdn.cloudflare.net');
	});

	it('handles relativePath with secureDownload attribute', () => {
		const xml = `<metadataResponse>
			<bulletin>
				<componentList>
					<component>
						<payload>tools-freebsd.tar</payload>
						<relativePath secureDownload="false">tools-freebsd.tar</relativePath>
					</component>
				</componentList>
			</bulletin>
		</metadataResponse>`;

		const files = parseMetadataXml(xml, 'ws/12.5.8/7098237/windows/packages/', '20241003182329');
		expect(files).toHaveLength(1);
		expect(files[0].fileName).toBe('tools-freebsd.tar');
	});

	it('handles multiple bulletins with multiple components', () => {
		const xml = `<metadataResponse>
			<bulletin>
				<componentList>
					<component>
						<payload>file1.tar</payload>
						<relativePath>file1.tar</relativePath>
					</component>
					<component>
						<payload>file2.tar</payload>
						<relativePath>file2.tar</relativePath>
					</component>
				</componentList>
			</bulletin>
			<bulletin>
				<componentList>
					<component>
						<payload>file3.tar</payload>
						<relativePath>file3.tar</relativePath>
					</component>
				</componentList>
			</bulletin>
		</metadataResponse>`;

		const files = parseMetadataXml(xml, 'ws/17.0.0/20800274/linux/packages/', '20241003182329');
		expect(files).toHaveLength(3);
	});

	it('returns empty array for malformed XML', () => {
		expect(parseMetadataXml('garbage', 'path/', '20241003')).toEqual([]);
	});
});
