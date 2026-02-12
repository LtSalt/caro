import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	return {
		account: {
			id: locals.user.id,
			email: locals.user.email,
			name: locals.user.name || ''
		}
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(303, '/login');
		}

		const data = await request.formData();
		const name = (data.get('name') as string)?.trim();

		if (!name) {
			return fail(400, { error: 'Name is required.' });
		}

		try {
			await locals.pb.collection('users').update(locals.user.id, { name });
			return { profileUpdated: true };
		} catch {
			return fail(400, { error: 'Failed to update profile.' });
		}
	},

	changePassword: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(303, '/login');
		}

		const data = await request.formData();
		const oldPassword = data.get('oldPassword') as string;
		const password = data.get('password') as string;
		const passwordConfirm = data.get('passwordConfirm') as string;

		if (password !== passwordConfirm) {
			return fail(400, { error: 'New passwords do not match.' });
		}

		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters.' });
		}

		if (oldPassword === password) {
			return fail(400, { error: 'New password must be different from your current password.' });
		}

		try {
			await locals.pb.collection('users').update(locals.user.id, {
				oldPassword,
				password,
				passwordConfirm
			});
			// Re-authenticate with new password
			await locals.pb.collection('users').authWithPassword(locals.user.email, password);
			return { passwordChanged: true };
		} catch {
			return fail(400, { error: 'Failed to change password. Check your current password.' });
		}
	}
};
