<script lang="ts">
	import type { DownloadableFile } from '$lib/types';
	import FileCard from './FileCard.svelte';

	interface Props {
		files: DownloadableFile[];
		error?: string | null;
	}

	let { files, error = null }: Props = $props();
</script>

{#if error}
	<div class="mt-6 rounded-md border-l-4 border-vmw-error bg-vmw-error/10 p-4">
		<p class="text-sm text-vmw-error">{error}</p>
	</div>
{:else if files.length > 0}
	<div class="mt-6">
		<h2 class="mb-4 text-lg font-semibold text-vmw-text">Downloadable Files</h2>
		<div class="space-y-3">
			{#each files as file (file.fileName)}
				<FileCard {file} />
			{/each}
		</div>
	</div>
{/if}
