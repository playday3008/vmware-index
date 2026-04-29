interface CacheEntry<T> {
	data: T;
	expiry: number;
}

const store = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL = 24 * 60 * 60 * 1000;

export function get<T>(key: string): T | null {
	const entry = store.get(key);
	if (!entry) return null;
	if (Date.now() > entry.expiry) {
		store.delete(key);
		return null;
	}
	return entry.data as T;
}

export function set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
	store.set(key, { data, expiry: Date.now() + ttl });
}

export function clear(): void {
	store.clear();
}
