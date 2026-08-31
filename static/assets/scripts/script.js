const header = document.querySelector("header");
const supportsScrollAnimations = CSS.supports('animation-timeline', 'scroll()');

if (!supportsScrollAnimations) {
    // We maken een sentinel element aan bovenaan de body
    const scrollSentinel = document.createElement('div');
    scrollSentinel.style.position = 'absolute';
    scrollSentinel.style.top = '50px';
    document.body.prepend(scrollSentinel);

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {

            if (!entry.isIntersecting) {
                header.classList.add("scrolled");
            } else {
                header.classList.remove("scrolled");
            }
        });
    }, {
        threshold: [0]
    });

    observer.observe(scrollSentinel);
}