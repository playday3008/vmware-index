import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { resolveTimestamp } from './cdx';
import { clear } from './cache';

describe('resolveTimestamp', () => {
	beforeEach(() => {
		clear();
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: () =>
					Promise.resolve([
						['urlkey', 'timestamp', 'original', 'mimetype', 'statuscode', 'digest', 'length'],
						[
							'com,vmware,softwareupdate)/cds/vmw-desktop/ws-windows.xml',
							'20241003182329',
							'https://softwareupdate.vmware.com/cds/vmw-desktop/ws-windows.xml',
							'application/xml',
							'200',
							'DIGEST',
							'897'
						]
					])
			})
		);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns timestamp from CDX API response', async () => {
		const ts = await resolveTimestamp(
			'https://softwareupdate.vmware.com/cds/vmw-desktop/ws-windows.xml',
			'product-xml'
		);
		expect(ts).toBe('20241003182329');
	});

	it('caches the timestamp on subsequent calls', async () => {
		await resolveTimestamp(
			'https://softwareupdate.vmware.com/cds/vmw-desktop/ws-windows.xml',
			'product-xml'
		);
		await resolveTimestamp(
			'https://softwareupdate.vmware.com/cds/vmw-desktop/ws-windows.xml',
			'product-xml'
		);
		expect(fetch).toHaveBeenCalledTimes(1);
	});

	it('returns fallback timestamp when CDX API fails', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
		const ts = await resolveTimestamp(
			'https://softwareupdate.vmware.com/cds/vmw-desktop/ws-windows.xml',
			'product-xml'
		);
		expect(ts).toBe('20241003182329');
	});

	it('returns fallback timestamp when CDX returns empty results', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve([['urlkey', 'timestamp', 'original']])
			})
		);
		const ts = await resolveTimestamp(
			'https://softwareupdate.vmware.com/cds/vmw-desktop/ws-windows.xml',
			'product-xml'
		);
		expect(ts).toBe('20241003182329');
	});

	it('returns metadata-gz fallback for that category', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')));
		const ts = await resolveTimestamp(
			'https://softwareupdate.vmware.com/cds/vmw-desktop/ws/17.0.0/metadata.xml.gz',
			'metadata-gz'
		);
		expect(ts).toBe('20240910091207');
	});
});
