import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { equalSplit } from '$lib/utils';
import type PocketBase from 'pocketbase';

async function removeNonMemberSplits(pb: PocketBase, expenseId: string, groupId: string) {
	const group = await pb.collection('groups').getOne(groupId);
	const memberIds = group.members as string[];

	const splits = await pb.collection('expense_splits').getFullList({
		filter: `expense = "${expenseId}"`
	});

	const orphanedSplits = splits.filter((s) => !memberIds.includes(s.user));
	if (orphanedSplits.length === 0) return;

	const remainingSplits = splits.filter((s) => memberIds.includes(s.user));
	if (remainingSplits.length === 0) return;

	for (const orphan of orphanedSplits) {
		const extraAmounts = equalSplit(orphan.amount, remainingSplits.length);
		for (let i = 0; i < remainingSplits.length; i++) {
			remainingSplits[i].amount = Math.round((remainingSplits[i].amount + extraAmounts[i]) * 100) / 100;
		}
		await pb.collection('expense_splits').delete(orphan.id);
	}

	for (const split of remainingSplits) {
		await pb.collection('expense_splits').update(split.id, { amount: split.amount });
	}

	await pb.collection('expenses').update(expenseId, { split_type: 'exact' });
}

export const load: PageServerLoad = async ({ locals, params }) => {
	const [expenses, deletedExpenses] = await Promise.all([
		locals.pb.collection('expenses').getFullList({
			filter: `group = "${params.groupId}" && deleted_at = ""`,
			expand: 'paid_by',
			sort: '-date,-created',
			requestKey: 'expenses-active'
		}),
		locals.pb.collection('expenses').getFullList({
			filter: `group = "${params.groupId}" && deleted_at != ""`,
			expand: 'paid_by',
			sort: '-deleted_at',
			requestKey: 'expenses-deleted'
		})
	]);

	const allExpenses = [...expenses, ...deletedExpenses];

	const splits = allExpenses.length > 0
		? await locals.pb.collection('expense_splits').getFullList({
				filter: allExpenses.map((e) => `expense = "${e.id}"`).join(' || ')
			})
		: [];

	const splitsByExpense: Record<string, { user: string; amount: number; parts: number | null }[]> = {};
	for (const split of splits) {
		if (!splitsByExpense[split.expense]) {
			splitsByExpense[split.expense] = [];
		}
		splitsByExpense[split.expense].push({ user: split.user, amount: split.amount, parts: split.parts ?? null });
	}

	const settledExpenseIds = expenses.filter((e) => e.settled).map((e) => e.id);

	return { expenses, deletedExpenses, splitsByExpense, settledExpenseIds };
};

export const actions: Actions = {
	addExpense: async ({ request, locals, params }) => {
		if (!locals.user) {
			return fail(401, { error: 'Not authenticated.' });
		}

		const data = await request.formData();
		const description = data.get('description') as string;
		const amount = parseFloat(data.get('amount') as string);
		const paid_by = data.get('paid_by') as string;
		const split_type = data.get('split_type') as string;
		const date = data.get('date') as string;
		const splitUsers = data.getAll('split_users') as string[];

		if (!description?.trim() || !amount || amount <= 0 || !paid_by || !date) {
			return fail(400, { error: 'All fields are required.' });
		}

		if (splitUsers.length === 0) {
			return fail(400, { error: 'Select at least one person to split with.' });
		}

		if (split_type === 'exact') {
			const total = splitUsers.reduce(
				(sum, userId) => sum + (parseFloat(data.get(`amount_${userId}`) as string) || 0),
				0
			);
			if (Math.round(total * 100) !== Math.round(amount * 100)) {
				return fail(400, { error: 'Split amounts must add up to the total expense amount.' });
			}
		}

		try {
			const expense = await locals.pb.collection('expenses').create({
				group: params.groupId,
				description: description.trim(),
				amount,
				paid_by,
				split_type: split_type || 'equal',
				date
			});

			if (split_type === 'equal' || !split_type) {
				const amounts = equalSplit(amount, splitUsers.length);
				for (let i = 0; i < splitUsers.length; i++) {
					await locals.pb.collection('expense_splits').create({
						expense: expense.id,
						user: splitUsers[i],
						amount: amounts[i]
					});
				}
			} else if (split_type === 'parts') {
				const parts = splitUsers.map(
					(userId) => parseInt(data.get(`parts_${userId}`) as string) || 1
				);
				const totalParts = parts.reduce((a, b) => a + b, 0);
				for (let i = 0; i < splitUsers.length; i++) {
					const userAmount = Math.round((amount * parts[i]) / totalParts * 100) / 100;
					await locals.pb.collection('expense_splits').create({
						expense: expense.id,
						user: splitUsers[i],
						amount: userAmount,
						parts: parts[i]
					});
				}
			} else if (split_type === 'exact') {
				for (const userId of splitUsers) {
					const userAmount = parseFloat(data.get(`amount_${userId}`) as string) || 0;
					await locals.pb.collection('expense_splits').create({
						expense: expense.id,
						user: userId,
						amount: userAmount
					});
				}
			}

			return { success: true };
		} catch (err) {
			console.error('addExpense error:', err);
			const message = err instanceof Error ? err.message : 'Failed to create expense.';
			return fail(400, { error: message });
		}
	},

	editExpense: async ({ request, locals, params }) => {
		if (!locals.user) {
			return fail(401, { error: 'Not authenticated.' });
		}

		const data = await request.formData();
		const expenseId = data.get('expenseId') as string;
		const description = data.get('description') as string;
		const amount = parseFloat(data.get('amount') as string);
		const paid_by = data.get('paid_by') as string;
		const split_type = data.get('split_type') as string;
		const date = data.get('date') as string;
		const splitUsers = data.getAll('split_users') as string[];

		if (!expenseId || !description?.trim() || !amount || amount <= 0 || !paid_by || !date) {
			return fail(400, { error: 'All fields are required.' });
		}

		if (splitUsers.length === 0) {
			return fail(400, { error: 'Select at least one person to split with.' });
		}

		if (split_type === 'exact') {
			const total = splitUsers.reduce(
				(sum, userId) => sum + (parseFloat(data.get(`amount_${userId}`) as string) || 0),
				0
			);
			if (Math.round(total * 100) !== Math.round(amount * 100)) {
				return fail(400, { error: 'Split amounts must add up to the total expense amount.' });
			}
		}

		try {
			await locals.pb.collection('expenses').update(expenseId, {
				description: description.trim(),
				amount,
				paid_by,
				split_type: split_type || 'equal',
				date
			});

			// Delete old splits and recreate
			const oldSplits = await locals.pb.collection('expense_splits').getFullList({
				filter: `expense = "${expenseId}"`
			});
			for (const split of oldSplits) {
				await locals.pb.collection('expense_splits').delete(split.id);
			}

			if (split_type === 'equal' || !split_type) {
				const amounts = equalSplit(amount, splitUsers.length);
				for (let i = 0; i < splitUsers.length; i++) {
					await locals.pb.collection('expense_splits').create({
						expense: expenseId,
						user: splitUsers[i],
						amount: amounts[i]
					});
				}
			} else if (split_type === 'parts') {
				const parts = splitUsers.map(
					(userId) => parseInt(data.get(`parts_${userId}`) as string) || 1
				);
				const totalParts = parts.reduce((a, b) => a + b, 0);
				for (let i = 0; i < splitUsers.length; i++) {
					const userAmount = Math.round((amount * parts[i]) / totalParts * 100) / 100;
					await locals.pb.collection('expense_splits').create({
						expense: expenseId,
						user: splitUsers[i],
						amount: userAmount,
						parts: parts[i]
					});
				}
			} else if (split_type === 'exact') {
				for (const userId of splitUsers) {
					const userAmount = parseFloat(data.get(`amount_${userId}`) as string) || 0;
					await locals.pb.collection('expense_splits').create({
						expense: expenseId,
						user: userId,
						amount: userAmount
					});
				}
			}

			return { success: true };
		} catch (err) {
			console.error('editExpense error:', err);
			const message = err instanceof Error ? err.message : 'Failed to update expense.';
			return fail(400, { error: message });
		}
	},

	settleExpense: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Not authenticated.' });
		}

		const data = await request.formData();
		const expenseId = data.get('expenseId') as string;

		try {
			await locals.pb.collection('expenses').update(expenseId, {
				settled: true,
				settled_at: new Date().toISOString().split('T')[0]
			});
			return { settled: true };
		} catch (err) {
			console.error('settleExpense error:', err);
			const message = err instanceof Error ? err.message : 'Failed to settle expense.';
			return fail(400, { error: message });
		}
	},

	unsettleExpense: async ({ request, locals, params }) => {
		if (!locals.user) {
			return fail(401, { error: 'Not authenticated.' });
		}

		const data = await request.formData();
		const expenseId = data.get('expenseId') as string;

		try {
			await locals.pb.collection('expenses').update(expenseId, {
				settled: false,
				settled_at: ''
			});

			await removeNonMemberSplits(locals.pb, expenseId, params.groupId);

			return { unsettled: true };
		} catch (err) {
			console.error('unsettleExpense error:', err);
			const message = err instanceof Error ? err.message : 'Failed to unsettle expense.';
			return fail(400, { error: message });
		}
	},

	deleteExpense: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Not authenticated.' });
		}

		const data = await request.formData();
		const expenseId = data.get('expenseId') as string;

		try {
			await locals.pb.collection('expenses').update(expenseId, {
				deleted_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
			});
			return { deleted: true };
		} catch {
			return fail(400, { error: 'Failed to delete expense.' });
		}
	},

	restoreExpense: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Not authenticated.' });
		}

		const data = await request.formData();
		const expenseId = data.get('expenseId') as string;

		try {
			await locals.pb.collection('expenses').update(expenseId, { deleted_at: null });
			return { restored: true };
		} catch {
			return fail(400, { error: 'Failed to restore expense.' });
		}
	}
};
