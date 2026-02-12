<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
	let loading = $state(false);
</script>

<div class="mx-auto max-w-md py-6">
	<h1 class="mb-6 text-2xl font-bold text-gray-900">Create group</h1>

	{#if form?.error}
		<div class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{form.error}</div>
	{/if}

	<form
		method="POST"
		use:enhance={() => {
			loading = true;
			return async ({ update }) => {
				loading = false;
				await update();
			};
		}}
	>
		<label class="mb-4 block">
			<span class="mb-1 block text-sm font-medium text-gray-700">Group name</span>
			<input
				type="text"
				name="name"
				required
				placeholder="e.g. Summer trip"
				class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none"
			/>
		</label>

		<label class="mb-4 block">
			<span class="mb-1 block text-sm font-medium text-gray-700">Description</span>
			<input
				type="text"
				name="description"
				placeholder="Optional description"
				class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none"
			/>
		</label>

		<label class="mb-6 block">
			<span class="mb-1 block text-sm font-medium text-gray-700">Currency</span>
			<select
				name="currency"
				class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none"
			>
				<option value="EUR">EUR</option>
				<option value="USD">USD</option>
				<option value="GBP">GBP</option>
				<option value="CHF">CHF</option>
			</select>
		</label>

		<button
			type="submit"
			disabled={loading}
			class="w-full rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-gray-800 disabled:opacity-50"
		>
			{loading ? 'Creating...' : 'Create group'}
		</button>
	</form>
</div>
