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
			const group = await locals.pb.collection('groups').getOne(params.groupId);
			const currentMembers = group.members as string[];

			if (currentMembers.includes(targetUser.id)) {
				return fail(400, { error: 'User is already a member.' });
			}

			await locals.pb.collection('groups').update(params.groupId, {
				members: [...currentMembers, targetUser.id]
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
		const userId = data.get('userId') as string;

		try {
			const group = await locals.pb.collection('groups').getOne(params.groupId);

			// Don't allow removing the owner
			if (group.created_by === userId) {
				return fail(400, { error: 'Cannot remove the group owner.' });
			}

			const currentMembers = group.members as string[];
			await locals.pb.collection('groups').update(params.groupId, {
				members: currentMembers.filter((id: string) => id !== userId)
			});

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
