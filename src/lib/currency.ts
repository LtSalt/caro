/**
 * Convert an amount between currencies using the Frankfurter API.
 * Uses historical rates for the given date.
 */
export async function convertCurrency(
	amount: number,
	from: string,
	to: string,
	date: string
): Promise<number> {
	if (from === to) return amount;

	const res = await fetch(
		`https://api.frankfurter.dev/v1/${date}?from=${from}&to=${to}&amount=${amount}`
	);

	if (!res.ok) {
		throw new Error(`Currency conversion failed: ${res.status} ${res.statusText}`);
	}

	const data = await res.json();
	return data.rates[to];
}
