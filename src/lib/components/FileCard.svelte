<script lang="ts">
	import type { DownloadableFile } from '$lib/types';

	interface Props {
		file: DownloadableFile;
	}

	let { file }: Props = $props();

	let curlExpanded = $state(false);
	let copiedChecksum = $state(false);
	let copiedCurl = $state(false);

	async function copyText(text: string, flag: 'checksum' | 'curl') {
		await navigator.clipboard.writeText(text);
		if (flag === 'checksum') {
			copiedChecksum = true;
			setTimeout(() => (copiedChecksum = false), 2000);
		} else {
			copiedCurl = true;
			setTimeout(() => (copiedCurl = false), 2000);
		}
	}
</script>

<div class="rounded-md border border-vmw-border bg-vmw-surface p-4 shadow">
	<p class="font-medium break-all text-vmw-text">{file.name}</p>

	{#if file.checksumType && file.checksumValue}
		<div class="mt-1 flex items-start gap-2">
			<p class="min-w-0 flex-1 text-xs break-all text-vmw-text-muted">
				{file.checksumType.toUpperCase()}: {file.checksumValue}
			</p>
			<button
				onclick={() => copyText(`${file.checksumType}: ${file.checksumValue}`, 'checksum')}
				class="shrink-0 rounded px-2 py-0.5 text-xs font-medium transition-colors
					{copiedChecksum
					? 'bg-vmw-success text-white'
					: 'bg-vmw-border text-vmw-text-muted hover:bg-vmw-accent hover:text-white'}"
			>
				{copiedChecksum ? 'Copied!' : 'Copy'}
			</button>
		</div>
	{/if}

	<div class="mt-3">
		<a
			href={file.waybackUrl}
			target="_blank"
			rel="noopener noreferrer"
			class="inline-block rounded-md bg-vmw-accent px-4 py-2 text-sm font-semibold text-white shadow transition-colors hover:bg-vmw-accent-hover"
		>
			Download (Wayback Machine)
		</a>
	</div>

	<div class="mt-3">
		<button
			onclick={() => (curlExpanded = !curlExpanded)}
			class="text-xs text-vmw-text-muted transition-colors hover:text-vmw-accent"
		>
			{curlExpanded ? '▾' : '▸'} CDN curl command
		</button>

		{#if curlExpanded}
			<div class="mt-2 flex items-start gap-2">
				<pre
					class="min-w-0 flex-1 overflow-x-auto rounded border border-vmw-border bg-vmw-bg p-2 text-xs text-vmw-text">{file.curlCommand}</pre>
				<button
					onclick={() => copyText(file.curlCommand, 'curl')}
					class="shrink-0 rounded px-2 py-1 text-xs font-medium transition-colors
						{copiedCurl
						? 'bg-vmw-success text-white'
						: 'bg-vmw-border text-vmw-text-muted hover:bg-vmw-accent hover:text-white'}"
				>
					{copiedCurl ? 'Copied!' : 'Copy'}
				</button>
			</div>
		{/if}
	</div>
</div>
