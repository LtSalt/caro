import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	// Get all group memberships for the current user, expanding the group
	const memberships = await locals.pb.collection('group_members').getFullList({
		filter: `user = "${locals.user.id}"`,
		expand: 'group'
	});

	const groups = memberships
		.map((m) => m.expand?.group)
		.filter(Boolean);

	return { groups };
};
