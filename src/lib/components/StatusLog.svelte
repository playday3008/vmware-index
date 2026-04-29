<script lang="ts">
	import type { SourceAttempt } from '$lib/types';

	interface LogEntry {
		time: string;
		message: string;
		status: 'info' | 'success' | 'failed';
	}

	interface Props {
		label: string;
		attempts: SourceAttempt[] | null;
		resultMessage?: string;
		loading?: boolean;
	}

	let { label, attempts, resultMessage, loading = false }: Props = $props();

	let entries = $derived.by(() => {
		const logs: LogEntry[] = [];
		const now = new Date();
		const fmt = (offset: number) => {
			const d = new Date(now.getTime() - offset);
			return d.toLocaleTimeString('en-US', { hour12: false });
		};

		if (!attempts) {
			if (loading) {
				logs.push({ time: fmt(0), message: `${label}...`, status: 'info' });
			}
			return logs;
		}

		let cumulativeMs = 0;
		const totalMs = attempts.reduce((sum, a) => sum + a.ms, 0);

		for (const attempt of attempts) {
			const offsetFromEnd = totalMs - cumulativeMs;
			const statusText = attempt.status === 'success' ? 'success' : 'failed';
			logs.push({
				time: fmt(offsetFromEnd),
				message: `Trying ${attempt.name}... ${statusText} (${(attempt.ms / 1000).toFixed(1)}s)`,
				status: attempt.status
			});
			cumulativeMs += attempt.ms;
		}

		if (resultMessage) {
			logs.push({ time: fmt(0), message: resultMessage, status: 'success' });
		}

		return logs;
	});
</script>

{#if entries.length > 0}
	<div
		class="mb-4 max-h-40 overflow-y-auto rounded-md border border-vmw-border bg-vmw-surface p-3 font-mono text-xs"
	>
		{#each entries as entry (entry.time + entry.message)}
			<div class="py-0.5">
				<span class="text-vmw-text-muted">[{entry.time}]</span>
				<span
					class={entry.status === 'success'
						? 'text-vmw-success'
						: entry.status === 'failed'
							? 'text-vmw-error'
							: 'text-vmw-text-muted'}
				>
					{entry.message}
				</span>
			</div>
		{/each}
		{#if loading}
			<div class="py-0.5">
				<span class="text-vmw-text-muted">[...]</span>
				<span class="animate-pulse text-vmw-text-muted">Working...</span>
			</div>
		{/if}
	</div>
{/if}
