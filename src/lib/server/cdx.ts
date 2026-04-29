import * as cache from './cache';

const CDX_BASE = 'https://web.archive.org/cdx/search/cdx';
const CDX_TIMEOUT = 5000;
const CDX_CACHE_PREFIX = 'cdx:';

const FALLBACK_TIMESTAMPS: Record<string, string> = {
	'product-xml': '20241003182329',
	'metadata-gz': '20240910091207'
};

export async function resolveTimestamp(
	url: string,
	category: 'product-xml' | 'metadata-gz'
): Promise<string> {
	const cacheKey = `${CDX_CACHE_PREFIX}${url}`;
	const cached = cache.get<string>(cacheKey);
	if (cached) return cached;

	try {
		const params = new URLSearchParams({
			url,
			output: 'json',
			limit: '1',
			filter: 'statuscode:200',
			from: '20240101',
			sort: 'closest',
			order: 'desc'
		});
		const response = await fetch(`${CDX_BASE}?${params}`, {
			signal: AbortSignal.timeout(CDX_TIMEOUT)
		});

		if (!response.ok) throw new Error(`CDX API returned ${response.status}`);

		const data = (await response.json()) as string[][];
		if (data.length >= 2 && data[1].length >= 2) {
			const timestamp = data[1][1];
			cache.set(cacheKey, timestamp);
			return timestamp;
		}
		throw new Error('No snapshots found');
	} catch {
		return FALLBACK_TIMESTAMPS[category];
	}
}
