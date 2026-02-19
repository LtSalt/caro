import type { RecordModel } from 'pocketbase';

export const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export interface User extends RecordModel {
	email: string;
	name: string;
	avatar?: string;
}

export interface Group extends RecordModel {
	name: string;
	description: string;
	currency: Currency;
	created_by: string;
	members: string[];
	expand?: {
		created_by?: User;
		members?: User[];
	};
}

export interface Expense extends RecordModel {
	group: string;
	description: string;
	amount: number;
	paid_by: string;
	split_type: 'equal' | 'exact' | 'percentage';
	date: string;
	settled: boolean;
	settled_at?: string;
	deleted_at?: string;
	expand?: {
		paid_by?: User;
	};
}

export interface ExpenseSplit extends RecordModel {
	expense: string;
	user: string;
	amount: number;
	expand?: {
		user?: User;
		expense?: Expense;
	};
}
