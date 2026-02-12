import type { Handle } from '@sveltejs/kit';
import { createPocketBase } from '$lib/pocketbase';

export const handle: Handle = async ({ event, resolve }) => {
	const pb = createPocketBase();

	// Load auth from cookie
	const cookie = event.request.headers.get('cookie') || '';
	pb.authStore.loadFromCookie(cookie);

	// Try to refresh auth if valid
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

	// Set auth cookie on response
	const setCookie = pb.authStore.exportToCookie({
		httpOnly: false,
		secure: false, // set true in production
		sameSite: 'lax',
		path: '/'
	});
	response.headers.append('set-cookie', setCookie);

	return response;
};
