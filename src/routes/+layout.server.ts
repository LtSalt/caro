import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	let invitationCount = 0;

	if (locals.user) {
		try {
			const result = await locals.pb.collection('groups').getList(1, 1, {
				filter: `invited ~ "${locals.user.id}"`,
				requestKey: null
			});
			invitationCount = result.totalItems;
		} catch (err) {
			console.error('Failed to fetch invitation count:', err);
		}
	}

	return {
		user: locals.user
			? {
					id: locals.user.id,
					email: locals.user.email,
					name: locals.user.name || locals.user.email
				}
			: null,
		invitationCount
	};
};
