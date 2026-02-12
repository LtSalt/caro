<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
	let loading = $state(false);
</script>

<div class="mx-auto max-w-sm py-12">
	<h1 class="mb-6 text-2xl font-bold text-gray-900">Create account</h1>

	{#if form?.error}
		<div class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
			{form.error}
			{#if 'existingEmail' in form}
				<a href="/login" class="mt-1 block font-medium underline">Go to sign in</a>
			{/if}
		</div>
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
			<span class="mb-1 block text-sm font-medium text-gray-700">Name</span>
			<input
				type="text"
				name="name"
				required
				class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none"
			/>
		</label>

		<label class="mb-4 block">
			<span class="mb-1 block text-sm font-medium text-gray-700">Email</span>
			<input
				type="email"
				name="email"
				required
				class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none"
			/>
		</label>

		<label class="mb-4 block">
			<span class="mb-1 block text-sm font-medium text-gray-700">Password</span>
			<input
				type="password"
				name="password"
				required
				minlength="8"
				class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-gray-500 focus:outline-none"
			/>
		</label>

		<label class="mb-6 block">
			<span class="mb-1 block text-sm font-medium text-gray-700">Confirm password</span>
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
			disabled={loading}
			class="w-full rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-gray-800 disabled:opacity-50"
		>
			{loading ? 'Creating account...' : 'Create account'}
		</button>
	</form>

	<p class="mt-4 text-center text-sm text-gray-600">
		Already have an account? <a href="/login" class="text-gray-900 underline">Sign in</a>
	</p>
</div>
