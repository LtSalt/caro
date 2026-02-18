<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let account = $derived(data.account);
	let showDeleteConfirm = $state(false);
</script>

<div class="mx-auto max-w-md space-y-8 py-6">
	<h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Account settings</h1>

	{#if form?.error}
		<div class="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{form.error}</div>
	{/if}
	{#if form?.profileUpdated}
		<div class="rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">Profile updated.</div>
	{/if}
	{#if form?.passwordChanged}
		<div class="rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">Password changed.</div>
	{/if}

	<!-- Profile -->
	<div>
		<h2 class="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Profile</h2>
		<form method="POST" action="?/updateProfile" use:enhance class="space-y-3">
			<label class="block">
				<span class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</span>
				<input
					type="email"
					value={account.email}
					disabled
					class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
				/>
			</label>
			<label class="block">
				<span class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</span>
				<input
					type="text"
					name="name"
					required
					value={account.name}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-gray-400"
				/>
			</label>
			<button
				type="submit"
				class="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
			>
				Save
			</button>
		</form>
	</div>

	<!-- Change password -->
	<div>
		<h2 class="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Change password</h2>
		<form method="POST" action="?/changePassword" use:enhance class="space-y-3">
			<label class="block">
				<span class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Current password</span>
				<input
					type="password"
					name="oldPassword"
					required
					class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-gray-400"
				/>
			</label>
			<label class="block">
				<span class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">New password</span>
				<input
					type="password"
					name="password"
					required
					minlength="8"
					class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-gray-400"
				/>
			</label>
			<label class="block">
				<span class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm new password</span>
				<input
					type="password"
					name="passwordConfirm"
					required
					minlength="8"
					class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-gray-400"
				/>
			</label>
			<button
				type="submit"
				class="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
			>
				Change password
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
				Delete account
			</button>
		{:else}
			<p class="mb-3 text-sm text-gray-600 dark:text-gray-400">This will permanently delete your account and remove you from all groups. This action cannot be undone.</p>
			<form method="POST" action="?/deleteAccount" use:enhance class="flex gap-2">
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
					Yes, delete account
				</button>
			</form>
		{/if}
	</div>
</div>
