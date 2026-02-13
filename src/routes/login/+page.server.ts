import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(303, '/dashboard');
	}
};

export const actions: Actions = {
	login: async ({ request, locals }) => {
		const data = await request.formData();
		const email = data.get('email') as string;
		const password = data.get('password') as string;

		try {
			await locals.pb.collection('users').authWithPassword(email, password);
		} catch {
			return fail(400, { error: 'Invalid email or password.' });
		}

		if (!locals.pb.authStore.record?.verified) {
			locals.pb.authStore.clear();
			return fail(400, { error: 'Please verify your email before signing in.', unverified: true, email });
		}

		throw redirect(303, '/dashboard');
	},
	resend: async ({ request, locals }) => {
		const data = await request.formData();
		const email = data.get('email') as string;

		try {
			await locals.pb.collection('users').requestVerification(email);
		} catch {
			// silently ignore — don't reveal if email exists
		}

		return { resent: true, email };
	}
};
