import type { PageServerLoad } from './$types';
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
