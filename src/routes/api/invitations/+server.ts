import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) throw error(401);

	try {
		const groups = await locals.pb.collection('groups').getFullList({
			filter: `invited ~ "${locals.user.id}"`
		});

		return json(
			groups.map((g) => ({
				id: g.id,
				name: g.name
			}))
		);
	} catch (err) {
		console.error('Failed to fetch invitations:', err);
		throw error(500, 'Failed to fetch invitations.');
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) throw error(401);

	const { groupId, action } = await request.json();

	if (!groupId || !['accept', 'decline'].includes(action)) {
		throw error(400, 'Invalid request.');
	}

	const group = await locals.pb.collection('groups').getOne(groupId);
	const invited = Array.isArray(group.invited) ? (group.invited as string[]) : [];

	if (!invited.includes(locals.user.id)) {
		throw error(403, 'You are not invited to this group.');
	}

	if (action === 'accept') {
		const members = group.members as string[];
		await locals.pb.collection('groups').update(groupId, {
			invited: invited.filter((id: string) => id !== locals.user!.id),
			members: [...members, locals.user.id]
		});
	} else {
		await locals.pb.collection('groups').update(groupId, {
			invited: invited.filter((id: string) => id !== locals.user!.id)
		});
	}

	return json({ success: true });
};
