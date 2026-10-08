import * as cache from './cache';

const CDX_BASE = 'https://web.archive.org/cdx/search/cdx';
const CDX_TIMEOUT = 5000;
const CDX_CACHE_TTL = 86400;
const CDX_CACHE_PREFIX = 'cdx:';
const DEFAULT_LIMIT = 5;

const USER_AGENT = 'vmware-index (+https://github.com/playday3008/vmware-index)';
const MAX_RETRY_DELAY = 2000;

/**
 * Fetch from archive.org with an identifying User-Agent and Cloudflare edge
 * caching of successful responses. Retries once on 429, since archive.org
 * rate-limits the shared Workers egress IPs.
 */
export async function archiveFetch(
	url: string,
	timeout: number,
	cacheTtl: number
): Promise<Response> {
	const init: RequestInit = {
		headers: { 'User-Agent': USER_AGENT },
		cf: { cacheEverything: true, cacheTtlByStatus: { '200-299': cacheTtl } }
	};
	const response = await fetch(url, { ...init, signal: AbortSignal.timeout(timeout) });
	if (response.status !== 429) return response;

	const retryAfter = Number(response.headers.get('Retry-After'));
	const delay = Number.isFinite(retryAfter) ? Math.min(retryAfter * 1000, MAX_RETRY_DELAY) : 1000;
	await new Promise((resolve) => setTimeout(resolve, delay));
	return fetch(url, { ...init, signal: AbortSignal.timeout(timeout) });
}

const METADATA_GZ_FALLBACK = '20240910091207';
const PRODUCT_XML_DEFAULT_FALLBACK = '20250221215224';

/**
 * Newest capture of each product XML that still lists non-info-only entries.
 * Broadcom gutted the upstream index in late 2025, so later snapshots archive a
 * stub that fails validateProductXml.
 */
const PRODUCT_XML_FALLBACKS: Record<string, string> = {
	'ws-windows.xml': '20250221215224',
	'ws-linux.xml': '20250221215227',
	'fusion-universal.xml': '20250221215237',
	'fusion-arm64.xml': '20250114162940',
	'fusion.xml': '20250114135635',
	'player-linux.xml': '20250313181114',
	'player-windows.xml': '20250221215240',
	'vmrc-linux.xml': '20241125113204',
	'vmrc-macos.xml': '20250114215343',
	'vmrc-windows.xml': '20241119045703'
};

function fallbackFor(url: string, category: 'product-xml' | 'metadata-gz'): string[] {
	if (category === 'metadata-gz') return [METADATA_GZ_FALLBACK];
	const fileName = url.split('/').pop() ?? '';
	return [PRODUCT_XML_FALLBACKS[fileName] ?? PRODUCT_XML_DEFAULT_FALLBACK];
}

/**
 * Candidate Wayback timestamps for a URL, newest first. Callers are expected to
 * try them in order and keep the first whose payload passes validation.
 */
export async function resolveTimestamps(
	url: string,
	category: 'product-xml' | 'metadata-gz',
	limit: number = DEFAULT_LIMIT
): Promise<string[]> {
	const cacheKey = `${CDX_CACHE_PREFIX}${url}`;
	const cached = cache.get<string[]>(cacheKey);
	if (cached) return cached;

	try {
		const params = new URLSearchParams({
			url,
			output: 'json',
			filter: 'statuscode:200',
			from: '20240101'
		});
		const response = await archiveFetch(`${CDX_BASE}?${params}`, CDX_TIMEOUT, CDX_CACHE_TTL);

		if (!response.ok) throw new Error(`CDX API returned ${response.status}`);

		const data = (await response.json()) as string[][];
		const timestamps = data
			.slice(1)
			.filter((row) => row.length >= 2)
			.map((row) => row[1])
			.slice(-limit)
			.reverse();

		if (timestamps.length === 0) throw new Error('No snapshots found');

		cache.set(cacheKey, timestamps);
		return timestamps;
	} catch {
		return fallbackFor(url, category);
	}
}

export async function resolveTimestamp(
	url: string,
	category: 'product-xml' | 'metadata-gz'
): Promise<string> {
	const timestamps = await resolveTimestamps(url, category);
	return timestamps[0];
}
