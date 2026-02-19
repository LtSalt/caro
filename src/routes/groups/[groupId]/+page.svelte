<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatCurrency, formatDate } from '$lib/utils';
	import AddExpenseModal from '$lib/components/AddExpenseModal.svelte';
	import type { RecordModel } from 'pocketbase';

	let { data, form } = $props();
	let showAddModal = $state(false);
	let editingExpense = $state<RecordModel | null>(null);

	let expenses = $derived(data.expenses);
	let deletedExpenses = $derived(data.deletedExpenses);
	let splitsByExpense = $derived(data.splitsByExpense);
	let group = $derived(data.group);
	let members = $derived(data.members);
	let currentUserId = $derived(data.currentUserId);
	let settledExpenseIds = $derived(new Set(data.settledExpenseIds));

	let activeExpenses = $derived(expenses.filter((e) => !settledExpenseIds.has(e.id)));
	let settledExpenses = $derived(expenses.filter((e) => settledExpenseIds.has(e.id)));

	function daysUntilPurge(deletedAt: string): number {
		return Math.max(0, 30 - Math.floor((Date.now() - new Date(deletedAt).getTime()) / 86400000));
	}

	function getUserShare(expense: RecordModel): number | null {
		const splits = splitsByExpense[expense.id];
		if (!splits) return null;
		const mySplit = splits.find((s) => s.user === currentUserId);
		if (!mySplit) return null;

		if (expense.paid_by === currentUserId) {
			return expense.amount - mySplit.amount;
		} else {
			return -mySplit.amount;
		}
	}
</script>

<div class="mt-4 space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Expenses</h2>
		<button
			onclick={() => (showAddModal = true)}
			class="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
		>
			Add expense
		</button>
	</div>

	{#if form?.error}
		<div class="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{form.error}</div>
	{/if}

	<div>
		<h3 class="mb-2 text-sm font-medium text-gray-400">Open</h3>
		{#if activeExpenses.length === 0}
			<p class="text-sm text-gray-400 dark:text-gray-500">No open expenses.</p>
		{:else}
			<div class="space-y-2">
				{#each activeExpenses as expense}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
						onclick={() => (editingExpense = expense)}
					>
						<div class="flex-1">
							<div class="font-medium text-gray-900 dark:text-gray-100">{expense.description}</div>
							<div class="text-sm text-gray-500 dark:text-gray-400">
								Paid by {expense.expand?.paid_by?.name || 'Unknown'} &middot; {formatDate(expense.date)}
							</div>
							{#each [getUserShare(expense)] as share}
								{#if share !== null && share !== 0}
									<div class="mt-0.5 text-xs {share > 0 ? 'text-green-700 dark:text-green-600' : 'text-red-600 dark:text-red-400'}">
										{share > 0 ? `You get back ${formatCurrency(share, group.currency)}` : `You owe ${formatCurrency(Math.abs(share), group.currency)}`}
									</div>
								{/if}
							{/each}
						</div>
						<div class="flex items-center gap-2">
							<span class="font-semibold text-gray-900 dark:text-gray-100">
								{formatCurrency(expense.amount, group.currency)}
							</span>
							{#each [getUserShare(expense)] as share}
								{#if share !== null && share !== 0}
									<form
										method="POST"
										action="?/settleExpense"
										use:enhance={() => async ({ update }) => { await update(); }}
									>
										<input type="hidden" name="expenseId" value={expense.id} />
										<button
											type="submit"
											onclick={(e) => e.stopPropagation()}
											class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-green-700 dark:hover:bg-gray-800 dark:hover:text-green-600"
											title="Settle"
										>
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
											</svg>
										</button>
									</form>
								{/if}
							{/each}
							<form
								method="POST"
								action="?/deleteExpense"
								use:enhance={() => async ({ update }) => { await update(); }}
							>
								<input type="hidden" name="expenseId" value={expense.id} />
								<button
									type="submit"
									onclick={(e) => e.stopPropagation()}
									class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-800 dark:hover:text-red-400"
									title="Delete"
								>
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
									</svg>
								</button>
							</form>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div class="mt-6">
		<h3 class="mb-2 text-sm font-medium text-gray-400">Settled</h3>
		{#if settledExpenses.length === 0}
			<p class="text-sm text-gray-400 dark:text-gray-500">No settled expenses.</p>
		{:else}
			<div class="space-y-2">
				{#each settledExpenses as expense}
					<div
						class="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50"
					>
						<div class="flex-1 opacity-60">
							<div class="font-medium text-gray-500 dark:text-gray-400">{expense.description}</div>
							<div class="text-sm text-gray-400 dark:text-gray-500">
								Paid by {expense.expand?.paid_by?.name || 'Unknown'} &middot; {formatDate(expense.date)}
							</div>
							<div class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
								Settled &middot; {daysUntilPurge(expense.settled_at)} days until removal
							</div>
							{#each [getUserShare(expense)] as share}
								{#if share !== null && share !== 0}
									<div class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
										{share > 0 ? `You got back ${formatCurrency(share, group.currency)}` : `You paid ${formatCurrency(Math.abs(share), group.currency)}`}
									</div>
								{/if}
							{/each}
						</div>
						<div class="flex items-center gap-2">
							<span class="font-semibold text-gray-400 opacity-60 dark:text-gray-500">
								{formatCurrency(expense.amount, group.currency)}
							</span>
							<form
								method="POST"
								action="?/unsettleExpense"
								use:enhance={() => {
									return async ({ update }) => {
										await update();
									};
								}}
							>
								<input type="hidden" name="expenseId" value={expense.id} />
								<button
									type="submit"
									onclick={(e) => e.stopPropagation()}
									class="rounded p-1 text-green-700 hover:bg-gray-100 hover:text-gray-400 dark:text-green-600 dark:hover:bg-gray-800"
									title="Unsettle"
								>
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
									</svg>
								</button>
							</form>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div class="mt-6">
		<h3 class="mb-2 text-sm font-medium text-gray-400">Deleted</h3>
		{#if deletedExpenses.length === 0}
			<p class="text-sm text-gray-400 dark:text-gray-500">No deleted expenses.</p>
		{:else}
			<div class="space-y-2">
				{#each deletedExpenses as expense}
					<div class="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
						<div class="flex-1 opacity-60">
							<div class="font-medium text-gray-500 dark:text-gray-400">{expense.description}</div>
							<div class="text-sm text-gray-400 dark:text-gray-500">
								Paid by {expense.expand?.paid_by?.name || 'Unknown'} &middot; {formatDate(expense.date)}
							</div>
							<div class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
								Deleted &middot; {daysUntilPurge(expense.deleted_at)} days until permanent removal
							</div>
						</div>
						<form
							method="POST"
							action="?/restoreExpense"
							use:enhance={() => async ({ update }) => { await update(); }}
						>
							<input type="hidden" name="expenseId" value={expense.id} />
							<button
								type="submit"
								class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-green-700 dark:hover:bg-gray-800 dark:hover:text-green-600"
								title="Restore"
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
								</svg>
							</button>
						</form>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

{#if showAddModal}
	<AddExpenseModal
		{group}
		{members}
		{currentUserId}
		onclose={() => (showAddModal = false)}
	/>
{/if}

{#if editingExpense}
	<AddExpenseModal
		{group}
		{members}
		{currentUserId}
		expense={editingExpense}
		expenseSplits={splitsByExpense[editingExpense.id] ?? []}
		onclose={() => (editingExpense = null)}
	/>
{/if}
