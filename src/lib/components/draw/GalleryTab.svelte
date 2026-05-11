<script lang="ts">
	import Icon from '@iconify/svelte';
	import { Button } from '$lib/components/ui/button';
	import { onMount, onDestroy } from 'svelte';
	import PhotoSwipeLightbox from 'photoswipe/lightbox';
	import 'photoswipe/style.css';
	import { fetchOutputList, getImageUrl, getImageProxyUrl } from '$lib/draw/api/client';
	import { resolveUsername } from '$lib/draw/stores/username';
	import type { DrawOutputItem } from '$lib/draw/types';

	let {
		onFork
	}: {
		onFork?: (path: string) => void;
	} = $props();

	let items = $state<DrawOutputItem[]>([]);
	let total = $state(0);
	let loading = $state(false);
	let offset = $state(0);
	const limit = 30;
	let hasMore = $derived(offset < total);
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
		const creatorMap = new Map<string, string>();
		for (const it of items) {
			if (it.creator_id) creatorMap.set(getImageUrl(it.path), it.creator_id);
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
				alt: img?.alt || '',
				creator_id: creatorMap.get(a.href) || ''
			};
		});
		if (onFork) addForkButton(lightbox);
		addCreatorElement(lightbox);
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

	function addCreatorElement(lb: PhotoSwipeLightbox) {
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
					lb.pswp.on('change', () => {
						const data = lb.pswp.currSlide?.data as Record<string, unknown> | undefined;
						const cid = (data?.creator_id as string) || '';
						if (cid) {
							const label = names[cid] || `UID:${cid}`;
							el.textContent = `生图者: ${label}`;
							el.onclick = () => window.open(`/forum/u/${cid}`, '_blank');
							el.style.display = 'block';
						} else {
							el.style.display = 'none';
						}
					});
				}
			});
		});
	}

	$effect(() => {
		loadGallery();
	});

	onMount(() => {
		queueMicrotask(initLightbox);
	});

	onDestroy(() => lightbox?.destroy());

	async function loadGallery() {
		loading = true;
		try {
			const res = await fetchOutputList(limit, 0);
			items = res.items;
			total = res.total;
			offset = res.items.length;
		} catch {
			items = [];
		} finally {
			loading = false;
		}
	}

	async function loadMore() {
		if (loading || !hasMore) return;
		loading = true;
		try {
			const res = await fetchOutputList(limit, offset);
			items = [...items, ...res.items];
			offset += res.items.length;
			queueMicrotask(initLightbox);
		} catch {
			// ignore
		} finally {
			loading = false;
		}
	}
</script>

<div class="space-y-3">
	<div class="flex items-center justify-between">
		<h3 class="text-sm font-medium flex items-center gap-1.5">
			<Icon icon="mdi:image-multiple-outline" class="size-4" />
			画廊
			<span class="text-xs text-muted-foreground">({items.length}/{total})</span>
		</h3>
		<Button variant="ghost" size="sm" onclick={loadGallery} disabled={loading}>
			<Icon icon="mdi:refresh" class="size-4" />
		</Button>
	</div>

	{#if items.length === 0 && !loading}
		<div class="text-xs text-muted-foreground py-8 text-center">暂无图片</div>
	{:else}
		<div bind:this={galleryEl} class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
			{#each items as item}
				<a
					href={getImageUrl(item.path)}
					class="aspect-square rounded-md overflow-hidden border hover:ring-2 hover:ring-primary/50 transition-all block"
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

		{#if hasMore}
			<div class="text-center">
				<Button variant="outline" size="sm" onclick={loadMore} disabled={loading}>
					{#if loading}
						<Icon icon="mdi:loading" class="size-4 animate-spin mr-1" />
					{/if}
					加载更多
				</Button>
			</div>
		{/if}
	{/if}
</div>
