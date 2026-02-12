const currencyFormatters: Record<string, Intl.NumberFormat> = {};

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
	if (!currencyFormatters[currency]) {
		currencyFormatters[currency] = new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency,
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		});
	}
	return currencyFormatters[currency].format(amount);
}

export function formatDate(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
}

export function equalSplit(total: number, count: number): number[] {
	const perPerson = Math.floor((total * 100) / count) / 100;
	const remainder = Math.round((total - perPerson * count) * 100);
	return Array.from({ length: count }, (_, i) =>
		Math.round((perPerson + (i < remainder ? 0.01 : 0)) * 100) / 100
	);
}
