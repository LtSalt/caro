<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import { initTheme } from '$lib/theme.svelte';
	import { onMount } from 'svelte';

	let { data, children } = $props();

	onMount(() => {
		initTheme();
	});
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-950">
	<Navbar user={data.user} invitationCount={data.invitationCount} />
	<main class="mx-auto max-w-4xl px-4 py-6">
		{@render children()}
	</main>
</div>
