<script lang="ts">
  interface Props {
    imagesrc: string;
    imagesrc_dark?: string | null;
    class?: string;
    width: string | number;
    height: string | number;
    fetch?: 'high' | 'low' | 'auto';
    loading?: 'eager' | 'lazy';
    style?: string;
    alt?: string;
  }

  let {
    imagesrc,
    imagesrc_dark = null,
    class: cssClass = '',
    width,
    height,
    fetch: fetchPriority = 'auto',
    loading,
    style = '',
    alt = ''
  }: Props = $props();

  let hasRealDarkMode = $derived(Boolean(imagesrc_dark && imagesrc_dark !== '/assets/images/gijsmemo.webp'));
  let isLocalAsset = $derived(imagesrc.includes('/assets/images'));
  let finalLoading = $derived(loading ?? (isLocalAsset ? 'eager' : 'lazy'));
</script>

<!-- 4. Translate the {% if %} statements to {#if} blocks -->
{#if isLocalAsset}
  
  <picture class={cssClass}>
    {#if hasRealDarkMode}
      <source srcset="{imagesrc_dark}.avif?width={width}&height={height}&quality=90" type="image/avif" media="(prefers-color-scheme: dark)" />
      <source srcset="{imagesrc_dark}.webp?width={width}&height={height}&quality=90" type="image/webp" media="(prefers-color-scheme: dark)" />
    {/if}

    <!-- Default / Light mode source -->
    <source srcset="{imagesrc}.avif?width={width}&height={height}&quality=90" type="image/avif" />
    <source srcset="{imagesrc}.webp?width={width}&height={height}&quality=90" type="image/webp" />
    
    <img 
      class={cssClass} 
      src="{imagesrc}?width={width}&height={height}&quality=60" 
      fetchpriority={fetchPriority}
      loading={finalLoading} 
      {style} 
      {alt}
    >
  </picture>

{:else}
  
  <picture class={cssClass}>
    {#if hasRealDarkMode}
      <source srcset="{imagesrc_dark}?width={width}&height={height}&format=avif&quality=90" type="image/avif" media="(prefers-color-scheme: dark)" />
      <source srcset="{imagesrc_dark}?width={width}&height={height}&format=webp&quality=90" type="image/webp" media="(prefers-color-scheme: dark)" />
    {/if}

    <!-- Default / Light mode source -->
    <source srcset="{imagesrc}?width={width}&height={height}&format=avif&quality=90" type="image/avif" />
    <source srcset="{imagesrc}?width={width}&height={height}&format=webp&quality=90" type="image/webp" />
    
    <img 
    class={cssClass}
    src="{imagesrc}?width={width}&height={height}&quality=60"
    fetchpriority={fetchPriority}
    loading={finalLoading} 
    {style} 
    {alt}
    >
  </picture>

{/if}