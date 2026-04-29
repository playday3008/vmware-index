<script lang="ts">
	import type { VersionEntry } from '$lib/types';

	interface Props {
		versions: VersionEntry[];
		value: string;
		onchange: (versionId: string) => void;
		onsubmit: () => void;
		loading?: boolean;
		loadingVersions?: boolean;
		disabled?: boolean;
	}

	let {
		versions,
		value,
		onchange,
		onsubmit,
		loading = false,
		loadingVersions = false,
		disabled = false
	}: Props = $props();
</script>

<div class="space-y-4">
	<div>
		<label for="version-select" class="mb-1 block text-sm font-semibold text-vmw-text">
			Version
		</label>
		{#if loadingVersions}
			<div
				class="mt-1 block w-full rounded-md border border-vmw-border bg-vmw-surface py-2.5 pl-3 text-vmw-text-muted shadow-sm"
			>
				Loading versions...
			</div>
		{:else}
			<select
				id="version-select"
				{disabled}
				class="mt-1 block w-full rounded-md border border-vmw-border bg-vmw-surface py-2.5 pr-10 pl-3 text-base text-vmw-text shadow-sm focus:border-vmw-accent focus:ring-vmw-accent focus:outline-none sm:text-sm"
				onchange={(e) => onchange(e.currentTarget.value)}
			>
				<option value="">-- Select a Version --</option>
				{#each versions as v (v.id)}
					<option value={v.id} selected={v.id === value}>{v.displayVersion}</option>
				{/each}
			</select>
		{/if}
	</div>

	<button
		type="button"
		onclick={onsubmit}
		disabled={disabled || loading || !value}
		class="w-full rounded-md bg-vmw-accent px-4 py-2.5 font-semibold text-white shadow-md hover:bg-vmw-accent-hover focus:ring-2 focus:ring-vmw-accent/60 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
	>
		{loading ? 'Fetching Details...' : 'Show Downloadable Files'}
	</button>
</div>
