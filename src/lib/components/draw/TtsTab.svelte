<script lang="ts">
import Icon from '@iconify/svelte';
import { Button } from '$lib/components/ui/button';
import { Label } from '$lib/components/ui/label';
import { Alert, AlertDescription } from '$lib/components/ui/alert';
import { forumAuth } from '$lib/forum/stores/auth';
import { getImageUrl, uploadTtsRefAudio, drawRequest } from '$lib/draw/api/client';
import { Badge } from '$lib/components/ui/badge';
import { onMount } from 'svelte';
let {
  ttsPerChar = 0.01, ttsPerSec = 0.033, ttsMin = 1,
}: {
  ttsPerChar?: number;
  ttsPerSec?: number;
  ttsMin?: number;
} = $props();

type TtsMode = 'preset' | 'custom' | 'clone';
let mode = $state<TtsMode>('preset');

// Preset mode
let speakers = $state<Array<{ id: string; description: string }>>([]);
let selectedSpeaker = $state('Vivian');

// Clone & Custom mode
let instruct = $state('');

// Audio upload (clone only)
let audioFile = $state<File | null>(null);
let audioUrl = $state('');

// Shared
let targetText = $state('');
let language = $state('auto');
let submitting = $state(false);
let error = $state('');

let resultUrl = $state('');
let done = $state(false);

let estimatedCost = $derived(Math.max(ttsMin, Math.ceil(targetText.length * ttsPerChar)));
let costLabel = $derived(estimatedCost > 0 ? `⚡${estimatedCost}~` : '');

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  audioFile = file;
  audioUrl = URL.createObjectURL(file);
}

async function handleSubmit() {
  if (submitting || !targetText) return;
  error = '';
  submitting = true;
  try {
    let refName = undefined;
    if (mode === 'clone' && audioFile) {
      const uploadRes = await uploadTtsRefAudio(audioFile);
      refName = uploadRes.filename;
    }
    const res = await drawRequest<{ ok: boolean; filename: string; cost: number }>('/api/draw/tts/synthesize', {
      method: 'POST',
      json: {
        text: targetText,
        mode: mode,
        speaker: mode === 'preset' ? selectedSpeaker : undefined,
        instruct: instruct || undefined,
        ref_audio_name: refName,
      },
      requiresAuth: true,
    });
    if (res.ok && res.filename) {
      resultUrl = getImageUrl(res.filename);
      done = true;
    }
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : '提交失败';
  } finally {
    submitting = false;
  }
}

function handleReset() {
  resultUrl = '';
  done = false;
  error = '';
}

const PRESET_VOICES = [
  { id: 'mimo_default', description: 'MiMo-默认' },
  { id: '冰糖', description: '冰糖（女）' },
  { id: '茉莉', description: '茉莉（女）' },
  { id: '苏打', description: '苏打（男）' },
  { id: '白桦', description: '白桦（男）' },
  { id: 'Mia', description: 'Mia (English Female)' },
  { id: 'Chloe', description: 'Chloe (English Female)' },
  { id: 'Milo', description: 'Milo (English Male)' },
  { id: 'Dean', description: 'Dean (English Male)' },
];

onMount(async () => {
  speakers = PRESET_VOICES;
  if (speakers.length > 0) selectedSpeaker = speakers[0].id;
});

</script>

<div class="space-y-4">
  <h3 class="text-sm font-medium flex items-center gap-1.5">
    <Icon icon="mdi:voice" class="size-4" />
    语音合成 (TTS)
  </h3>

  <!-- Mode Toggle -->
  <div class="flex gap-2">
    <button onclick={() => { mode = 'preset'; handleReset(); }} class="px-3 py-1.5 text-xs rounded-lg border {mode === 'preset' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-accent'} transition-colors">预设音色</button>
    <button onclick={() => { mode = 'custom'; handleReset(); }} class="px-3 py-1.5 text-xs rounded-lg border {mode === 'custom' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-accent'} transition-colors">自定义音色</button>
    <button onclick={() => { mode = 'clone'; handleReset(); }} class="px-3 py-1.5 text-xs rounded-lg border {mode === 'clone' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-accent'} transition-colors">声音克隆</button>
  </div>

  {#if mode === 'preset'}
    <!-- Preset Voice -->
    <div class="space-y-1.5">
      <Label for="tts-speaker">预制音色</Label>
      <select id="tts-speaker" bind:value={selectedSpeaker} class="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs">
        {#each speakers as sp}
          <option value={sp.id}>{sp.id} — {sp.description}</option>
        {/each}
      </select>
    </div>
    <div class="space-y-1.5">
      <Label for="tts-instruct">风格指令 <span class="text-muted-foreground text-[10px]">(可选)</span></Label>
      <input id="tts-instruct" bind:value={instruct} placeholder="如：用特别愤怒的语气说、Very happy、悲伤地。支持(开心)[语速加快]等标签"
        class="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground" />
    </div>
  {:else if mode === 'custom'}
    <!-- Custom Voice Design -->
    <div class="space-y-1.5">
      <Label for="tts-instruct-custom">音色描述 <span class="text-muted-foreground text-[10px]">(可选)</span></Label>
      <input id="tts-instruct-custom" bind:value={instruct} placeholder="如：女人，萝莉音，难过，甜美，撒娇"
        class="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground" />
    </div>
  {:else}
    <!-- Voice Clone -->
    <div class="space-y-1.5">
      <Label for="tts-refaudio">参考音频 <span class="text-muted-foreground text-[10px]">(可选)</span></Label>
      <input id="tts-refaudio" type="file" accept="audio/*" onchange={handleFileSelect}
        class="block w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" />
      {#if audioFile}
        <div class="text-xs text-muted-foreground">{audioFile.name} ({(audioFile.size / 1024).toFixed(1)} KB)</div>
        <audio src={audioUrl} controls class="w-full h-10 mt-1" />
      {/if}
    </div>
    <div class="space-y-1.5">
      <Label for="tts-reftext">参考文本 <span class="text-muted-foreground text-[10px]">(可选)</span></Label>
      <textarea id="tts-reftext" bind:value={refText} rows={2}
        placeholder="输入参考音频对应的文本内容"
        class="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground resize-none"></textarea>
    </div>
  {/if}

  <!-- Language -->
  <div class="space-y-1.5">
    <Label for="tts-lang">语言</Label>
    <select id="tts-lang" bind:value={language} class="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs">
      <option value="auto">自动检测</option>
      <option value="zh">中文</option>
      <option value="en">英文</option>
      <option value="ja">日文</option>
      <option value="ko">韩文</option>
    </select>
  </div>

  <!-- Target Text -->
  <div class="space-y-1.5">
    <Label for="tts-text">要合成的文字</Label>
    <textarea id="tts-text" bind:value={targetText} rows={3}
      placeholder="输入要合成语音的文字内容"
      class="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground resize-none"></textarea>
  </div>

  <!-- Submit -->
  <Button onclick={handleSubmit}
    disabled={submitting || !targetText || done} class="w-full">
    <Icon icon="mdi:send" class="size-4 mr-1" />
    {submitting ? '合成中...' : done ? '已完成' : '开始生成'}
    {#if estimatedCost > 0}
      <Badge variant="secondary" class="ml-1.5 text-[10px] px-1">{costLabel}</Badge>
    {/if}
  </Button>

  <!-- Error -->
  {#if error}
    <Alert variant="destructive">
      <Icon icon="mdi:alert-circle" class="size-4" />
      <AlertDescription class="text-xs">{error}</AlertDescription>
    </Alert>
  {/if}

  <!-- Result -->
  {#if done}
    <div class="space-y-2 border rounded-lg p-3">
      <div class="text-xs font-medium flex items-center gap-1.5">
        <Icon icon="mdi:check-circle" class="size-4 text-green-500" />
        转换完成
      </div>
      {#if resultUrl}
        <audio src={resultUrl} controls class="w-full h-10" />
        <div class="flex gap-2">
          <a href={resultUrl} download class="flex-1">
            <Button variant="default" size="sm" class="w-full">
              <Icon icon="mdi:download" class="size-4 mr-1" />
              下载音频
            </Button>
          </a>
          <Button variant="outline" size="sm" onclick={handleReset}>重新开始</Button>
        </div>
      {:else}
        <div class="text-xs text-muted-foreground">
          音频文件处理中，请前往<a href="/draw/#mine" class="underline font-medium">"我的"页面</a>查看和下载。
        </div>
        <Button variant="outline" size="sm" onclick={handleReset}>重新开始</Button>
      {/if}
    </div>
  {/if}
</div>
