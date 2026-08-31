<script lang="ts">
import Head from '$lib/Head.svelte';
import Header from '$lib/Header.svelte';
import Picture from '$lib/picture.svelte';
import Link from '$lib/Link.svelte';
import PortfolioItem from '$lib/PortfolioItem.svelte';
import Heading from '$lib/GeneralHeading.svelte';
import Arrow from '$lib/Arrow.svelte';
import TechStack from '$lib/TechStack.svelte';

import type { PageProps } from './$types';

let { data }: PageProps = $props();
</script>

<Head />
<Header />

<main class="home">

    <!-- section with me and my tech stack -->
    <section class="imgijs">

        <Heading 
            heading_level={1} 
        >Hey! i'm <em>Gijs Nagtegaal</em></Heading>

        <!-- partial to render a picture, requires a src, width and height to work -->
        <Picture 
            imagesrc="/assets/images/gijsmemo"
            width="250"
            height="280"
            alt="Gijs Memo"
            class="memo"
            fetch="high"
        />

        <Arrow />

        {#each data.techStack.slice(0, 6) as tech, i}
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
        
        <Heading 
            heading_level={2} 
        >I am a <em>frontend</em> <em>developer</em></Heading>
        
        <p>In addition to studying Frontend Design & Development at the HvA, I work as a freelance developer helping small business owners create their first professional website or online store.</p>
        
        <Link 
            content="Check my portfolio"
            custom_class="primary"
            svg="true"
        />
    </section>

    <TechStack items={data.techStack} />

    <!-- most recent work -->
    <section class="recentwork">
        
        <Heading heading_level={3}>Recent <em>projects</em></Heading>
        
        <section class="workwrapper">
            {#each data.projects as project}
                <PortfolioItem {project} customclass="scroll-animated" />
            {:else}
                <p>No projects found.</p>
            {/each}
        </section>
    </section>

</main>