import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { computeNetBalances, simplifyDebts } from '$lib/balance';
import type { Expense, ExpenseSplit } from '$lib/types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const [expenses, splits] = await Promise.all([
		locals.pb.collection('expenses').getFullList({
			filter: `group = "${params.groupId}" && settled = false`
		}),
		locals.pb.collection('expense_splits').getFullList({
			filter: `expense.group = "${params.groupId}" && expense.settled = false`
		})
	]);

	const balances = computeNetBalances(
		expenses as unknown as Expense[],
		splits as unknown as ExpenseSplit[]
	);
	const debts = simplifyDebts(balances);

	return {
		debts,
		balances: Object.fromEntries(balances)
	};
};

export const actions: Actions = {
	settleAll: async ({ locals, params }) => {
		if (!locals.user) {
			return fail(401, { error: 'Not authenticated.' });
		}

		try {
			const expenses = await locals.pb.collection('expenses').getFullList({
				filter: `group = "${params.groupId}" && settled = false`
			});

			const today = new Date().toISOString().split('T')[0];
			for (const expense of expenses) {
				await locals.pb.collection('expenses').update(expense.id, {
					settled: true,
					settled_at: today
				});
			}

			return { settledAll: true };
		} catch (err) {
			console.error('settleAll error:', err);
			const message = err instanceof Error ? err.message : 'Failed to settle expenses.';
			return fail(400, { error: message });
		}
	}
};
