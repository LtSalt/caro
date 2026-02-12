export interface Debt {
	from: string;
	to: string;
	amount: number;
}

export function computeNetBalances(
	expenses: Array<{ id: string; paid_by: string; amount: number }>,
	splits: Array<{ expense: string; user: string; amount: number }>,
	settlements: Array<{ paid_by: string; paid_to: string; amount: number }>
): Map<string, number> {
	const balances = new Map<string, number>();

	const add = (userId: string, amount: number) => {
		balances.set(userId, (balances.get(userId) ?? 0) + amount);
	};

	for (const expense of expenses) {
		add(expense.paid_by, expense.amount);

		const expenseSplits = splits.filter((s) => s.expense === expense.id);
		for (const split of expenseSplits) {
			add(split.user, -split.amount);
		}
	}

	for (const settlement of settlements) {
		add(settlement.paid_by, settlement.amount);
		add(settlement.paid_to, -settlement.amount);
	}

	for (const [userId, amount] of balances) {
		if (Math.abs(amount) < 0.01) {
			balances.delete(userId);
		}
	}

	return balances;
}

export function simplifyDebts(balances: Map<string, number>): Debt[] {
	const creditors: Array<{ userId: string; amount: number }> = [];
	const debtors: Array<{ userId: string; amount: number }> = [];

	for (const [userId, amount] of balances) {
		if (amount > 0.01) {
			creditors.push({ userId, amount });
		} else if (amount < -0.01) {
			debtors.push({ userId, amount: -amount });
		}
	}

	creditors.sort((a, b) => b.amount - a.amount);
	debtors.sort((a, b) => b.amount - a.amount);

	const debts: Debt[] = [];
	let ci = 0;
	let di = 0;

	while (ci < creditors.length && di < debtors.length) {
		const amount = Math.min(creditors[ci].amount, debtors[di].amount);
		if (amount > 0.01) {
			debts.push({
				from: debtors[di].userId,
				to: creditors[ci].userId,
				amount: Math.round(amount * 100) / 100
			});
		}

		creditors[ci].amount -= amount;
		debtors[di].amount -= amount;

		if (creditors[ci].amount < 0.01) ci++;
		if (debtors[di].amount < 0.01) di++;
	}

	return debts;
}
