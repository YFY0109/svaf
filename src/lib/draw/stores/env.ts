import type { DrawApiEnv } from '../types';
import type { Readable, Writable } from 'svelte/store';
import { readLocalStorage, writeLocalStorage } from '$lib/forum/utils/storage';
import { derived, get, writable } from 'svelte/store';

export const DRAW_API_ENV_STORAGE_KEY = 'draw-api-env';
export const DRAW_API_CUSTOM_BASE_URL_STORAGE_KEY = 'draw-api-custom-base-url';

export const DRAW_API_BASE_URLS: Record<DrawApiEnv, string> = {
	prod: 'https://api-ai.2x.nz',
	dev: 'http://localhost:8080'
};

function normalizeBaseUrl(value: string) {
	return value.trim().replace(/\/+$/, '');
}

function normalizeEnv(value: DrawApiEnv | string | null | undefined): DrawApiEnv {
	return value === 'dev' ? 'dev' : 'prod';
}

function sanitizeBaseUrl(value: string | null | undefined, env: DrawApiEnv) {
	const v = normalizeBaseUrl(value || '');
	if (!v) return DRAW_API_BASE_URLS[env];
	try {
		const url = new URL(v);
		if (url.protocol !== 'http:' && url.protocol !== 'https:') {
			return DRAW_API_BASE_URLS[env];
		}
		return normalizeBaseUrl(url.toString());
	} catch {
		return DRAW_API_BASE_URLS[env];
	}
}

interface DrawCustomBaseUrlStore {
	subscribe: Writable<string>['subscribe'];
	set(value: string): void;
	reset(env: DrawApiEnv): void;
}

interface DrawEnvStore {
	subscribe: Writable<DrawApiEnv>['subscribe'];
	baseUrl: Readable<string>;
	customBaseUrl: DrawCustomBaseUrlStore;
	set(value: DrawApiEnv): void;
	toggle(): void;
	getBaseUrl(env: DrawApiEnv): string;
}

function createEnvStore(): DrawEnvStore {
	const initialEnv = normalizeEnv(
		readLocalStorage<DrawApiEnv | string>(DRAW_API_ENV_STORAGE_KEY, 'prod')
	);
	const initialCustomBaseUrl = sanitizeBaseUrl(
		readLocalStorage<string>(
			DRAW_API_CUSTOM_BASE_URL_STORAGE_KEY,
			DRAW_API_BASE_URLS[initialEnv]
		),
		initialEnv
	);
	const envStore = writable<DrawApiEnv>(initialEnv);
	const customBaseUrlStore = writable<string>(initialCustomBaseUrl);

	customBaseUrlStore.subscribe((value) => {
		writeLocalStorage(
			DRAW_API_CUSTOM_BASE_URL_STORAGE_KEY,
			sanitizeBaseUrl(value, get(envStore))
		);
	});

	const baseUrl = derived([envStore, customBaseUrlStore], ([$env, $custom]) =>
		sanitizeBaseUrl($custom, $env)
	);

	return {
		subscribe: envStore.subscribe,
		baseUrl,
		customBaseUrl: {
			subscribe: customBaseUrlStore.subscribe,
			set: (v) => customBaseUrlStore.set(sanitizeBaseUrl(v, get(envStore))),
			reset: (env) => customBaseUrlStore.set(DRAW_API_BASE_URLS[env])
		},
		set: (v) => {
			const next = normalizeEnv(v);
			writeLocalStorage(DRAW_API_ENV_STORAGE_KEY, next);
			envStore.set(next);
			customBaseUrlStore.set(DRAW_API_BASE_URLS[next]);
		},
		toggle: () => {
			let next: DrawApiEnv = 'prod';
			envStore.update((cur) => {
				next = cur === 'prod' ? 'dev' : 'prod';
				writeLocalStorage(DRAW_API_ENV_STORAGE_KEY, next);
				return next;
			});
			customBaseUrlStore.set(DRAW_API_BASE_URLS[next]);
		},
		getBaseUrl: (env) => DRAW_API_BASE_URLS[env]
	};
}

export const drawEnv: DrawEnvStore = createEnvStore();

const _redirectStore = writable<string>('');

/**
 * 探测 API 端点是否有重定向（CDN / 负载均衡），
 * 如有则后续请求全部使用重定向后的地址。
 * 应在页面加载时调用一次。
 */
export async function resolveApiRedirect(): Promise<string> {
	const baseUrl = get(drawEnv.baseUrl);
	try {
		const resp = await fetch(baseUrl, { method: 'HEAD', redirect: 'manual' });
		if (resp.status >= 300 && resp.status < 400) {
			const location = resp.headers.get('location');
			if (location) {
				const resolved = new URL(location, baseUrl).toString().replace(/\/+$/, '');
				if (resolved !== baseUrl) {
					_redirectStore.set(resolved);
					drawEnv.customBaseUrl.set(resolved);
					return resolved;
				}
			}
		}
	} catch {
		// 忽略错误，继续使用原地址
	}
	return baseUrl;
}

export const drawRedirectUrl = {
	subscribe: _redirectStore.subscribe,
};
