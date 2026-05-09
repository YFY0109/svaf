import { animate, inView, stagger, spring } from '@motionone/dom';

/**
 * Svelte action: 元素进入视口时播放动画
 * 用法: use:fadeInUp={{ delay: 0.1 }}
 */
export function fadeInUp(node: HTMLElement, opts: { delay?: number; duration?: number } = {}) {
	const { delay = 0, duration = 0.5 } = opts;

	node.style.opacity = '0';
	node.style.transform = 'translateY(20px)';

	const controls = inView(node, () => {
		animate(node, { opacity: 1, transform: 'translateY(0px)' }, { duration, delay, easing: spring() });
	});

	return {
		destroy() {
			controls();
		}
	};
}

/**
 * Svelte action: 元素进入视口时淡入
 * 用法: use:fadeIn={{ duration: 0.6 }}
 */
export function fadeIn(node: HTMLElement, opts: { delay?: number; duration?: number } = {}) {
	const { delay = 0, duration = 0.5 } = opts;

	node.style.opacity = '0';

	const controls = inView(node, () => {
		animate(node, { opacity: 1 }, { duration, delay });
	});

	return {
		destroy() {
			controls();
		}
	};
}

/**
 * Svelte action: 元素进入视口时从左滑入
 * 用法: use:slideInLeft={{ delay: 0.1 }}
 */
export function slideInLeft(node: HTMLElement, opts: { delay?: number; duration?: number } = {}) {
	const { delay = 0, duration = 0.5 } = opts;

	node.style.opacity = '0';
	node.style.transform = 'translateX(-30px)';

	const controls = inView(node, () => {
		animate(node, { opacity: 1, transform: 'translateX(0px)' }, { duration, delay, easing: spring() });
	});

	return {
		destroy() {
			controls();
		}
	};
}

/**
 * Svelte action: 元素进入视口时从右滑入
 * 用法: use:slideInRight={{ delay: 0.1 }}
 */
export function slideInRight(node: HTMLElement, opts: { delay?: number; duration?: number } = {}) {
	const { delay = 0, duration = 0.5 } = opts;

	node.style.opacity = '0';
	node.style.transform = 'translateX(30px)';

	const controls = inView(node, () => {
		animate(node, { opacity: 1, transform: 'translateX(0px)' }, { duration, delay, easing: spring() });
	});

	return {
		destroy() {
			controls();
		}
	};
}

/**
 * Svelte action: 元素进入视口时从下方弹入
 * 用法: use:popIn={{ delay: 0.1 }}
 */
export function popIn(node: HTMLElement, opts: { delay?: number; duration?: number } = {}) {
	const { delay = 0, duration = 0.5 } = opts;

	node.style.opacity = '0';
	node.style.transform = 'scale(0.8)';

	const controls = inView(node, () => {
		animate(node, { opacity: 1, transform: 'scale(1)' }, { duration, delay, easing: spring({ stiffness: 300, damping: 20 }) });
	});

	return {
		destroy() {
			controls();
		}
	};
}

/**
 * Svelte action: 列表项依次出现（交错动画）
 * 用法: use:staggerChildren={{ delay: 0.1 }}
 */
export function staggerChildren(node: HTMLElement, opts: { delay?: number; duration?: number } = {}) {
	const { delay = 0.1, duration = 0.4 } = opts;

	const children = Array.from(node.children) as HTMLElement[];
	children.forEach((child) => {
		child.style.opacity = '0';
		child.style.transform = 'translateY(15px)';
	});

	const controls = inView(node, () => {
		animate(
			children,
			{ opacity: 1, transform: 'translateY(0px)' },
			{ duration, delay: stagger(delay), easing: spring() }
		);
	});

	return {
		destroy() {
			controls();
		}
	};
}

export { animate, inView, stagger, spring };
