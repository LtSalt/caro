<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatCurrency } from '$lib/utils';
	import type { RecordModel } from 'pocketbase';

	interface Split {
		user: string;
		amount: number;
		parts: number | null;
	}

	interface Props {
		group: RecordModel;
		members: RecordModel[];
		currentUserId: string;
		expense?: RecordModel | null;
		expenseSplits?: Split[];
		onclose: () => void;
	}

	let { group, members, currentUserId, expense = null, expenseSplits = [], onclose }: Props = $props();

	const isEditing = !!expense;

	let loading = $state(false);
	let error = $state<string | null>(null);
	function initialSplitType(): string {
		if (!isEditing || expenseSplits.length === 0) return 'equal';
		const amounts = expenseSplits.map((s) => Math.round(s.amount * 100));
		const allEqual = amounts.every((a) => a === amounts[0]);
		return allEqual ? 'equal' : 'parts';
	}

	let splitType = $state(initialSplitType());
	let totalAmount = $state(expense?.amount ?? 0);
	let selectedUsers = $state<string[]>(
		isEditing && expenseSplits.length > 0
			? expenseSplits.map((s) => s.user)
			: members.map((m) => m['user'] as string)
	);

	// Build a lookup of existing split amounts by user
	const existingSplitAmounts: Record<string, number> = {};
	for (const s of expenseSplits) {
		existingSplitAmounts[s.user] = s.amount;
	}

	function initAmounts(): Record<string, string> {
		const result: Record<string, string> = {};
		for (const m of members) {
			const userId = m['user'] as string;
			const existing = existingSplitAmounts[userId];
			result[userId] = existing !== undefined ? String(existing) : '';
		}
		return result;
	}

	function initParts(): Record<string, string> {
		const result: Record<string, string> = {};
		for (const s of expenseSplits) {
			if (s.parts) {
				result[s.user] = String(s.parts);
			}
		}
		for (const m of members) {
			const userId = m['user'] as string;
			if (!(userId in result)) {
				result[userId] = '1';
			}
		}
		return result;
	}

	let userAmounts = $state<Record<string, string>>(initAmounts());
	let userParts = $state<Record<string, string>>(initParts());

	// Reactively compute each user's share based on split type
	let computedShares = $derived.by(() => {
		const shares: Record<string, number> = {};
		const active = selectedUsers;
		if (active.length === 0 || !totalAmount) return shares;

		if (splitType === 'equal') {
			const perPerson = Math.round((totalAmount / active.length) * 100) / 100;
			for (const userId of active) {
				shares[userId] = perPerson;
			}
		} else if (splitType === 'parts') {
			let total = 0;
			for (const userId of active) {
				total += parseInt(userParts[userId]) || 1;
			}
			for (const userId of active) {
				const p = parseInt(userParts[userId]) || 1;
				shares[userId] = Math.round((totalAmount * p / total) * 100) / 100;
			}
		} else if (splitType === 'exact') {
			for (const userId of active) {
				shares[userId] = parseFloat(userAmounts[userId]) || 0;
			}
		}
		return shares;
	});

	const today = new Date().toISOString().split('T')[0];

	function toggleUser(userId: string) {
		if (selectedUsers.includes(userId)) {
			selectedUsers = selectedUsers.filter((id) => id !== userId);
		} else {
			selectedUsers = [...selectedUsers, userId];
		}
	}

	function getMemberUser(member: RecordModel) {
		const expand = member.expand as Record<string, Record<string, string>> | undefined;
		return expand?.user;
	}

	function formatDateValue(d: string | undefined): string {
		if (!d) return today;
		return d.split(' ')[0].split('T')[0];
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
	onclick={(e) => { if (e.target === e.currentTarget) onclose(); }}
	onkeydown={() => {}}
>
	<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-lg font-semibold text-gray-900">{isEditing ? 'Edit expense' : 'Add expense'}</h2>
			<button onclick={onclose} class="text-gray-400 hover:text-gray-600" aria-label="Close">
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		{#if error}
			<div class="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
		{/if}

		<form
			method="POST"
			action={isEditing ? '?/editExpense' : '?/addExpense'}
			use:enhance={() => {
				loading = true;
				error = null;
				return async ({ result, update }) => {
					loading = false;
					if (result.type === 'success') {
						onclose();
						await update();
					} else if (result.type === 'failure') {
						error = (result.data as { error?: string })?.error ?? 'Something went wrong.';
					} else {
						await update();
					}
				};
			}}
		>
			{#if isEditing}
				<input type="hidden" name="expenseId" value={expense?.id} />
			{/if}

			<label class="mb-3 block">
				<span class="mb-1 block text-sm font-medium text-gray-700">Description</span>
				<input
					type="text"
					name="description"
					required
					placeholder="e.g. Dinner"
					value={expense?.description ?? ''}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none"
				/>
			</label>

			<label class="mb-3 block">
				<span class="mb-1 block text-sm font-medium text-gray-700">Amount ({group.currency})</span>
				<input
					type="number"
					name="amount"
					required
					min="0.01"
					step="0.01"
					placeholder="0.00"
					bind:value={totalAmount}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none"
				/>
			</label>

			<label class="mb-3 block">
				<span class="mb-1 block text-sm font-medium text-gray-700">Paid by</span>
				<select
					name="paid_by"
					class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none"
				>
					{#each members as member}
						{@const userId = member['user'] as string}
						{@const expandUser = getMemberUser(member)}
						<option value={userId} selected={isEditing ? userId === expense?.paid_by : userId === currentUserId}>
							{expandUser?.name || expandUser?.email || 'Unknown'}
						</option>
					{/each}
				</select>
			</label>

			<label class="mb-3 block">
				<span class="mb-1 block text-sm font-medium text-gray-700">Date</span>
				<input
					type="date"
					name="date"
					required
					value={formatDateValue(expense?.date)}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none"
				/>
			</label>

			<input type="hidden" name="split_type" value={splitType} />

			<fieldset class="mb-3">
				<legend class="mb-1 block text-sm font-medium text-gray-700">Split type</legend>
				<div class="flex gap-2">
					{#each [['equal', 'Equal'], ['parts', 'By parts'], ['exact', 'Exact amounts']] as [value, label]}
						<button
							type="button"
							onclick={() => (splitType = value)}
							class="rounded-lg border px-3 py-1.5 text-sm {splitType === value ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}"
						>
							{label}
						</button>
					{/each}
				</div>
			</fieldset>

			<fieldset class="mb-3">
				<legend class="mb-1 block text-sm font-medium text-gray-700">Split between</legend>
				<div class="space-y-1">
					{#each members as member}
						{@const userId = member['user'] as string}
						{@const expandUser = getMemberUser(member)}
						{@const userName = expandUser?.name || expandUser?.email || 'Unknown'}
						<label class="flex items-center gap-2">
							<input
								type="checkbox"
								name="split_users"
								value={userId}
								checked={selectedUsers.includes(userId)}
								onchange={() => toggleUser(userId)}
								class="rounded border-gray-300"
							/>
							<span class="flex-1 text-sm text-gray-700">{userName}</span>
							{#if splitType === 'parts' && selectedUsers.includes(userId)}
								<input
									type="number"
									name="parts_{userId}"
									min="1"
									bind:value={userParts[userId]}
									class="w-16 rounded border border-gray-300 px-2 py-1 text-right text-sm"
								/>
								<span class="text-xs text-gray-400">parts</span>
							{/if}
							{#if splitType === 'exact' && selectedUsers.includes(userId)}
								<span class="text-xs text-gray-500">{group.currency}</span>
								<input
									type="number"
									name="amount_{userId}"
									min="0"
									step="0.01"
									bind:value={userAmounts[userId]}
									placeholder="0.00"
									class="w-20 rounded border border-gray-300 px-2 py-1 text-right text-sm"
								/>
							{/if}
							{#if splitType !== 'exact' && selectedUsers.includes(userId) && computedShares[userId] !== undefined}
								<span class="text-xs text-gray-400">&middot;</span>
								<span class="text-xs text-gray-500">{formatCurrency(computedShares[userId], group.currency)}</span>
							{/if}
						</label>
					{/each}
				</div>
			</fieldset>

			<div class="mt-4 flex gap-2">
				<button
					type="button"
					onclick={onclose}
					class="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={loading}
					class="flex-1 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
				>
					{#if loading}
						{isEditing ? 'Saving...' : 'Adding...'}
					{:else}
						{isEditing ? 'Save changes' : 'Add expense'}
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>
