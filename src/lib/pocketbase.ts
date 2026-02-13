import PocketBase from 'pocketbase';
import { env } from '$env/dynamic/public';

export function createPocketBase() {
	return new PocketBase(env.PUBLIC_POCKETBASE_URL);
}
