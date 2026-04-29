<script lang="ts">
	import type { ProductConfig } from '$lib/types';

	interface Props {
		products: ProductConfig[];
		value: string;
		onchange: (productId: string) => void;
		disabled?: boolean;
	}

	let { products, value, onchange, disabled = false }: Props = $props();
</script>

<div>
	<label for="product-select" class="mb-1 block text-sm font-semibold text-vmw-text">
		Product
	</label>
	<select
		id="product-select"
		{disabled}
		class="mt-1 block w-full rounded-md border border-vmw-border bg-vmw-surface py-2.5 pr-10 pl-3 text-base text-vmw-text shadow-sm focus:border-vmw-accent focus:ring-vmw-accent focus:outline-none sm:text-sm"
		onchange={(e) => onchange(e.currentTarget.value)}
	>
		<option value="">-- Select a Product --</option>
		{#each products as product (product.id)}
			<option value={product.id} selected={product.id === value}>{product.name}</option>
		{/each}
	</select>
</div>
