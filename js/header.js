// Shared refs populated once the header/menu are injected into the DOM
let logoImg, header, themeToggleBtn, themeToggleIcon, menu, menuBtn;
 
const initHeader = () => {
    logoImg = document.getElementById('logo-img');
    header = document.getElementById('header');
    themeToggleBtn = document.getElementById('theme-toggle-btn');
    themeToggleIcon = document.getElementById('theme-toggle-icon');
    menuBtn = document.getElementById('menu-btn');
    const logoLink = document.getElementById('logo-link');
 
    initTheme();
 
    themeToggleBtn.addEventListener('click', toggleTheme);
    logoLink.addEventListener('click', sendToHomePage);
    menuBtn.addEventListener('click', toggleMenu);
 
    updateHeaderHeightVar();
    
    const headerResizeObserver = new ResizeObserver(updateHeaderHeightVar);
    headerResizeObserver.observe(header);
};
 
const toggleMenu = () => {
    const isOpen = menu.classList.toggle('open');
    document.body.classList.toggle('menu-open', isOpen);
    menuBtn.classList.toggle('open', isOpen); // CSS handles the list/x icon swap via #menu-btn.open
    menuBtn.setAttribute('aria-expanded', isOpen);
};
 
const updateHeaderHeightVar = () => {
    document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
};
 
const sendToHomePage = (e) => { // makes it so that when users that are on the main page click on something that would send them to the main page, doesnt do that and instead it just scrolls up
    e.preventDefault();
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        navigateTo('/');
    }
}