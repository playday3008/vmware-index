import type { RequestHandler } from './$types';
import * as pako from 'pako';
import * as cache from '#lib/server/cache.js';
import { fetchWithFallback, FetchError } from '#lib/server/sources.js';
import { parseMetadataXml } from '#lib/server/xml-parser.js';
import { getProduct } from '#lib/server/products.js';
import { resolveTimestamp } from '#lib/server/cdx.js';
import type { FilesResponse, ErrorResponse } from '#lib/types.js';

const CACHE_HEADERS = { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' };
const VMWARE_BASE = 'https://softwareupdate.vmware.com/cds/vmw-desktop/';

export const GET: RequestHandler = async ({ params, url }) => {
	const product = getProduct(params.productId);
	if (!product) {
		return Response.json(
			{ error: `Unknown product: ${params.productId}` } satisfies ErrorResponse,
			{
				status: 404
			}
		);
	}

	const gzPath = url.searchParams.get('path');
	if (!gzPath) {
		return Response.json(
			{ error: 'Missing required query parameter: path' } satisfies ErrorResponse,
			{
				status: 400
			}
		);
	}

	const cacheKey = `files:${gzPath}`;
	const cached = cache.get<FilesResponse>(cacheKey);
	if (cached) {
		return Response.json(cached, { headers: CACHE_HEADERS });
	}

	try {
		const result = await fetchWithFallback(gzPath, undefined, 'metadata-gz');

		let xmlText: string;
		try {
			const decompressed = pako.ungzip(new Uint8Array(result.data));
			xmlText = new TextDecoder().decode(decompressed);
		} catch {
			return Response.json({ error: 'Failed to decompress metadata' } satisfies ErrorResponse, {
				status: 500
			});
		}

		const pathParts = gzPath.split('/');
		const pathFragment = pathParts.slice(0, -1).join('/') + '/';

		const fullUrl = `${VMWARE_BASE}${gzPath}`;
		const waybackTimestamp = await resolveTimestamp(fullUrl, 'metadata-gz');

		const files = parseMetadataXml(xmlText, pathFragment, waybackTimestamp);

		const response: FilesResponse = {
			files,
			source: {
				name: result.sourceName,
				timestamp: result.timestamp ?? waybackTimestamp,
				attempts: result.attempts
			}
		};

		cache.set(cacheKey, response);
		return Response.json(response, { headers: CACHE_HEADERS });
	} catch (e) {
		if (e instanceof FetchError) {
			return Response.json(
				{ error: 'All sources failed', attempts: e.attempts } satisfies ErrorResponse,
				{
					status: 502
				}
			);
		}
		return Response.json({ error: 'Internal server error' } satisfies ErrorResponse, {
			status: 500
		});
	}
};
