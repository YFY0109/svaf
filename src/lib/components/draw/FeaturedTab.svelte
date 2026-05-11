<script lang="ts">
	import Icon from '@iconify/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { onMount, onDestroy } from 'svelte';
	import PhotoSwipeLightbox from 'photoswipe/lightbox';
	import 'photoswipe/style.css';
	import { fetchFeatured, getImageUrl, getImageProxyUrl } from '$lib/draw/api/client';
	import { resolveUsername } from '$lib/draw/stores/username';
	import type { DrawOutputItem } from '$lib/draw/types';

	const tip = '精选图片由管理员挑选，展示社区优质作品。';

	let {
		onFork
	}: {
		onFork?: (path: string) => void;
	} = $props();

	let items = $state<DrawOutputItem[]>([]);
	let loading = $state(true);
	let names = $state<Record<string, string>>({});

	$effect(() => {
		for (const item of items) {
			if (item.creator_id && !(item.creator_id in names)) {
				resolveUsername(item.creator_id).then((name) => {
					if (name !== item.creator_id) {
						names = { ...names, [item.creator_id!]: name };
					}
				});
			}
		}
	});

	let galleryEl: HTMLElement;
	let lightbox: PhotoSwipeLightbox | null = null;

	function initLightbox() {
		lightbox?.destroy();
		if (!galleryEl) return;
		const creatorByPath = new Map<string, string>();
		for (const it of items) {
			if (it.creator_id) creatorByPath.set(it.path, it.creator_id);
		}
		lightbox = new PhotoSwipeLightbox({
			gallery: galleryEl,
			children: 'a',
			pswpModule: () => import('photoswipe')
		});
		lightbox.addFilter('itemData', (itemData) => {
			const a = itemData.element as HTMLAnchorElement;
			const img = a?.querySelector('img') as HTMLImageElement | null;
			return {
				src: a.href,
				width: img?.naturalWidth || 1600,
				height: img?.naturalHeight || 1200,
				alt: img?.alt || ''
			};
		});
		if (onFork) addForkButton(lightbox);
		addCreatorElement(lightbox, creatorByPath);
		lightbox.init();
	}

	function addForkButton(lb: PhotoSwipeLightbox) {
		lb.on('uiRegister', () => {
			lb.pswp.ui.registerElement({
				name: 'fork-button',
				order: 9,
				isButton: true,
				title: 'Fork 工作流',
				html: '<svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"/><path d="M12 12v3"/></svg>',
				onClick: (_e, _el, pswp) => {
					const src = pswp.currSlide?.data?.src;
					if (!src) return;
					const p = new URL(src, location.origin).searchParams.get('path');
					if (p) onFork!(p);
					pswp.close();
				}
			});
		});
	}

	function addCreatorElement(lb: PhotoSwipeLightbox, creatorByPath: Map<string, string>) {
		lb.on('uiRegister', () => {
			lb.pswp.ui.registerElement({
				name: 'creator-info',
				order: 8,
				appendTo: 'wrapper',
				onInit: (el) => {
					Object.assign(el.style, {
						position: 'absolute',
						bottom: '60px',
						left: '50%',
						transform: 'translateX(-50%)',
						background: 'rgba(0,0,0,0.6)',
						color: '#fff',
						padding: '4px 12px',
						borderRadius: '4px',
						fontSize: '13px',
						cursor: 'pointer',
						zIndex: '10',
						whiteSpace: 'nowrap',
						display: 'none'
					});
					function update() {
						const src = lb.pswp.currSlide?.data?.src;
						if (!src) { el.style.display = 'none'; return; }
						const p = new URL(src, location.origin).searchParams.get('path');
						const cid = p ? (creatorByPath.get(p) || '') : '';
						if (cid) {
							const label = names[cid] || `UID:${cid}`;
							el.textContent = `生图者: ${label}`;
							el.onclick = () => window.open(`/forum/u/${cid}`, '_blank');
							el.style.display = 'block';
						} else {
							el.style.display = 'none';
						}
					}
					lb.pswp.on('change', update);
					lb.pswp.on('openingAnimationEnd', update);
				}
			});
		});
	}

	$effect(() => {
		loadFeatured();
	});

	onDestroy(() => lightbox?.destroy());

	async function loadFeatured() {
		loading = true;
		try {
			const res = await fetchFeatured();
			items = res.items;
		} catch {
			items = [];
		} finally {
			loading = false;
		}
		queueMicrotask(initLightbox);
	}
</script>

<div class="space-y-3">
	<div class="flex items-center justify-between">
		<h3 class="text-sm font-medium flex items-center gap-1.5">
			<Icon icon="mdi:star-outline" class="size-4" />
			精选
			<span class="text-xs text-muted-foreground">({items.length})</span>
		</h3>
		<Button variant="ghost" size="sm" onclick={loadFeatured} disabled={loading}>
			<Icon icon="mdi:refresh" class="size-4" />
		</Button>
	</div>

	{#if tip}
		<Alert>
			<AlertDescription class="text-xs">{tip}</AlertDescription>
		</Alert>
	{/if}

	{#if loading}
		<div class="text-xs text-muted-foreground py-8 text-center">加载中...</div>
	{:else if items.length === 0}
		<div class="text-xs text-muted-foreground py-8 text-center">暂无精选图片</div>
	{:else}
		<div bind:this={galleryEl} class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
			{#each items as item}
				<a
					href={getImageUrl(item.path)}
					class="aspect-square rounded-lg overflow-hidden border hover:ring-2 hover:ring-primary/50 transition-all block"
				>
					<img
						src={getImageProxyUrl(item.path)}
						alt={item.path}
						class="w-full h-full object-cover"
						loading="lazy"
					/>
				</a>
			{/each}
		</div>
	{/if}
</div>
