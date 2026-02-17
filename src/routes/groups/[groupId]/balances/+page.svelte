<script lang="ts">
	import { formatCurrency } from '$lib/utils';
	import type { Debt } from '$lib/balance';

	let { data } = $props();

	let debts = $derived(data.debts as Debt[]);
	let group = $derived(data.group);
	let members = $derived(data.members);

	function getUserName(userId: string): string {
		const member = members.find((m: Record<string, unknown>) => m.id === userId);
		return (member as { name?: string; email?: string })?.name || (member as { email?: string })?.email || 'Unknown';
	}
</script>

<div class="mt-4 space-y-6">
	<div>
		<h2 class="mb-3 text-lg font-semibold text-gray-900">Who owes whom</h2>

		{#if debts.length === 0}
			<div class="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
				<p class="text-gray-500">All settled up!</p>
			</div>
		{:else}
			<div class="space-y-2">
				{#each debts as debt}
					<div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
						<div>
							<span class="font-medium text-gray-900">{getUserName(debt.from)}</span>
							<span class="text-gray-500"> owes </span>
							<span class="font-medium text-gray-900">{getUserName(debt.to)}</span>
						</div>
						<div class="flex items-center gap-3">
							<span class="font-semibold text-red-600">
								{formatCurrency(debt.amount, group.currency)}
							</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

</div>
