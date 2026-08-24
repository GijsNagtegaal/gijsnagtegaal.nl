import type { PageServerLoad } from './$types';
import { getPortfolio } from '$lib/server/api';

export const load: PageServerLoad = async ({ fetch }) => ({
	portfolioItems: await getPortfolio(fetch)
});