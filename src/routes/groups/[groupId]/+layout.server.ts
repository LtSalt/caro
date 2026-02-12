import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, params }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	try {
		const group = await locals.pb.collection('groups').getOne(params.groupId);

		const members = await locals.pb.collection('group_members').getFullList({
			filter: `group = "${params.groupId}"`,
			expand: 'user'
		});

		// Check user is a member
		const isMember = members.some((m) => m.user === locals.user!.id);
		if (!isMember) {
			throw error(403, 'You are not a member of this group.');
		}

		return {
			group,
			members,
			currentUserId: locals.user.id
		};
	} catch (err: unknown) {
		if (err && typeof err === 'object' && 'status' in err) {
			const statusErr = err as { status: number };
			if (statusErr.status === 403 || statusErr.status === 404) {
				throw err;
			}
		}
		throw error(404, 'Group not found.');
	}
};
