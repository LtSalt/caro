import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { computeNetBalances, simplifyDebts } from '$lib/balance';
import type { Expense, ExpenseSplit, Settlement } from '$lib/types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const [expenses, splits, settlements] = await Promise.all([
		locals.pb.collection('expenses').getFullList({
			filter: `group = "${params.groupId}"`
		}),
		locals.pb.collection('expense_splits').getFullList({
			filter: `expense.group = "${params.groupId}"`
		}),
		locals.pb.collection('settlements').getFullList({
			filter: `group = "${params.groupId}"`,
			expand: 'paid_by,paid_to',
			sort: '-date,-created'
		})
	]);

	const balances = computeNetBalances(
		expenses as unknown as Expense[],
		splits as unknown as ExpenseSplit[],
		settlements as unknown as Settlement[]
	);
	const debts = simplifyDebts(balances);

	return {
		debts,
		settlements,
		balances: Object.fromEntries(balances)
	};
};

export const actions: Actions = {
	settle: async ({ request, locals, params }) => {
		if (!locals.user) {
			return fail(401, { error: 'Not authenticated.' });
		}

		const data = await request.formData();
		const paid_by = data.get('paid_by') as string;
		const paid_to = data.get('paid_to') as string;
		const amount = parseFloat(data.get('amount') as string);

		if (!paid_by || !paid_to || !amount || amount <= 0) {
			return fail(400, { error: 'Invalid settlement data.' });
		}

		try {
			await locals.pb.collection('settlements').create({
				group: params.groupId,
				paid_by,
				paid_to,
				amount,
				date: new Date().toISOString()
			});
			return { settled: true };
		} catch {
			return fail(400, { error: 'Failed to create settlement.' });
		}
	}
};
