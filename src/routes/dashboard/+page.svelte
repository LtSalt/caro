<script lang="ts">
	let { data } = $props();
	let groups = $derived(data.groups);
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-900">My Groups</h1>
		<a
			href="/groups/new"
			class="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800"
		>
			Create group
		</a>
	</div>

	{#if groups.length === 0}
		<div class="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
			<p class="text-gray-500">No groups yet. Create one to start splitting expenses.</p>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2">
			{#each groups as group}
				<a
					href="/groups/{group.id}"
					class="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
				>
					<div class="flex items-start justify-between">
						<div>
							<h2 class="font-semibold text-gray-900">{group.name}</h2>
							{#if group.description}
								<p class="mt-1 text-sm text-gray-500">{group.description}</p>
							{/if}
						</div>
						<span class="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
							{group.currency}
						</span>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
