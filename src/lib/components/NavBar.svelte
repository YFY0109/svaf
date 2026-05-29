<script lang="ts">
	import { page } from '$app/stores';
	import { siteConfig } from '$lib/config/site';
	import ThemeToggle from './ThemeToggle.svelte';

	let crumbs = $derived.by(() => {
		const path = $page.url.pathname.replace(/\/$/, '') || '/';
		if (path === '/') return [];
		const parts = path.split('/').filter(Boolean);
		const result: { label: string; href: string }[] = [];
		let accumulated = '';
		for (let i = 0; i < parts.length; i++) {
			accumulated += '/' + parts[i];
			result.push({ label: parts[i], href: accumulated });
		}
		return result;
	});
</script>

<nav class="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
	<div class="relative flex h-14 items-center justify-between px-4">
		<div class="flex items-center gap-1 min-w-0">
			<a href="/" class="shrink-0 hover:opacity-80 transition-opacity">
				<img src={siteConfig.icon} alt="Home" class="h-6 w-6 rounded-full" />
			</a>
			{#each crumbs as crumb, i}
				<span class="text-muted-foreground/40 mx-0.5 shrink-0">/</span>
				{#if i < crumbs.length - 1}
					<a href={crumb.href} class="text-xs text-muted-foreground hover:text-foreground truncate transition-colors shrink min-w-0">{crumb.label}</a>
				{:else}
					<span class="text-xs text-foreground font-medium truncate shrink min-w-0">{crumb.label}</span>
				{/if}
			{/each}
		</div>
		<div class="flex items-center gap-2 shrink-0 ml-2">
			<ThemeToggle />
		</div>
	</div>
</nav>
