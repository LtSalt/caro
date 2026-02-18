<script lang="ts">
	import { toggleTheme, getThemeState } from '$lib/theme.svelte';

	interface Props {
		user: { id: string; email: string; name: string } | null;
	}

	let { user }: Props = $props();
	let menuOpen = $state(false);
	const theme = getThemeState();
</script>

<nav class="border-b border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
	<div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
		<a href={user ? '/dashboard' : '/'} class="text-xl font-bold text-gray-900 dark:text-gray-100">Caro</a>

		<div class="flex items-center gap-2">
			<button
				onclick={toggleTheme}
				class="cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
				title={theme.isDark ? 'Switch to light mode' : 'Switch to dark mode'}
			>
				{#if theme.isDark}
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
					</svg>
				{:else}
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
					</svg>
				{/if}
			</button>

			{#if user}
				<div class="relative">
					<button
						onclick={() => (menuOpen = !menuOpen)}
						class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
					>
						{user.name}
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>

					{#if menuOpen}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div class="fixed inset-0 z-10" onclick={() => (menuOpen = false)} onkeydown={() => {}}></div>
						<div class="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
							<a href="/account" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700" onclick={() => (menuOpen = false)}>
								Account settings
							</a>
							<form method="POST" action="/logout">
								<button type="submit" class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
									Sign out
								</button>
							</form>
						</div>
					{/if}
				</div>
			{:else}
				<div class="flex gap-2">
					<a href="/login" class="rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">Sign in</a>
					<a href="/register" class="rounded-lg bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200">Sign up</a>
				</div>
			{/if}
		</div>
	</div>
</nav>
