<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatCurrency, formatDate } from '$lib/utils';
	import AddExpenseModal from '$lib/components/AddExpenseModal.svelte';
	import type { RecordModel } from 'pocketbase';

	let { data, form } = $props();
	let showAddModal = $state(false);
	let editingExpense = $state<RecordModel | null>(null);
	let deletingExpenseId = $state<string | null>(null);
	let settlingExpense = $state<RecordModel | null>(null);

	let expenses = $derived(data.expenses);
	let splitsByExpense = $derived(data.splitsByExpense);
	let group = $derived(data.group);
	let members = $derived(data.members);
	let currentUserId = $derived(data.currentUserId);
	let settledExpenseIds = $derived(new Set(data.settledExpenseIds));

	let activeExpenses = $derived(expenses.filter((e) => !settledExpenseIds.has(e.id)));
	let settledExpenses = $derived(expenses.filter((e) => settledExpenseIds.has(e.id)));

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

	{#if expenses.length === 0}
		<div class="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
			<p class="text-gray-500 dark:text-gray-400">No expenses yet. Add one to get started.</p>
		</div>
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
								<div class="mt-0.5 text-xs {share > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
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
								<button
									onclick={(e) => { e.stopPropagation(); settlingExpense = expense; }}
									class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-green-600 dark:hover:bg-gray-800 dark:hover:text-green-400"
									title="Settle"
								>
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
									</svg>
								</button>
							{/if}
						{/each}
						<button
							onclick={(e) => { e.stopPropagation(); deletingExpenseId = expense.id; }}
							class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-800 dark:hover:text-red-400"
							title="Delete"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
							</svg>
						</button>
					</div>
				</div>
			{/each}
		</div>

		{#if settledExpenses.length > 0}
			<div class="mt-6">
				<h3 class="mb-2 text-sm font-medium text-gray-400">Settled</h3>
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
										class="rounded p-1 text-green-500 hover:bg-gray-100 hover:text-gray-400 dark:hover:bg-gray-800"
										title="Unsettle"
									>
										<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
										</svg>
									</button>
								</form>
								<button
									onclick={(e) => { e.stopPropagation(); deletingExpenseId = expense.id; }}
									class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-800 dark:hover:text-red-400"
									title="Delete"
								>
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
									</svg>
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
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

{#if settlingExpense}
	{@const share = getUserShare(settlingExpense)}
	{@const payer = settlingExpense.expand?.paid_by}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={(e) => { if (e.target === e.currentTarget) settlingExpense = null; }}
		onkeydown={() => {}}
	>
		<div class="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
			<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Settle expense?</h3>
			{#if share !== null}
				<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
					{#if share < 0}
						Mark your debt of <strong>{formatCurrency(Math.abs(share), group.currency)}</strong> to {payer?.name || 'Unknown'} as settled.
					{:else}
						Mark <strong>{formatCurrency(share, group.currency)}</strong> owed to you for this expense as settled.
					{/if}
				</p>
			{/if}
			<div class="mt-4 flex gap-2">
				<button
					onclick={() => (settlingExpense = null)}
					class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
				>
					Cancel
				</button>
				<form
					method="POST"
					action="?/settleExpense"
					use:enhance={() => {
						return async ({ update }) => {
							settlingExpense = null;
							await update();
						};
					}}
				>
					<input type="hidden" name="expenseId" value={settlingExpense.id} />
					<button
						type="submit"
						class="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
					>
						Settle
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}

{#if deletingExpenseId}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={(e) => { if (e.target === e.currentTarget) deletingExpenseId = null; }}
		onkeydown={() => {}}
	>
		<div class="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
			<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Delete expense?</h3>
			<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">This action cannot be undone.</p>
			<div class="mt-4 flex gap-2">
				<button
					onclick={() => (deletingExpenseId = null)}
					class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
				>
					Cancel
				</button>
				<form
					method="POST"
					action="?/deleteExpense"
					use:enhance={() => {
						return async ({ update }) => {
							deletingExpenseId = null;
							await update();
						};
					}}
				>
					<input type="hidden" name="expenseId" value={deletingExpenseId} />
					<button
						type="submit"
						class="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
					>
						Delete
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}
