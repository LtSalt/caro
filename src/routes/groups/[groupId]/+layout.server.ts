import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, params }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	let group;
	try {
		group = await locals.pb.collection('groups').getOne(params.groupId);
	} catch {
		throw error(404, 'Group not found.');
	}

	const memberIds = Array.isArray(group.members) ? group.members as string[] : [];
	if (!memberIds.includes(locals.user.id)) {
		throw error(403, 'You are not a member of this group.');
	}

	const members = memberIds.length > 0
		? await locals.pb.collection('users').getFullList({
				filter: memberIds.map((id) => `id = "${id}"`).join(' || ')
			})
		: [];

	return {
		group,
		members,
		currentUserId: locals.user.id
	};
};
