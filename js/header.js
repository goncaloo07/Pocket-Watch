// Shared refs populated once the header/menu are injected into the DOM
let logoImg, header, themeToggleBtn, themeToggleIcon, menu, menuBtn;

// runs once the header HTML is inside the page
const initHeader = () => {
    logoImg = document.getElementById('logo-img');
    header = document.getElementById('header');
    themeToggleBtn = document.getElementById('theme-toggle-btn');
    themeToggleIcon = document.getElementById('theme-toggle-icon');
    menuBtn = document.getElementById('menu-btn');
    settingsBtn = document.getElementById('settings-btn');
    const logoLink = document.getElementById('logo-link');
 
    initTheme(); // applies the saved theme now that the toggle button exists

    // header buttons
    themeToggleBtn.addEventListener('click', toggleTheme);
    logoLink.addEventListener('click', sendToHomePage);
    menuBtn.addEventListener('click', toggleMenu);
    settingsBtn.addEventListener('click', () => navigateTo('/settings'));
 
    requestAnimationFrame(updateHeaderHeightVar); // first measure, after the browser has drawn the header
    
    // keeps --header-height up to date if the header changes size (for example when the screen is resized)
    const headerResizeObserver = new ResizeObserver((entries) => {
        document.documentElement.style.setProperty('--header-height', `${entries[0].contentRect.height}px`);
    });
    headerResizeObserver.observe(header);
};

// opens or closes the side menu
const toggleMenu = () => {
    const isOpen = menu.classList.toggle('open'); // toggle returns true if the class was added
    document.body.classList.toggle('menu-open', isOpen); // CSS moves the page content to make room for the menu
    menuBtn.classList.toggle('open', isOpen); // CSS handles the list/x icon swap via #menu-btn.open
    menuBtn.setAttribute('aria-expanded', isOpen); // tells screen readers if the menu is open
};

// saves the header height in a CSS variable, so the menu can sit right under the header
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

// "header:loaded" is fired by include-partials.js after all partials are in the DOM
document.addEventListener('header:loaded', initHeader);