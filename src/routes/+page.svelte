<script lang="ts">
	let { data } = $props();
</script>

{#if data.user}
	<meta http-equiv="refresh" content="0;url=/dashboard" />
{:else}
	<div class="flex flex-col items-center justify-center py-20">
		<h1 class="mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100">Split expenses with friends</h1>
		<p class="mb-8 text-lg text-gray-600 dark:text-gray-400">Track shared expenses and settle up easily.</p>
		<a
			href="/register"
			class="rounded-lg bg-gray-900 px-6 py-3 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
		>
			Get started
		</a>
	</div>
{/if}
