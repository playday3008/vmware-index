import { describe, it, expect } from 'vitest';
import { products, getProduct } from './products';

describe('products', () => {
	it('has 10 products', () => {
		expect(products).toHaveLength(10);
	});

	it('each product has id, name, and xmlFile', () => {
		for (const p of products) {
			expect(p.id).toBeTruthy();
			expect(p.name).toBeTruthy();
			expect(p.xmlFile).toMatch(/\.xml$/);
		}
	});

	it('getProduct returns matching product', () => {
		const p = getProduct('ws-windows');
		expect(p).toBeDefined();
		expect(p!.name).toBe('Workstation Pro for Windows');
		expect(p!.xmlFile).toBe('ws-windows.xml');
	});

	it('getProduct returns undefined for unknown id', () => {
		expect(getProduct('nonexistent')).toBeUndefined();
	});
});
