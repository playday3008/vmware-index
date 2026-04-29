<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-8 sm:px-8">
	<header class="mb-10 text-center">
		<h1 class="text-2xl font-bold text-vmw-accent sm:text-3xl">VMware Product Download Index</h1>
		<p class="mt-2 text-vmw-text-muted">
			Select a product and version to get download links.
		</p>
	</header>

	<main class="flex-1">
		{@render children()}
	</main>

	<footer class="mt-16 mb-8 text-center text-xs text-vmw-text-muted">
		<p>
			Data sourced from Broadcom/VMware update servers and the Wayback Machine. Not affiliated
			with VMware or Broadcom.
		</p>
	</footer>
</div>
