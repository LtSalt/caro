import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { equalSplit } from '$lib/utils';
import { computeNetBalances } from '$lib/balance';

export const load: PageServerLoad = async ({ parent, locals }) => {
	const data = await parent();

	const invitedIds = Array.isArray(data.group.invited) ? (data.group.invited as string[]) : [];

	const invitedUsers =
		invitedIds.length > 0
			? await locals.pb.collection('users').getFullList({
					filter: invitedIds.map((id) => `id = "${id}"`).join(' || ')
				})
			: [];

	return { ...data, invitedUsers };
};

export const actions: Actions = {
	sendInvitation: async ({ request, locals, params }) => {
		if (!locals.user) {
			return fail(401, { error: 'Not authenticated.' });
		}

		const data = await request.formData();
		const email = (data.get('email') as string)?.trim();

		if (!email) {
			return fail(400, { error: 'Email is required.' });
		}

		try {
			const users = await locals.pb.collection('users').getFullList({
				filter: `email = "${email}"`
			});

			if (users.length === 0) {
				return fail(400, { error: 'No user found with that email.' });
			}

			const targetUser = users[0];

			const group = await locals.pb.collection('groups').getOne(params.groupId);
			const currentMembers = group.members as string[];
			const currentInvited = Array.isArray(group.invited) ? (group.invited as string[]) : [];

			if (currentMembers.includes(targetUser.id)) {
				return fail(400, { error: 'User is already a member.' });
			}

			if (currentInvited.includes(targetUser.id)) {
				return fail(400, { error: 'User has already been invited.' });
			}

			await locals.pb.collection('groups').update(params.groupId, {
				invited: [...currentInvited, targetUser.id]
			});

			return { invitationSent: true };
		} catch (err: unknown) {
			if (err && typeof err === 'object' && 'status' in err) {
				throw err;
			}
			return fail(400, { error: 'Failed to send invitation.' });
		}
	},

	cancelInvitation: async ({ request, locals, params }) => {
		if (!locals.user) {
			return fail(401, { error: 'Not authenticated.' });
		}

		const data = await request.formData();
		const userId = data.get('userId') as string;

		try {
			const group = await locals.pb.collection('groups').getOne(params.groupId);
			const currentInvited = Array.isArray(group.invited) ? (group.invited as string[]) : [];

			await locals.pb.collection('groups').update(params.groupId, {
				invited: currentInvited.filter((id: string) => id !== userId)
			});

			return { invitationCancelled: true };
		} catch (err: unknown) {
			if (err && typeof err === 'object' && 'status' in err) {
				throw err;
			}
			return fail(400, { error: 'Failed to cancel invitation.' });
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

			// Clean up open expense splits
			const openExpenses = await locals.pb.collection('expenses').getFullList({
				filter: `group = "${params.groupId}" && settled = false && deleted_at = ""`
			});

			for (const expense of openExpenses) {
				const splits = await locals.pb.collection('expense_splits').getFullList({
					filter: `expense = "${expense.id}"`
				});

				const removedSplit = splits.find((s) => s.user === userId);
				if (!removedSplit) continue;

				const remainingSplits = splits.filter((s) => s.user !== userId);
				if (remainingSplits.length === 0) continue;

				const extraAmounts = equalSplit(removedSplit.amount, remainingSplits.length);
				for (let i = 0; i < remainingSplits.length; i++) {
					await locals.pb.collection('expense_splits').update(remainingSplits[i].id, {
						amount: Math.round((remainingSplits[i].amount + extraAmounts[i]) * 100) / 100
					});
				}

				await locals.pb.collection('expense_splits').delete(removedSplit.id);
				await locals.pb.collection('expenses').update(expense.id, { split_type: 'exact' });
			}

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

	leaveGroup: async ({ locals, params }) => {
		if (!locals.user) {
			return fail(401, { error: 'Not authenticated.' });
		}

		try {
			const group = await locals.pb.collection('groups').getOne(params.groupId);

			if (group.created_by === locals.user.id) {
				return fail(400, { error: 'You must transfer group ownership before leaving.' });
			}

			// Check for open debts involving this user
			const allOpenExpenses = await locals.pb.collection('expenses').getFullList({
				filter: `group = "${params.groupId}" && settled = false && deleted_at = ""`
			});

			if (allOpenExpenses.length > 0) {
				const allSplits = await locals.pb.collection('expense_splits').getFullList({
					filter: allOpenExpenses.map((e) => `expense = "${e.id}"`).join(' || ')
				});

				const balances = computeNetBalances(
					allOpenExpenses as unknown as Array<{ id: string; paid_by: string; amount: number }>,
					allSplits as unknown as Array<{ expense: string; user: string; amount: number }>
				);

				const userBalance = balances.get(locals.user.id);
				if (userBalance !== undefined && Math.abs(userBalance) >= 0.01) {
					return fail(400, { error: 'You cannot leave while you have unsettled debts. Please settle all balances first.' });
				}
			}

			const currentMembers = group.members as string[];
			await locals.pb.collection('groups').update(params.groupId, {
				members: currentMembers.filter((id: string) => id !== locals.user!.id)
			});

			// Clean up open expense splits
			const openExpenses = await locals.pb.collection('expenses').getFullList({
				filter: `group = "${params.groupId}" && settled = false && deleted_at = ""`
			});

			for (const expense of openExpenses) {
				const splits = await locals.pb.collection('expense_splits').getFullList({
					filter: `expense = "${expense.id}"`
				});

				const leavingSplit = splits.find((s) => s.user === locals.user!.id);
				if (!leavingSplit) continue;

				const remainingSplits = splits.filter((s) => s.user !== locals.user!.id);
				if (remainingSplits.length === 0) continue;

				// Distribute leaving user's amount equally among remaining users
				const extraAmounts = equalSplit(leavingSplit.amount, remainingSplits.length);
				for (let i = 0; i < remainingSplits.length; i++) {
					await locals.pb.collection('expense_splits').update(remainingSplits[i].id, {
						amount: Math.round((remainingSplits[i].amount + extraAmounts[i]) * 100) / 100
					});
				}

				await locals.pb.collection('expense_splits').delete(leavingSplit.id);
				await locals.pb.collection('expenses').update(expense.id, { split_type: 'exact' });
			}
		} catch (err: unknown) {
			if (err && typeof err === 'object' && 'status' in err) {
				throw err;
			}
			return fail(400, { error: 'Failed to leave group.' });
		}

		throw redirect(303, '/dashboard');
	},

	transferOwnership: async ({ request, locals, params }) => {
		if (!locals.user) {
			return fail(401, { error: 'Not authenticated.' });
		}

		const data = await request.formData();
		const newOwnerId = data.get('newOwnerId') as string;

		if (!newOwnerId) {
			return fail(400, { error: 'Please select a new owner.' });
		}

		try {
			const group = await locals.pb.collection('groups').getOne(params.groupId);

			if (group.created_by !== locals.user.id) {
				return fail(403, { error: 'Only the group owner can transfer ownership.' });
			}

			const memberIds = group.members as string[];
			if (!memberIds.includes(newOwnerId) || newOwnerId === locals.user.id) {
				return fail(400, { error: 'Invalid member selected.' });
			}

			await locals.pb.collection('groups').update(params.groupId, {
				created_by: newOwnerId
			});

			return { ownershipTransferred: true };
		} catch (err: unknown) {
			if (err && typeof err === 'object' && 'status' in err) {
				throw err;
			}
			return fail(400, { error: 'Failed to transfer ownership.' });
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
