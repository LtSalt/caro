<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let group = $derived(data.group);
	let members = $derived(data.members);
	let currentUserId = $derived(data.currentUserId);
	let isOwner = $derived(group.created_by === currentUserId);

	let showDeleteConfirm = $state(false);
	let showLeaveConfirm = $state(false);
</script>

<div class="mt-4 space-y-6">
	{#if form?.error}
		<div class="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{form.error}</div>
	{/if}
	{#if form?.groupUpdated}
		<div class="rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">Group updated.</div>
	{/if}
	{#if form?.memberAdded}
		<div class="rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">Member added.</div>
	{/if}

	<!-- Members -->
	<div>
		<h2 class="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Members</h2>

		<div class="space-y-2">
			{#each members as member}
				<div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
					<div>
						<span class="font-medium text-gray-900 dark:text-gray-100">{member.name || member.email}</span>
						{#if member.id === group.created_by}
							<span class="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">Owner</span>
						{/if}
					</div>
					{#if isOwner && member.id !== group.created_by}
						<form method="POST" action="?/removeMember" use:enhance>
							<input type="hidden" name="userId" value={member.id} />
							<button
								type="submit"
								class="cursor-pointer text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
							>
								Remove
							</button>
						</form>
					{:else if !isOwner && member.id === currentUserId}
						{#if !showLeaveConfirm}
							<button
								onclick={() => (showLeaveConfirm = true)}
								class="cursor-pointer text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
							>
								Leave
							</button>
						{:else}
							<div class="flex items-center gap-2">
								<span class="text-sm text-gray-600 dark:text-gray-400">Leave group?</span>
								<button
									type="button"
									onclick={() => (showLeaveConfirm = false)}
									class="cursor-pointer text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
								>
									Cancel
								</button>
								<form method="POST" action="?/leaveGroup" use:enhance>
									<button
										type="submit"
										class="cursor-pointer text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
									>
										Yes, leave
									</button>
								</form>
							</div>
						{/if}
					{/if}
				</div>
			{/each}
		</div>

		<!-- Add member -->
		<form method="POST" action="?/addMember" use:enhance class="mt-3 flex gap-2">
			<input
				type="email"
				name="email"
				placeholder="Add member by email"
				required
				class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-gray-400"
			/>
			<button
				type="submit"
				class="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
			>
				Add
			</button>
		</form>
	</div>

	<!-- Edit group -->
	{#if isOwner}
		<div>
			<h2 class="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Edit group</h2>
			<form method="POST" action="?/updateGroup" use:enhance class="space-y-3">
				<label class="block">
					<span class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</span>
					<input
						type="text"
						name="name"
						required
						value={group.name}
						class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-gray-400"
					/>
				</label>
				<label class="block">
					<span class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</span>
					<input
						type="text"
						name="description"
						value={group.description || ''}
						class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-gray-400"
					/>
				</label>
				<button
					type="submit"
					class="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
				>
					Save changes
				</button>
			</form>
		</div>

		<!-- Danger zone -->
		<div class="rounded-lg border border-red-200 p-4 dark:border-red-800">
			<h2 class="mb-2 text-lg font-semibold text-red-600 dark:text-red-400">Danger zone</h2>
			{#if !showDeleteConfirm}
				<button
					onclick={() => (showDeleteConfirm = true)}
					class="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
				>
					Delete group
				</button>
			{:else}
				<p class="mb-3 text-sm text-gray-600 dark:text-gray-400">This will permanently delete the group and all its data.</p>
				<form method="POST" action="?/deleteGroup" use:enhance class="flex gap-2">
					<button
						type="button"
						onclick={() => (showDeleteConfirm = false)}
						class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
					>
						Yes, delete group
					</button>
				</form>
			{/if}
		</div>
	{/if}
</div>
