<script lang="ts">
	import { page } from '$app/state';

	const links = [
		{ href: '/', label: 'Home' },
		{ href: '/portfolio', label: 'Portfolio' },
		{ href: '/diensten', label: 'Services' },
		{ href: '/over-mij', label: 'About me' }
	];
</script>

<header class="topnav">
	<nav class="mobile-nav">
		<a class="logo" href="/">
            <img class="logoimg" src="/assets/images/logo.avif" alt="Gijs Nagtegaal" />
        </a>
		<button class="hamburger" popovertarget="mobile-menu">
			<svg viewBox="0 0 32 32" aria-hidden="true"><path class="line line-top-bottom" d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"></path><path class="line" d="M7 16 27 16"></path></svg>
			Menu
		</button>
		<nav class="top-mobile-nav" id="mobile-menu" popover="auto">
			<nav class="hamburger-menu">
				{#each links as link}
					<a href={link.href} class:active={page.url.pathname === link.href}>{link.label}</a>
				{/each}
			</nav>
		</nav>
	</nav>

	<nav class="desktop-nav">
		<a class="logo" href="/">
            <img class="logoimg" src="/assets/images/logo.avif" alt="Gijs Nagtegaal" />
        </a>
		<nav class="desktop-menu">
			{#each links as link}
				<a href={link.href} class:active={page.url.pathname === link.href}>{link.label}</a>
			{/each}
		</nav>
		<a class="contact" href="/contact">Contact</a>
	</nav>
</header>