import { resolveTimestamp } from './cdx';
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
		} catch {
			attempts.push({ name: source.name, status: 'failed', ms: Date.now() - start });
		}
	}

	const start = Date.now();
	try {
		const fullUrl = `${WAYBACK_ORIGINAL_BASE}${path}`;
		const timestamp = await resolveTimestamp(fullUrl, cdxCategory);
		const waybackUrl = `${WAYBACK_BASE}${timestamp}id_/${fullUrl}`;
		const response = await fetch(waybackUrl, {
			signal: AbortSignal.timeout(WAYBACK_TIMEOUT)
		});
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		const data = await response.arrayBuffer();
		if (validate && !validate(data)) throw new Error('Validation failed');
		attempts.push({ name: 'Wayback Machine', status: 'success', ms: Date.now() - start });
		return { data, sourceName: 'Wayback Machine', timestamp, attempts };
	} catch {
		attempts.push({ name: 'Wayback Machine', status: 'failed', ms: Date.now() - start });
	}

	throw new FetchError('All sources failed', attempts);
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
