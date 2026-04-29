<script lang="ts">
	import { products } from '$lib/products';
	import type {
		ProductConfig,
		VersionEntry,
		DownloadableFile,
		SourceAttempt,
		VersionsResponse,
		FilesResponse,
		ErrorResponse
	} from '$lib/types';
	import ProductSelector from '$lib/components/ProductSelector.svelte';
	import VersionSelector from '$lib/components/VersionSelector.svelte';
	import StatusLog from '$lib/components/StatusLog.svelte';
	import FileList from '$lib/components/FileList.svelte';

	let selectedProductId = $state('');
	let selectedVersionId = $state('');
	let versions = $state<VersionEntry[]>([]);
	let files = $state<DownloadableFile[]>([]);

	let loadingVersions = $state(false);
	let loadingFiles = $state(false);

	let versionAttempts = $state<SourceAttempt[] | null>(null);
	let versionResultMessage = $state('');
	let fileAttempts = $state<SourceAttempt[] | null>(null);
	let fileResultMessage = $state('');

	let error = $state<string | null>(null);

	const productList: ProductConfig[] = products;

	function getProductName(id: string): string {
		return productList.find((p) => p.id === id)?.name ?? id;
	}

	async function onProductChange(productId: string) {
		selectedProductId = productId;
		selectedVersionId = '';
		versions = [];
		files = [];
		error = null;
		versionAttempts = null;
		versionResultMessage = '';
		fileAttempts = null;
		fileResultMessage = '';

		if (!productId) return;

		loadingVersions = true;
		try {
			const response = await fetch(`/api/products/${productId}/versions`);
			const data: VersionsResponse | ErrorResponse = await response.json();

			if ('error' in data) {
				error = data.error;
				versionAttempts = ('attempts' in data && data.attempts) || null;
				return;
			}

			versions = data.versions;
			versionAttempts = data.source.attempts;

			const snapshotInfo = data.source.timestamp
				? ` (${formatTimestamp(data.source.timestamp)} snapshot)`
				: '';
			versionResultMessage = `Loaded ${data.versions.length} versions from ${data.source.name}${snapshotInfo}`;

			if (data.versions.length === 0) {
				error = 'No versions available for this product.';
			}
		} catch (e) {
			error = `Network error: ${e instanceof Error ? e.message : 'unknown'}`;
		} finally {
			loadingVersions = false;
		}
	}

	async function onShowFiles() {
		files = [];
		fileAttempts = null;
		fileResultMessage = '';
		error = null;

		if (!selectedProductId || !selectedVersionId) return;

		loadingFiles = true;
		try {
			const path = encodeURIComponent(selectedVersionId);
			const response = await fetch(`/api/products/${selectedProductId}/files?path=${path}`);
			const data: FilesResponse | ErrorResponse = await response.json();

			if ('error' in data) {
				error = data.error;
				fileAttempts = ('attempts' in data && data.attempts) || null;
				return;
			}

			files = data.files;
			fileAttempts = data.source.attempts;

			const snapshotInfo = data.source.timestamp
				? ` (${formatTimestamp(data.source.timestamp)} snapshot)`
				: '';
			fileResultMessage = `Found ${data.files.length} files from ${data.source.name}${snapshotInfo}`;

			if (data.files.length === 0) {
				error = 'No downloadable files found for this version.';
			}
		} catch (e) {
			error = `Network error: ${e instanceof Error ? e.message : 'unknown'}`;
		} finally {
			loadingFiles = false;
		}
	}

	function formatTimestamp(ts: string): string {
		if (ts.length < 8) return ts;
		const year = ts.slice(0, 4);
		const month = ts.slice(4, 6);
		const day = ts.slice(6, 8);
		return `${year}-${month}-${day}`;
	}
</script>

<div class="space-y-6">
	<StatusLog
		label="Fetching versions for {getProductName(selectedProductId)}"
		attempts={versionAttempts}
		resultMessage={versionResultMessage}
		loading={loadingVersions}
	/>

	<div class="bg-vmw-surface border-vmw-border rounded-xl border p-6 shadow-lg sm:p-8">
		<div class="space-y-6">
			<ProductSelector
				products={productList}
				value={selectedProductId}
				onchange={onProductChange}
				disabled={loadingVersions || loadingFiles}
			/>

			{#if selectedProductId}
				<VersionSelector
					{versions}
					value={selectedVersionId}
					onchange={(id) => {
						selectedVersionId = id;
						files = [];
						fileAttempts = null;
						fileResultMessage = '';
					}}
					onsubmit={onShowFiles}
					loading={loadingFiles}
					loadingVersions={loadingVersions}
					disabled={loadingVersions || loadingFiles}
				/>
			{/if}
		</div>
	</div>

	{#if fileAttempts}
		<StatusLog
			label="Fetching files"
			attempts={fileAttempts}
			resultMessage={fileResultMessage}
			loading={loadingFiles}
		/>
	{/if}

	<FileList {files} {error} />

	{#if selectedProductId}
		<details class="bg-vmw-surface border-vmw-border rounded-md border text-sm">
			<summary class="cursor-pointer px-4 py-3 font-semibold text-vmw-text-muted select-none">
				What do Core, Packages, etc. mean?
			</summary>
			<div class="border-vmw-border space-y-2 border-t px-4 py-3 text-vmw-text-muted">
				<dl class="space-y-1.5">
					<div class="flex gap-2">
						<dt class="font-medium text-vmw-text">Core</dt>
						<dd>— Main application installer</dd>
					</div>
					<div class="flex gap-2">
						<dt class="font-medium text-vmw-text">Packages</dt>
						<dd>— Additional components (VMware Tools ISOs, guest OS drivers, etc.)</dd>
					</div>
					<div class="flex gap-2">
						<dt class="font-medium text-vmw-text">Windows / Linux</dt>
						<dd>— Host operating system the build targets</dd>
					</div>
				</dl>
			</div>
		</details>
	{/if}
</div>
