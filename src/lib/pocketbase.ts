import PocketBase from 'pocketbase';
import { PUBLIC_POCKETBASE_URL } from '$env/static/public';

export function createPocketBase() {
	return new PocketBase(PUBLIC_POCKETBASE_URL);
}
