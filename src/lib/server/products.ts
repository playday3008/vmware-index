import type { ProductConfig } from '../types';
import { products } from '../products';

export { products };

export function getProduct(id: string): ProductConfig | undefined {
	return products.find((p) => p.id === id);
}
