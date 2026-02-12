<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatCurrency, formatDate } from '$lib/utils';
	import type { Debt } from '$lib/balance';

	let { data, form } = $props();

	let debts = $derived(data.debts as Debt[]);
	let settlements = $derived(data.settlements);
	let group = $derived(data.group);
	let members = $derived(data.members);

	let settleDebt = $state<Debt | null>(null);

	function getUserName(userId: string): string {
		const member = members.find((m: Record<string, unknown>) => m.user === userId);
		const expandUser = (member?.expand as Record<string, Record<string, string>> | undefined)?.user;
		return expandUser?.name || expandUser?.email || 'Unknown';
	}
</script>

<div class="mt-4 space-y-6">
	{#if form?.error}
		<div class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{form.error}</div>
	{/if}

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
							<button
								onclick={() => (settleDebt = debt)}
								class="rounded bg-green-50 px-3 py-1 text-sm font-medium text-green-700 hover:bg-green-100"
							>
								Settle
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	{#if settlements.length > 0}
		<div>
			<h2 class="mb-3 text-lg font-semibold text-gray-900">Settlement history</h2>
			<div class="space-y-2">
				{#each settlements as settlement}
					<div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
						<div class="text-sm text-gray-600">
							<span class="font-medium text-gray-900">{settlement.expand?.paid_by?.name || 'Unknown'}</span>
							paid
							<span class="font-medium text-gray-900">{settlement.expand?.paid_to?.name || 'Unknown'}</span>
						</div>
						<div class="text-right">
							<span class="font-semibold text-green-600">
								{formatCurrency(settlement.amount, group.currency)}
							</span>
							<div class="text-xs text-gray-400">{formatDate(settlement.date)}</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<!-- Settlement confirmation modal -->
{#if settleDebt}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={(e) => { if (e.target === e.currentTarget) settleDebt = null; }}
		onkeydown={() => {}}
	>
		<div class="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
			<h3 class="mb-4 text-lg font-semibold text-gray-900">Confirm settlement</h3>
			<p class="mb-4 text-gray-600">
				<span class="font-medium">{getUserName(settleDebt.from)}</span> pays
				<span class="font-medium">{getUserName(settleDebt.to)}</span>
				<span class="font-semibold"> {formatCurrency(settleDebt.amount, group.currency)}</span>
			</p>

			<form
				method="POST"
				action="?/settle"
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === 'success') {
							settleDebt = null;
						}
						await update();
					};
				}}
			>
				<input type="hidden" name="paid_by" value={settleDebt.from} />
				<input type="hidden" name="paid_to" value={settleDebt.to} />
				<input type="hidden" name="amount" value={settleDebt.amount} />

				<div class="flex gap-2">
					<button
						type="button"
						onclick={() => (settleDebt = null)}
						class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
					>
						Confirm
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
