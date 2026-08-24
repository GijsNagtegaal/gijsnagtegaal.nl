import type { PageServerLoad } from './$types';
import { getPortfolio, getTechStack } from '$lib/server/api';

export const load: PageServerLoad = async ({ fetch }) => ({
	projects: await getPortfolio(fetch),
	techStack: await getTechStack(fetch)
});