import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const groups = await locals.pb.collection('groups').getFullList({
		filter: `members ~ "${locals.user.id}"`
	});

	return { groups };
};
