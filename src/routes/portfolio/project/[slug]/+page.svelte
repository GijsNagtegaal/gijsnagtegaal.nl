<script lang="ts">
	import type { PageProps } from './$types';
	import Head from '$lib/Head.svelte';
	import Header from '$lib/Header.svelte';
	import Picture from '$lib/picture.svelte';

	let { data }: PageProps = $props();
</script>

<Head />
<Header />
<main>
	<section>
		<h1>{data.project.type_site} for {data.project.Opdrachtgever}</h1>
		<p>{data.project.opdracht}</p>
		<header class="tag-container">{#each data.project.tags ?? [] as tag}<span class="tag">{tag}</span>{/each}</header>
		{#if data.project.image}<Picture imagesrc={data.project.image} width="800" height="450" alt={data.project.Opdrachtgever ?? ''} class="landscape" loading="eager" />{/if}
		<p class="description">{data.project.description}</p>
		<a href="/portfolio">Back to the overview</a>
	</section>
</main>