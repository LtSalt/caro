<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';

	let { data, children } = $props();
</script>

<div class="min-h-screen bg-gray-50">
	<Navbar user={data.user} />
	<main class="mx-auto max-w-4xl px-4 py-6">
		{@render children()}
	</main>
</div>
