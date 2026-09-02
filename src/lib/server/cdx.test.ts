import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolveTimestamp, resolveTimestamps } from './cdx';
import { clear } from './cache';

const WS_WINDOWS_URL = 'https://softwareupdate.vmware.com/cds/vmw-desktop/ws-windows.xml';
const GZ_URL = 'https://softwareupdate.vmware.com/cds/vmw-desktop/ws/17.0.0/metadata.xml.gz';

function row(timestamp: string) {
	return [
		'com,vmware,softwareupdate)/cds/vmw-desktop/ws-windows.xml',
		timestamp,
		WS_WINDOWS_URL,
		'application/xml',
		'200',
		'DIGEST',
		'897'
	];
}

const HEADER = ['urlkey', 'timestamp', 'original', 'mimetype', 'statuscode', 'digest', 'length'];

function mockCdx(rows: string[][]) {
	vi.stubGlobal(
		'fetch',
		vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve([HEADER, ...rows])
		})
	);
}

describe('resolveTimestamps', () => {
	beforeEach(() => {
		clear();
		mockCdx([row('20240913183755'), row('20241003182329'), row('20250221215224')]);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns CDX timestamps newest first', async () => {
		const ts = await resolveTimestamps(WS_WINDOWS_URL, 'product-xml');
		expect(ts).toEqual(['20250221215224', '20241003182329', '20240913183755']);
	});

	it('keeps only the newest `limit` timestamps', async () => {
		const ts = await resolveTimestamps(WS_WINDOWS_URL, 'product-xml', 2);
		expect(ts).toEqual(['20250221215224', '20241003182329']);
	});

	it('caches the timestamps on subsequent calls', async () => {
		await resolveTimestamps(WS_WINDOWS_URL, 'product-xml');
		await resolveTimestamps(WS_WINDOWS_URL, 'product-xml');
		expect(fetch).toHaveBeenCalledTimes(1);
	});

	it('returns the per-product fallback when the CDX API fails', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
		expect(await resolveTimestamps(WS_WINDOWS_URL, 'product-xml')).toEqual(['20250221215224']);
		expect(
			await resolveTimestamps(
				'https://softwareupdate.vmware.com/cds/vmw-desktop/player-linux.xml',
				'product-xml'
			)
		).toEqual(['20250313181114']);
	});

	it('returns the default product fallback for an unknown XML file', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
		const ts = await resolveTimestamps(
			'https://softwareupdate.vmware.com/cds/vmw-desktop/unknown.xml',
			'product-xml'
		);
		expect(ts).toEqual(['20250221215224']);
	});

	it('returns the fallback when CDX returns no rows', async () => {
		mockCdx([]);
		const ts = await resolveTimestamps(WS_WINDOWS_URL, 'product-xml');
		expect(ts).toEqual(['20250221215224']);
	});

	it('returns the metadata-gz fallback for that category', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')));
		expect(await resolveTimestamps(GZ_URL, 'metadata-gz')).toEqual(['20240910091207']);
	});
});

describe('resolveTimestamp', () => {
	beforeEach(() => {
		clear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns the newest timestamp', async () => {
		mockCdx([row('20241003182329'), row('20250221215224')]);
		expect(await resolveTimestamp(WS_WINDOWS_URL, 'product-xml')).toBe('20250221215224');
	});

	it('returns the fallback when the CDX API fails', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
		expect(await resolveTimestamp(GZ_URL, 'metadata-gz')).toBe('20240910091207');
	});
});
