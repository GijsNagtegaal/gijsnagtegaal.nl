<script lang="ts">
	import type { PageProps } from './$types';
	import Head from '$lib/Head.svelte';
	import Header from '$lib/Header.svelte';
	import PortfolioItem from '$lib/PortfolioItem.svelte';

	let { data }: PageProps = $props();
</script>

<Head />
<Header />
<main class="portfolio">
	<h1 class="breathingspace">Portfolio</h1>
	<p class="breathingspace">Here is a selection of projects I have worked on.</p>
	<section class="workwrapper breathingspace">
		{#each data.portfolioItems as project}
			<PortfolioItem {project} customclass="scroll-animated" />
		{:else}
			<p>No projects found.</p>
		{/each}
	</section>
</main>