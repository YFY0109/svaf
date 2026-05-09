import { animate, inView, stagger, spring } from '@motionone/dom';

/**
 * Svelte action: 元素进入视口时播放动画
 * 配合 CSS class .mo-fade-in-up 使用，初始状态由 CSS 控制
 */
export function fadeInUp(node: HTMLElement, opts: { delay?: number; duration?: number } = {}) {
	const { delay = 0, duration = 0.5 } = opts;

	const controls = inView(node, () => {
		node.classList.add('mo-ready');
		animate(node, { opacity: [0, 1], transform: ['translateY(20px)', 'translateY(0px)'] }, { duration, delay, easing: spring() });
	});

	return { destroy() { controls(); } };
}

/**
 * Svelte action: 元素进入视口时淡入
 */
export function fadeIn(node: HTMLElement, opts: { delay?: number; duration?: number } = {}) {
	const { delay = 0, duration = 0.5 } = opts;

	const controls = inView(node, () => {
		node.classList.add('mo-ready');
		animate(node, { opacity: [0, 1] }, { duration, delay });
	});

	return { destroy() { controls(); } };
}

/**
 * Svelte action: 元素进入视口时从左滑入
 */
export function slideInLeft(node: HTMLElement, opts: { delay?: number; duration?: number } = {}) {
	const { delay = 0, duration = 0.5 } = opts;

	const controls = inView(node, () => {
		node.classList.add('mo-ready');
		animate(node, { opacity: [0, 1], transform: ['translateX(-30px)', 'translateX(0px)'] }, { duration, delay, easing: spring() });
	});

	return { destroy() { controls(); } };
}

/**
 * Svelte action: 元素进入视口时从右滑入
 */
export function slideInRight(node: HTMLElement, opts: { delay?: number; duration?: number } = {}) {
	const { delay = 0, duration = 0.5 } = opts;

	const controls = inView(node, () => {
		node.classList.add('mo-ready');
		animate(node, { opacity: [0, 1], transform: ['translateX(30px)', 'translateX(0px)'] }, { duration, delay, easing: spring() });
	});

	return { destroy() { controls(); } };
}

/**
 * Svelte action: 元素进入视口时从下方弹入
 */
export function popIn(node: HTMLElement, opts: { delay?: number; duration?: number } = {}) {
	const { delay = 0, duration = 0.5 } = opts;

	const controls = inView(node, () => {
		node.classList.add('mo-ready');
		animate(node, { opacity: [0, 1], transform: ['scale(0.8)', 'scale(1)'] }, { duration, delay, easing: spring({ stiffness: 300, damping: 20 }) });
	});

	return { destroy() { controls(); } };
}

/**
 * Svelte action: 列表项依次出现（交错动画）
 */
export function staggerChildren(node: HTMLElement, opts: { delay?: number; duration?: number } = {}) {
	const { delay = 0.1, duration = 0.4 } = opts;

	const children = Array.from(node.children) as HTMLElement[];

	const controls = inView(node, () => {
		children.forEach((child) => child.classList.add('mo-ready'));
		animate(
			children,
			{ opacity: [0, 1], transform: ['translateY(15px)', 'translateY(0px)'] },
			{ duration, delay: stagger(delay), easing: spring() }
		);
	});

	return { destroy() { controls(); } };
}

export { animate, inView, stagger, spring };
