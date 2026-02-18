let isDark = $state(false);

function apply(animate = false) {
	if (animate && document.startViewTransition) {
		document.startViewTransition(() => {
			document.documentElement.classList.toggle('dark', isDark);
		});
	} else {
		document.documentElement.classList.toggle('dark', isDark);
	}
}

export function initTheme() {
	isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	apply();

	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
		isDark = e.matches;
		apply();
	});
}

export function toggleTheme() {
	isDark = !isDark;
	apply(true);
}

export function getThemeState() {
	return {
		get isDark() { return isDark; }
	};
}
