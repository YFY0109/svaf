<script lang="ts">
	import Icon from '@iconify/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardContent } from '$lib/components/ui/card';

	let imageSrc = $state<string | null>(null);
	let imageLoaded = $state<HTMLImageElement | null>(null);
	let watermarkText = $state('');
	let fontSize = $state(48);
	let opacity = $state(30);
	let position = $state('右下');
	let processedUrl = $state<string | null>(null);

	function handleFile(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		const img = new Image();
		img.onload = () => { imageLoaded = img; };
		img.src = URL.createObjectURL(file);
		imageSrc = img.src;
		input.value = '';
	}

	$effect(() => {
		const img = imageLoaded;
		const text = watermarkText.trim();
		if (!img || !text) { processedUrl = null; return; }

		const canvas = document.createElement('canvas');
		canvas.width = img.naturalWidth;
		canvas.height = img.naturalHeight;
		const ctx = canvas.getContext('2d')!;
		ctx.drawImage(img, 0, 0);

		ctx.font = `bold ${fontSize}px sans-serif`;
		ctx.fillStyle = `rgba(255,255,255,${opacity / 100})`;
		ctx.textBaseline = 'bottom';

		const textWidth = ctx.measureText(text).width;
		const padding = 20;
		let x: number, y: number;
		switch (position) {
			case '左上': x = padding; y = fontSize + padding; break;
			case '右上': x = canvas.width - textWidth - padding; y = fontSize + padding; break;
			case '左下': x = padding; y = canvas.height - padding; break;
			default: x = canvas.width - textWidth - padding; y = canvas.height - padding;
		}
		ctx.fillText(text, x, y);

		processedUrl = canvas.toDataURL('image/png');
	});

	function handleDownload() {
		if (!processedUrl) return;
		const a = document.createElement('a');
		a.href = processedUrl;
		a.download = 'watermarked.png';
		a.click();
	}
</script>

<div class="w-full max-w-lg mx-auto px-4 py-6 space-y-4">
	<div class="flex items-center gap-2">
		<Icon icon="mdi:water" class="size-6 text-primary" />
		<h1 class="text-xl font-bold">图片水印</h1>
	</div>

	<Card>
		<CardContent class="space-y-4 pt-6">
			<div class="space-y-1.5">
				<Label class="text-xs">选择图片</Label>
				<Input type="file" accept="image/png,image/jpeg,image/webp" onchange={handleFile} />
			</div>

			<div class="space-y-1.5">
				<Label class="text-xs">水印文字</Label>
				<Input bind:value={watermarkText} placeholder="2x.nz" />
			</div>

			<div class="grid grid-cols-3 gap-3">
				<div class="space-y-1.5">
					<Label class="text-xs">字体大小</Label>
					<Input type="number" bind:value={fontSize} min="12" max="200" />
				</div>
				<div class="space-y-1.5">
					<Label class="text-xs">透明度 (%)</Label>
					<Input type="number" bind:value={opacity} min="5" max="100" />
				</div>
				<div class="space-y-1.5">
					<Label class="text-xs">位置</Label>
					<select bind:value={position} class="w-full h-9 rounded-md border border-input bg-background px-3 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
						<option>左上</option>
						<option>右上</option>
						<option>左下</option>
						<option>右下</option>
					</select>
				</div>
			</div>
		</CardContent>
	</Card>

	{#if imageSrc}
		<Card>
			<CardContent class="pt-4 space-y-3">
				<img src={processedUrl || imageSrc} alt="水印结果" class="w-full rounded-lg border" />
				{#if processedUrl}
					<Button class="w-full" variant="default" onclick={handleDownload}>
						<Icon icon="mdi:download" class="size-4 mr-1" />
						下载图片
					</Button>
				{/if}
			</CardContent>
		</Card>
	{/if}
</div>
