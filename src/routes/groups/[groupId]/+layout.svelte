<script lang="ts">
	import { page } from '$app/state';

	let { data, children } = $props();

	let tabs = $derived([
		{ href: `/groups/${data.group.id}`, label: 'Expenses' },
		{ href: `/groups/${data.group.id}/balances`, label: 'Balances' },
		{ href: `/groups/${data.group.id}/settings`, label: 'Settings' }
	]);
</script>

<div class="space-y-4">
	<div>
		<h1 class="text-2xl font-bold text-gray-900">{data.group.name}</h1>
		{#if data.group.description}
			<p class="text-sm text-gray-500">{data.group.description}</p>
		{/if}
	</div>

	<div class="flex gap-1 border-b border-gray-200">
		{#each tabs as tab}
			{@const isActive = page.url.pathname === tab.href}
			<a
				href={tab.href}
				class="border-b-2 px-4 py-2 text-sm font-medium transition {isActive
					? 'border-gray-900 text-gray-900'
					: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'}"
			>
				{tab.label}
			</a>
		{/each}
	</div>

	{@render children()}
</div>
