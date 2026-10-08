import { archiveFetch, resolveTimestamps } from './cdx';
import type { SourceAttempt } from '../types';

const SOURCES = [
	{
		name: 'Broadcom',
		baseUrl: 'https://softwareupdate-prod.broadcom.com/cds/vmw-desktop/',
		timeout: 3000
	},
	{
		name: 'VMware',
		baseUrl: 'https://softwareupdate.vmware.com/cds/vmw-desktop/',
		timeout: 3000
	}
] as const;

const WAYBACK_BASE = 'https://web.archive.org/web/';
const WAYBACK_ORIGINAL_BASE = 'https://softwareupdate.vmware.com/cds/vmw-desktop/';
const WAYBACK_TIMEOUT = 10000;
// Snapshots are immutable.
const WAYBACK_CACHE_TTL = 30 * 86400;

export interface FetchResult {
	data: ArrayBuffer;
	sourceName: string;
	timestamp?: string;
	attempts: SourceAttempt[];
}

export async function fetchWithFallback(
	path: string,
	validate?: (data: ArrayBuffer) => boolean,
	cdxCategory: 'product-xml' | 'metadata-gz' = 'product-xml'
): Promise<FetchResult> {
	const attempts: SourceAttempt[] = [];

	for (const source of SOURCES) {
		const start = Date.now();
		try {
			const response = await fetch(`${source.baseUrl}${path}`, {
				signal: AbortSignal.timeout(source.timeout)
			});
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const data = await response.arrayBuffer();
			if (validate && !validate(data)) throw new Error('Validation failed');
			attempts.push({ name: source.name, status: 'success', ms: Date.now() - start });
			return { data, sourceName: source.name, attempts };
		} catch (e) {
			attempts.push({
				name: source.name,
				status: 'failed',
				ms: Date.now() - start,
				error: errorMessage(e)
			});
		}
	}

	const start = Date.now();
	const fullUrl = `${WAYBACK_ORIGINAL_BASE}${path}`;
	let lastError: string | undefined;
	for (const timestamp of await resolveTimestamps(fullUrl, cdxCategory)) {
		try {
			const waybackUrl = `${WAYBACK_BASE}${timestamp}id_/${fullUrl}`;
			const response = await archiveFetch(waybackUrl, WAYBACK_TIMEOUT, WAYBACK_CACHE_TTL);
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const data = await response.arrayBuffer();
			if (validate && !validate(data)) throw new Error('Validation failed');
			attempts.push({ name: 'Wayback Machine', status: 'success', ms: Date.now() - start });
			return { data, sourceName: 'Wayback Machine', timestamp, attempts };
		} catch (e) {
			lastError = errorMessage(e);
		}
	}
	attempts.push({
		name: 'Wayback Machine',
		status: 'failed',
		ms: Date.now() - start,
		error: lastError
	});

	throw new FetchError('All sources failed', attempts);
}

function errorMessage(e: unknown): string {
	return e instanceof Error ? e.message : String(e);
}

export class FetchError extends Error {
	constructor(
		message: string,
		public attempts: SourceAttempt[]
	) {
		super(message);
		this.name = 'FetchError';
	}
}
