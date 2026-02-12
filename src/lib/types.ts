import type { RecordModel } from 'pocketbase';

export interface User extends RecordModel {
	email: string;
	name: string;
	avatar?: string;
}

export interface Group extends RecordModel {
	name: string;
	description: string;
	currency: 'EUR' | 'USD' | 'GBP' | 'CHF';
	created_by: string;
	expand?: {
		created_by?: User;
	};
}

export interface GroupMember extends RecordModel {
	group: string;
	user: string;
	role: 'owner' | 'member';
	expand?: {
		user?: User;
		group?: Group;
	};
}

export interface Expense extends RecordModel {
	group: string;
	description: string;
	amount: number;
	paid_by: string;
	split_type: 'equal' | 'exact' | 'percentage';
	date: string;
	created_by: string;
	expand?: {
		paid_by?: User;
		created_by?: User;
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

export interface Settlement extends RecordModel {
	group: string;
	paid_by: string;
	paid_to: string;
	amount: number;
	date: string;
	expand?: {
		paid_by?: User;
		paid_to?: User;
	};
}
