<script lang="ts">
	import Picture from '$lib/picture.svelte';
	import type { TechStackItem } from '$lib/types';

	interface Props {
		items: TechStackItem[];
	}

	let { items }: Props = $props();
</script>

<section class="techstack">
	<h3>My Current <em>tech stack</em></h3>
	<section>
		{#each items as tech, i}
			<figure>
				<Picture imagesrc={tech.image} imagesrc_dark={tech.image_dark} width="100" height="100" alt={tech.name} class="round badge techstack pos-{i + 1}" fetch="high" />
				<figcaption>{tech.name}</figcaption>
			</figure>
		{/each}
	</section>
</section>