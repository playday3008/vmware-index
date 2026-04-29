import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { fetchWithFallback, FetchError } from './sources';
import { clear } from './cache';

function mockFetchSequence(responses: Array<{ ok?: boolean; data?: string; error?: boolean }>) {
	let callIndex = 0;
	vi.stubGlobal(
		'fetch',
		vi.fn().mockImplementation(() => {
			const resp = responses[callIndex] ?? responses[responses.length - 1];
			callIndex++;
			if (resp.error) return Promise.reject(new Error('network error'));
			return Promise.resolve({
				ok: resp.ok,
				status: resp.ok ? 200 : 500,
				arrayBuffer: () => Promise.resolve(new TextEncoder().encode(resp.data ?? '').buffer)
			});
		})
	);
}

describe('fetchWithFallback', () => {
	beforeEach(() => {
		clear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns data from Broadcom when it succeeds', async () => {
		mockFetchSequence([{ ok: true, data: '<metaList></metaList>' }]);

		const result = await fetchWithFallback('ws-windows.xml');
		expect(result.sourceName).toBe('Broadcom');
		expect(result.attempts).toHaveLength(1);
		expect(result.attempts[0].status).toBe('success');
		expect(new TextDecoder().decode(result.data)).toBe('<metaList></metaList>');
	});

	it('falls through to VMware when Broadcom fails', async () => {
		mockFetchSequence([{ ok: false }, { ok: true, data: '<data/>' }]);

		const result = await fetchWithFallback('ws-windows.xml');
		expect(result.sourceName).toBe('VMware');
		expect(result.attempts).toHaveLength(2);
		expect(result.attempts[0].status).toBe('failed');
		expect(result.attempts[1].status).toBe('success');
	});

	it('falls through to Wayback when both live sources fail', async () => {
		mockFetchSequence([
			{ ok: false },
			{ ok: false },
			// CDX API call
			{ ok: true, data: JSON.stringify([['a', 'b'], ['x', '20241003182329']]) },
			// Wayback fetch
			{ ok: true, data: '<archived/>' }
		]);

		const result = await fetchWithFallback('ws-windows.xml');
		expect(result.sourceName).toBe('Wayback Machine');
		expect(result.attempts).toHaveLength(3);
		expect(result.attempts[2].status).toBe('success');
	});

	it('throws FetchError when all sources fail', async () => {
		mockFetchSequence([{ error: true }, { error: true }, { error: true }, { error: true }]);

		try {
			await fetchWithFallback('ws-windows.xml');
			expect.unreachable('should have thrown');
		} catch (e) {
			expect(e).toBeInstanceOf(FetchError);
			expect((e as FetchError).attempts).toHaveLength(3);
			expect((e as FetchError).attempts.every((a) => a.status === 'failed')).toBe(true);
		}
	});

	it('rejects source when validation fails and tries next', async () => {
		const validator = (data: ArrayBuffer) => {
			const text = new TextDecoder().decode(data);
			return text.includes('good');
		};
		mockFetchSequence([{ ok: true, data: 'bad data' }, { ok: true, data: 'good data' }]);

		const result = await fetchWithFallback('test.xml', validator);
		expect(result.sourceName).toBe('VMware');
		expect(result.attempts[0].status).toBe('failed');
		expect(result.attempts[1].status).toBe('success');
	});
});
