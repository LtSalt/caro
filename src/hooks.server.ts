import type { Handle } from '@sveltejs/kit';
import { createPocketBase } from '$lib/pocketbase';
import { dev } from '$app/environment';

export const handle: Handle = async ({ event, resolve }) => {
	const pb = createPocketBase();

	const cookie = event.request.headers.get('cookie') || '';
	pb.authStore.loadFromCookie(cookie);

	if (pb.authStore.isValid) {
		try {
			await pb.collection('users').authRefresh();
		} catch {
			pb.authStore.clear();
		}
	}

	event.locals.pb = pb;
	event.locals.user = pb.authStore.isValid ? pb.authStore.record : null;

	const response = await resolve(event);

	const setCookie = pb.authStore.exportToCookie({
		httpOnly: false,
		secure: !dev,
		sameSite: 'lax',
		path: '/'
	});
	response.headers.append('set-cookie', setCookie);

	return response;
};
