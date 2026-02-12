<script lang="ts">
	interface Props {
		user: { id: string; email: string; name: string } | null;
	}

	let { user }: Props = $props();
	let menuOpen = $state(false);
</script>

<nav class="border-b border-gray-200 bg-white shadow-sm">
	<div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
		<a href={user ? '/dashboard' : '/'} class="text-xl font-bold text-gray-900">Caro</a>

		{#if user}
			<div class="relative">
				<button
					onclick={() => (menuOpen = !menuOpen)}
					class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
				>
					{user.name}
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
					</svg>
				</button>

				{#if menuOpen}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div class="fixed inset-0 z-10" onclick={() => (menuOpen = false)} onkeydown={() => {}}></div>
					<div class="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
						<a href="/account" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onclick={() => (menuOpen = false)}>
							Account settings
						</a>
						<form method="POST" action="/logout">
							<button type="submit" class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
								Sign out
							</button>
						</form>
					</div>
				{/if}
			</div>
		{:else}
			<div class="flex gap-2">
				<a href="/login" class="rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Sign in</a>
				<a href="/register" class="rounded-lg bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-800">Sign up</a>
			</div>
		{/if}
	</div>
</nav>
