import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get, set, clear } from './cache';

describe('cache', () => {
	beforeEach(() => {
		clear();
	});

	it('returns null for missing key', () => {
		expect(get('missing')).toBeNull();
	});

	it('stores and retrieves a value', () => {
		set('key', { hello: 'world' });
		expect(get<{ hello: string }>('key')).toEqual({ hello: 'world' });
	});

	it('returns null for expired entries', () => {
		vi.useFakeTimers();
		set('key', 'value', 100);
		vi.advanceTimersByTime(101);
		expect(get('key')).toBeNull();
		vi.useRealTimers();
	});

	it('returns value before expiry', () => {
		vi.useFakeTimers();
		set('key', 'value', 1000);
		vi.advanceTimersByTime(999);
		expect(get<string>('key')).toBe('value');
		vi.useRealTimers();
	});

	it('clear removes all entries', () => {
		set('a', 1);
		set('b', 2);
		clear();
		expect(get('a')).toBeNull();
		expect(get('b')).toBeNull();
	});
});
