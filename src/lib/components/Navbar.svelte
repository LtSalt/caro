<script lang="ts">
	import { toggleTheme, getThemeState } from '$lib/theme.svelte';
	import { invalidateAll } from '$app/navigation';

	interface Invitation {
		id: string;
		name: string;
	}

	interface Props {
		user: { id: string; email: string; name: string } | null;
		invitationCount: number;
	}

	let { user, invitationCount }: Props = $props();
	let menuOpen = $state(false);
	let bellOpen = $state(false);
	let invitations = $state<Invitation[]>([]);
	let loadingInvitations = $state(false);
	let fetchError = $state(false);
	let countOffset = $state(0);
	let displayCount = $derived(invitationCount + countOffset);
	const theme = getThemeState();

	async function openBell() {
		if (bellOpen) {
			bellOpen = false;
			return;
		}
		bellOpen = true;
		loadingInvitations = true;
		fetchError = false;
		try {
			const res = await fetch('/api/invitations');
			if (res.ok) {
				invitations = await res.json();
				countOffset = invitations.length - invitationCount;
			} else {
				fetchError = true;
			}
		} catch {
			fetchError = true;
		} finally {
			loadingInvitations = false;
		}
	}

	async function respond(groupId: string, action: 'accept' | 'decline') {
		invitations = invitations.filter((inv) => inv.id !== groupId);
		countOffset--;

		await fetch('/api/invitations', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ groupId, action })
		});

		if (action === 'accept') {
			bellOpen = false;
			await invalidateAll();
		}
	}
</script>

<nav class="border-b border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
	<div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
		<a href={user ? '/dashboard' : '/'} class="text-xl font-bold text-gray-900 dark:text-gray-100">Caro</a>

		<div class="flex items-center gap-2">
			<button
				onclick={toggleTheme}
				class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
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
				<!-- Invitation bell -->
				<div class="relative">
					<button
						onclick={openBell}
						class="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
						title="Invitations"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
						</svg>
						{#if displayCount > 0}
							<span class="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
								{displayCount > 9 ? '9+' : displayCount}
							</span>
						{/if}
					</button>

					{#if bellOpen}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div class="fixed inset-0 z-10" onclick={() => (bellOpen = false)} onkeydown={() => {}}></div>
						<div class="absolute right-0 z-20 mt-1 w-72 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
							<div class="border-b border-gray-200 px-4 py-2 dark:border-gray-700">
								<p class="text-sm font-semibold text-gray-900 dark:text-gray-100">Invitations</p>
							</div>
							{#if loadingInvitations}
								<p class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">Loading...</p>
							{:else if fetchError}
								<p class="px-4 py-3 text-sm text-red-500 dark:text-red-400">Failed to load invitations.</p>
							{:else if invitations.length === 0}
								<p class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">No pending invitations.</p>
							{:else}
								<div class="divide-y divide-gray-100 dark:divide-gray-700">
									{#each invitations as invitation}
										<div class="px-4 py-3">
											<p class="text-sm text-gray-900 dark:text-gray-100">
												You've been invited to <span class="font-medium">{invitation.name}</span>
											</p>
											<div class="mt-2 flex gap-2">
												<button
													onclick={() => respond(invitation.id, 'accept')}
													class="cursor-pointer rounded-lg bg-gray-900 px-3 py-1 text-xs text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
												>
													Accept
												</button>
												<button
													onclick={() => respond(invitation.id, 'decline')}
													class="cursor-pointer rounded-lg border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
												>
													Decline
												</button>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/if}
				</div>

				<!-- User menu -->
				<div class="relative">
					<button
						onclick={() => (menuOpen = !menuOpen)}
						class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
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
							<a href="/account" class="block cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700" onclick={() => (menuOpen = false)}>
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
