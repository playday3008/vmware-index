<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import GitHubCorner from '$lib/components/GitHubCorner.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<title>VMware Product Download Index</title>
	<meta
		name="description"
		content="Browse and download VMware Workstation Pro, Fusion Pro, Player, and Remote Console builds. Sources: Broadcom, VMware, and Wayback Machine archives."
	/>
	<link rel="canonical" href="https://vmware-index.playday3008.dev" />
	<link rel="icon" href={favicon} />

	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://vmware-index.playday3008.dev" />
	<meta property="og:title" content="VMware Product Download Index" />
	<meta
		property="og:description"
		content="Browse and download VMware Workstation Pro, Fusion Pro, Player, and Remote Console builds. Sources: Broadcom, VMware, and Wayback Machine archives."
	/>
	<meta property="og:site_name" content="VMware Product Download Index" />

	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="VMware Product Download Index" />
	<meta
		name="twitter:description"
		content="Browse and download VMware Workstation Pro, Fusion Pro, Player, and Remote Console builds. Sources: Broadcom, VMware, and Wayback Machine archives."
	/>
</svelte:head>

<GitHubCorner href="https://github.com/playday3008/vmware-index" />

<div class="mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-8 sm:px-8">
	<header class="mb-10 text-center">
		<h1 class="text-2xl font-bold text-vmw-accent sm:text-3xl">VMware Product Download Index</h1>
		<p class="mt-2 text-vmw-text-muted">Select a product and version to get download links.</p>
	</header>

	<main class="flex-1">
		{@render children()}
	</main>

	<footer class="mt-16 mb-8 text-center text-xs text-vmw-text-muted">
		<p>
			Data sourced from Broadcom/VMware update servers and the Wayback Machine. Not affiliated with
			VMware or Broadcom.
		</p>
	</footer>
</div>
