import type { RequestHandler } from './$types';
import * as cache from '#lib/server/cache.js';
import { fetchWithFallback, FetchError } from '#lib/server/sources.js';
import { parseProductXml, validateProductXml } from '#lib/server/xml-parser.js';
import { getProduct } from '#lib/server/products.js';
import type { VersionsResponse, ErrorResponse } from '#lib/types.js';

const CACHE_HEADERS = { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' };

export const GET: RequestHandler = async ({ params }) => {
	const product = getProduct(params.productId);
	if (!product) {
		return Response.json(
			{ error: `Unknown product: ${params.productId}` } satisfies ErrorResponse,
			{
				status: 404
			}
		);
	}

	const cacheKey = `versions:${product.id}`;
	const cached = cache.get<VersionsResponse>(cacheKey);
	if (cached) {
		return Response.json(cached, { headers: CACHE_HEADERS });
	}

	try {
		const validate = (data: ArrayBuffer) => {
			const text = new TextDecoder().decode(data);
			return validateProductXml(text);
		};

		const result = await fetchWithFallback(product.xmlFile, validate);
		const xmlText = new TextDecoder().decode(result.data);
		const versions = parseProductXml(xmlText);

		const response: VersionsResponse = {
			versions,
			source: {
				name: result.sourceName,
				timestamp: result.timestamp,
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
