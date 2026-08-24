<script lang="ts">
	interface Props {
		heading_level: number | string;
		my_class?: string;
		content: string;
	}

	let { heading_level, my_class = '', content }: Props = $props();
</script>

{#if heading_level === 1}
	<h1 class={my_class}>{content}</h1>
{:else if heading_level === 2}
	<h2 class={my_class}>{content}</h2>
{:else if heading_level === 3}
	<h3 class={my_class}>{content}</h3>
{:else if heading_level === 4}
	<h4 class={my_class}>{content}</h4>
{:else if heading_level === 5}
	<h5 class={my_class}>{content}</h5>
{:else}
	<h6 class={my_class}>{content}</h6>
{/if}