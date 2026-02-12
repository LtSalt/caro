<script lang="ts">
	import { enhance } from '$app/forms';
	import type { RecordModel } from 'pocketbase';

	interface Props {
		group: RecordModel;
		members: RecordModel[];
		currentUserId: string;
		expense?: RecordModel | null;
		onclose: () => void;
	}

	let { group, members, currentUserId, expense = null, onclose }: Props = $props();

	const isEditing = !!expense;

	let loading = $state(false);
	let splitType = $state(expense?.split_type ?? 'equal');
	let selectedUsers = $state<string[]>(members.map((m) => m['user'] as string));

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

		<form
			method="POST"
			action={isEditing ? '?/editExpense' : '?/addExpense'}
			use:enhance={() => {
				loading = true;
				return async ({ result, update }) => {
					loading = false;
					if (result.type === 'success') {
						onclose();
					}
					await update();
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
					value={expense?.amount ?? ''}
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
							<span class="text-sm text-gray-700">{userName}</span>
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
