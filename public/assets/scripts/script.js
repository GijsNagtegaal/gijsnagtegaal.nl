const header = document.querySelector("header");

// Check if the browser supports scroll-driven animations
const supportsScrollAnimations = CSS.supports('animation-timeline', 'scroll()');

if (!supportsScrollAnimations) {
    window.addEventListener("scroll", () => {
        if (window.scrollY > 50) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }
    });
}

const menu = document.querySelector('#mobile-menu');
const icon = document.querySelector('#icon');

menu.addEventListener('beforetoggle', (event) => {

    if (event.newState === "closed") {

        icon.classList.remove('open');
        
    } else {

        icon.classList.add('open');
    }
}); 