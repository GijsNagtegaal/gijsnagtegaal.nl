<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        heading_level: number;
        my_class?: string;
        children: Snippet;
    }

    let { heading_level, my_class = '', children }: Props = $props();
    let tag = $derived(`h${Math.min(6, Math.max(1, Math.floor(heading_level)))}`);
</script>

<svelte:element this={tag} class={my_class}>{@render children()}</svelte:element>