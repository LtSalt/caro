import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { ClientResponseError } from 'pocketbase';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(303, '/dashboard');
	}
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		const email = data.get('email') as string;
		const password = data.get('password') as string;
		const passwordConfirm = data.get('passwordConfirm') as string;

		if (password !== passwordConfirm) {
			return fail(400, { error: 'Passwords do not match.' });
		}

		try {
			await locals.pb.collection('users').create({
				name,
				email,
				password,
				passwordConfirm,
				emailVisibility: true
			});
			await locals.pb.collection('users').authWithPassword(email, password);
		} catch (err: unknown) {
			if (err instanceof ClientResponseError) {
				const emailErrors = err.response?.data?.email;
				if (emailErrors?.code === 'validation_not_unique') {
					return fail(400, {
						error: 'An account with this email already exists. Please sign in instead.',
						existingEmail: true
					});
				}
			}
			const message = err instanceof Error ? err.message : 'Failed to create account.';
			return fail(400, { error: message });
		}

		throw redirect(303, '/dashboard');
	}
};
