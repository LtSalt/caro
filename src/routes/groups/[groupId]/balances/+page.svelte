<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatCurrency } from '$lib/utils';
	import type { Debt } from '$lib/balance';

	let { data } = $props();

	let debts = $derived(data.debts as Debt[]);
	let group = $derived(data.group);
	let members = $derived(data.members);

	let showSettleAllModal = $state(false);

	function getUserName(userId: string): string {
		const member = members.find((m: Record<string, unknown>) => m.id === userId);
		return (member as { name?: string; email?: string })?.name || (member as { email?: string })?.email || 'Unknown';
	}
</script>

<div class="mt-4 space-y-6">
	<div>
		<div class="mb-3 flex items-center justify-between">
			<h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Who owes whom</h2>
			<button
				onclick={() => (showSettleAllModal = true)}
				disabled={debts.length === 0}
				class="rounded-lg px-4 py-2 text-sm {debts.length > 0 ? 'cursor-pointer bg-green-700 text-white hover:bg-green-800' : 'cursor-default bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-500'}"
			>
				Settle
			</button>
		</div>

		{#if debts.length === 0}
			<div class="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
				<p class="text-gray-500 dark:text-gray-400">All settled up!</p>
			</div>
		{:else}
			<div class="space-y-2">
				{#each debts as debt}
					<div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
						<div>
							<span class="font-medium text-gray-900 dark:text-gray-100">{getUserName(debt.from)}</span>
							<span class="text-gray-500 dark:text-gray-400"> owes </span>
							<span class="font-medium text-gray-900 dark:text-gray-100">{getUserName(debt.to)}</span>
						</div>
						<div class="flex items-center gap-3">
							<span class="font-semibold text-red-600 dark:text-red-400">
								{formatCurrency(debt.amount, group.currency)}
							</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

</div>

{#if showSettleAllModal}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={(e) => { if (e.target === e.currentTarget) showSettleAllModal = false; }}
		onkeydown={() => {}}
	>
		<div class="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
			<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Settle all?</h3>
			<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
				This will mark all unsettled expenses in this group as settled.
			</p>
			<div class="mt-4 grid grid-cols-2 gap-2">
				<button
					onclick={() => (showSettleAllModal = false)}
					class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
				>
					Cancel
				</button>
				<form
					method="POST"
					action="?/settleAll"
					use:enhance={() => {
						return async ({ update }) => {
							showSettleAllModal = false;
							await update();
						};
					}}
				>
					<button
						type="submit"
						class="w-full rounded-lg bg-green-700 px-4 py-2 text-sm text-white hover:bg-green-800"
					>
						Settle
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}
