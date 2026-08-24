<script lang="ts">
	import Picture from '$lib/picture.svelte';
	import type { PortfolioProject } from '$lib/types';

	interface Props {
		project: PortfolioProject;
		customclass?: string;
	}

	let { project, customclass = '' }: Props = $props();
</script>

<article class="portfolio-item {customclass}">
	<a class="card" href="/portfolio/project/{project.slug}">
		{#if project.image}
			<Picture imagesrc={project.image} width="650" height="400" alt={project.Opdrachtgever ?? ''} class="landscape" loading="lazy" />
		{/if}
		<section class="tags">
			{#each project.tags ?? [] as tag}<span class="tag">{tag}</span>{/each}
		</section>
		<section class="contentwrapper">
			<h3>{project.type_site} for {project.Opdrachtgever}</h3>
			<p class="opdracht">{project.opdracht}</p>
		</section>
	</a>
	<a class="project" href="/portfolio/project/{project.slug}">View the full project <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12H19M12 19L19 12L12 5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" /></svg></a>
</article>