<script lang="ts">
	interface Props {
		content: string;
		custom_class?: string;
		svg?: boolean | string;
	}

	let { content, custom_class = '', svg = false }: Props = $props();
</script>

<a class={custom_class} href="/portfolio">
	{content}
	{#if svg === true || svg === 'true'}
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
	{/if}
</a>