import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getProject } from '$lib/server/api';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const project = await getProject(params.slug, fetch);
	if (!project) error(404, 'Project niet gevonden');
	return { project };
};