import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const data = await parent();
	return data;
};

export const actions: Actions = {
	addMember: async ({ request, locals, params }) => {
		if (!locals.user) {
			return fail(401, { error: 'Not authenticated.' });
		}

		const data = await request.formData();
		const email = (data.get('email') as string)?.trim();

		if (!email) {
			return fail(400, { error: 'Email is required.' });
		}

		try {
			// Find user by email
			const users = await locals.pb.collection('users').getFullList({
				filter: `email = "${email}"`
			});

			if (users.length === 0) {
				return fail(400, { error: 'No user found with that email.' });
			}

			const targetUser = users[0];

			// Check if already a member
			const existing = await locals.pb.collection('group_members').getFullList({
				filter: `group = "${params.groupId}" && user = "${targetUser.id}"`
			});

			if (existing.length > 0) {
				return fail(400, { error: 'User is already a member.' });
			}

			await locals.pb.collection('group_members').create({
				group: params.groupId,
				user: targetUser.id,
				role: 'member'
			});

			return { memberAdded: true };
		} catch (err: unknown) {
			if (err && typeof err === 'object' && 'status' in err) {
				throw err;
			}
			return fail(400, { error: 'Failed to add member.' });
		}
	},

	removeMember: async ({ request, locals, params }) => {
		if (!locals.user) {
			return fail(401, { error: 'Not authenticated.' });
		}

		const data = await request.formData();
		const membershipId = data.get('membershipId') as string;

		try {
			const membership = await locals.pb.collection('group_members').getOne(membershipId);

			// Don't allow removing the owner
			if (membership.role === 'owner') {
				return fail(400, { error: 'Cannot remove the group owner.' });
			}

			await locals.pb.collection('group_members').delete(membershipId);
			return { memberRemoved: true };
		} catch (err: unknown) {
			if (err && typeof err === 'object' && 'status' in err) {
				throw err;
			}
			return fail(400, { error: 'Failed to remove member.' });
		}
	},

	updateGroup: async ({ request, locals, params }) => {
		if (!locals.user) {
			return fail(401, { error: 'Not authenticated.' });
		}

		const data = await request.formData();
		const name = (data.get('name') as string)?.trim();
		const description = (data.get('description') as string)?.trim();

		if (!name) {
			return fail(400, { error: 'Name is required.' });
		}

		try {
			await locals.pb.collection('groups').update(params.groupId, {
				name,
				description: description || ''
			});
			return { groupUpdated: true };
		} catch {
			return fail(400, { error: 'Failed to update group.' });
		}
	},

	deleteGroup: async ({ locals, params }) => {
		if (!locals.user) {
			return fail(401, { error: 'Not authenticated.' });
		}

		try {
			await locals.pb.collection('groups').delete(params.groupId);
		} catch {
			return fail(400, { error: 'Failed to delete group.' });
		}

		throw redirect(303, '/dashboard');
	}
};
