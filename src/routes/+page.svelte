<script lang="ts">
  // 1. Import your partials as Svelte components
  import Head from '$lib/Head.svelte';
  import Header from '$lib/Header.svelte';
    import Picture from '$lib/picture.svelte';
  import Link from '$lib/Link.svelte';
  import PortfolioItem from '$lib/PortfolioItem.svelte';

  // 2. In SvelteKit, data from your server comes in through the "data" prop
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();
</script>

<Head />
<Header />

<main class="home">

    <!-- section with me and my tech stack -->
    <section class="imgijs">

        <!-- partial to render a heading, in this case with a em at the end for styling -->
        <h1> Hey! i'm <em> Gijs Nagtegaal </em> </h1>

        <!-- partial to render a picture, requires a src, width and height to work -->
        <Picture 
            imagesrc="/assets/images/gijsmemo"
            width="250"
            height="280"
            alt="Gijs Memo"
            class="memo"
            fetch="high"
        />

        <!-- arrow svg -->
        <svg class="arrow" width="78" height="62" viewBox="0 0 78 62" fill="none">
            <!-- SVG paths omitted for brevity, keep your original paths here! -->
            <path d="..." fill="var(--dark-text)"/>
        </svg>

        <!-- Liquid limit: 6 becomes JavaScript .slice(0, 6). We also grab the index 'i' -->
        {#each data.techStack.slice(0, 6) as tech, i}
            <!-- Svelte lets us dynamically build the class string directly in the component -->
            <Picture 
                imagesrc={tech.image}
                imagesrc_dark={tech.image_dark}
                width="80"
                height="80"
                alt={tech.name}
                class="round badge techstack pos-{i + 1}"
                fetch="high"
            />
        {/each}

    </section>

    <!-- About me + portfolio button-->
    <section class="about">
        <h2> I am a <em> frontend </em> <em> developer </em> </h2>
        <p>In addition to studying Frontend Design & Development at the HvA, I work as a freelance developer helping small business owners create their first professional website or online store.</p>
        
        <Link 
            content="Check my portfolio"
            custom_class="primary"
            svg="true"
        />
    </section>

    <!-- section with my tech stack -->
    <section class="techstack"> 
        <h3>My Current <em> tech stack </em></h3>
        <section>
            {#each data.techStack as tech, i}
                <figure>
                    <Picture 
                        imagesrc={tech.image}
                        imagesrc_dark={tech.image_dark}
                        width="100"
                        height="100"
                        class="round badge techstack pos-{i + 1}"
                        fetch="high"
                    />
                    <!-- Notice Svelte just uses a single bracket for variables -->
                    <figcaption>{tech.name}</figcaption>
                </figure>
            {/each}
        </section>
    </section>

    <!-- most recent work -->
    <section class="recentwork">
        <h3> Recent <em> projects </em> </h3>
        <section class="workwrapper">
            {#each data.projects as project}
                <!-- Pass the project object directly into the component -->
                <PortfolioItem {project} customclass="scroll-animated" />
            {:else}
                <!-- The {:else} block runs if the projects array is empty -->
                <p>No projects found.</p>
            {/each}
        </section>
    </section>

</main>