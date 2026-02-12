import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(303, '/dashboard');
	}
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const data = await request.formData();
		const email = data.get('email') as string;
		const password = data.get('password') as string;

		try {
			await locals.pb.collection('users').authWithPassword(email, password);
		} catch {
			return fail(400, { error: 'Invalid email or password.' });
		}

		throw redirect(303, '/dashboard');
	}
};
