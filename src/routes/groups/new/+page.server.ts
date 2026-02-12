import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(303, '/login');
		}

		const data = await request.formData();
		const name = data.get('name') as string;
		const description = data.get('description') as string;
		const currency = data.get('currency') as string;

		if (!name?.trim()) {
			return fail(400, { error: 'Name is required.' });
		}

		try {
			const group = await locals.pb.collection('groups').create({
				name: name.trim(),
				description: description?.trim() || '',
				currency: currency || 'EUR',
				created_by: locals.user.id
			});

			// Auto-add creator as owner
			await locals.pb.collection('group_members').create({
				group: group.id,
				user: locals.user.id,
				role: 'owner'
			});

			throw redirect(303, `/groups/${group.id}`);
		} catch (err) {
			if (err && typeof err === 'object' && 'status' in err && err.status === 303) {
				throw err;
			}
			return fail(400, { error: 'Failed to create group.' });
		}
	}
};
