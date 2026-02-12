<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let account = $derived(data.account);
</script>

<div class="mx-auto max-w-md space-y-8 py-6">
	<h1 class="text-2xl font-bold text-gray-900">Account settings</h1>

	{#if form?.error}
		<div class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{form.error}</div>
	{/if}
	{#if form?.profileUpdated}
		<div class="rounded-lg bg-green-50 p-3 text-sm text-green-700">Profile updated.</div>
	{/if}
	{#if form?.passwordChanged}
		<div class="rounded-lg bg-green-50 p-3 text-sm text-green-700">Password changed.</div>
	{/if}

	<!-- Profile -->
	<div>
		<h2 class="mb-3 text-lg font-semibold text-gray-900">Profile</h2>
		<form method="POST" action="?/updateProfile" use:enhance class="space-y-3">
			<label class="block">
				<span class="mb-1 block text-sm font-medium text-gray-700">Email</span>
				<input
					type="email"
					value={account.email}
					disabled
					class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500"
				/>
			</label>
			<label class="block">
				<span class="mb-1 block text-sm font-medium text-gray-700">Name</span>
				<input
					type="text"
					name="name"
					required
					value={account.name}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none"
				/>
			</label>
			<button
				type="submit"
				class="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800"
			>
				Save
			</button>
		</form>
	</div>

	<!-- Change password -->
	<div>
		<h2 class="mb-3 text-lg font-semibold text-gray-900">Change password</h2>
		<form method="POST" action="?/changePassword" use:enhance class="space-y-3">
			<label class="block">
				<span class="mb-1 block text-sm font-medium text-gray-700">Current password</span>
				<input
					type="password"
					name="oldPassword"
					required
					class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none"
				/>
			</label>
			<label class="block">
				<span class="mb-1 block text-sm font-medium text-gray-700">New password</span>
				<input
					type="password"
					name="password"
					required
					minlength="8"
					class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none"
				/>
			</label>
			<label class="block">
				<span class="mb-1 block text-sm font-medium text-gray-700">Confirm new password</span>
				<input
					type="password"
					name="passwordConfirm"
					required
					minlength="8"
					class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none"
				/>
			</label>
			<button
				type="submit"
				class="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800"
			>
				Change password
			</button>
		</form>
	</div>
</div>
