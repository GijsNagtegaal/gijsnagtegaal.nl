// const header = document.querySelector("header");

// window.addEventListener("scroll", () => {
//     if (window.scrollY > 50) {
//         header.classList.add("scrolled");
//     } else {
//         header.classList.remove("scrolled");
//     }
// });

const btn = document.querySelector('.hamburger');
const icon = document.querySelector('#icon');

document.addEventListener('toggle', (event) => {
    if (event.target.id === 'mobile-menu') {
        if (event.newState === 'open') {
            icon.classList.add('open');
        } else {
            icon.classList.remove('open');
        }
    }
});