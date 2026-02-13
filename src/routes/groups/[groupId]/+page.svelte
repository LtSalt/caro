<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatCurrency, formatDate } from '$lib/utils';
	import AddExpenseModal from '$lib/components/AddExpenseModal.svelte';
	import type { RecordModel } from 'pocketbase';

	let { data, form } = $props();
	let showAddModal = $state(false);
	let editingExpense = $state<RecordModel | null>(null);

	let expenses = $derived(data.expenses);
	let splitsByExpense = $derived(data.splitsByExpense);
	let group = $derived(data.group);
	let members = $derived(data.members);
	let currentUserId = $derived(data.currentUserId);

	function getUserShare(expense: RecordModel): number | null {
		const splits = splitsByExpense[expense.id];
		if (!splits) return null;
		const mySplit = splits.find((s) => s.user === currentUserId);
		if (!mySplit) return null;

		if (expense.paid_by === currentUserId) {
			// I paid — I get back the total minus my own share
			return expense.amount - mySplit.amount;
		} else {
			// Someone else paid — I owe my share
			return -mySplit.amount;
		}
	}
</script>

<div class="mt-4 space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="text-lg font-semibold text-gray-900">Expenses</h2>
		<button
			onclick={() => (showAddModal = true)}
			class="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800"
		>
			Add expense
		</button>
	</div>

	{#if form?.error}
		<div class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{form.error}</div>
	{/if}

	{#if expenses.length === 0}
		<div class="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
			<p class="text-gray-500">No expenses yet. Add one to get started.</p>
		</div>
	{:else}
		<div class="space-y-2">
			{#each expenses as expense}
				<div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
					<div class="flex-1">
						<div class="font-medium text-gray-900">{expense.description}</div>
						<div class="text-sm text-gray-500">
							Paid by {expense.expand?.paid_by?.name || 'Unknown'} &middot; {formatDate(expense.date)}
						</div>
						{#each [getUserShare(expense)] as share}
							{#if share !== null && share !== 0}
								<div class="mt-0.5 text-xs {share > 0 ? 'text-green-600' : 'text-red-600'}">
									{share > 0 ? `You get back ${formatCurrency(share, group.currency)}` : `You owe ${formatCurrency(Math.abs(share), group.currency)}`}
								</div>
							{/if}
						{/each}
					</div>
					<div class="flex items-center gap-2">
						<span class="font-semibold text-gray-900">
							{formatCurrency(expense.amount, group.currency)}
						</span>
						<button
							onclick={() => (editingExpense = expense)}
							class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
							title="Edit"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
							</svg>
						</button>
						<form method="POST" action="?/deleteExpense" use:enhance>
							<input type="hidden" name="expenseId" value={expense.id} />
							<button
								type="submit"
								class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
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
