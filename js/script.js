const shortcutIcon = document.getElementById('shortcut-icon');
const favicon16 = document.getElementById('favicon-16');
const favicon32 = document.getElementById('favicon-32');
const appleTouchIcon = document.getElementById('apple-touch-icon');
const manifestLink = document.getElementById('manifest-link');

let logoImg, header, themeToggle, themeToggleIcon, menu;

const applyTheme = (theme) => {
    const themePath = theme === 'dark' ? 'dark' : 'light'; // Define the path based on the theme
    if (theme === 'dark') {
        document.documentElement.style.setProperty('--bgcolor', '#1f1f1f'); 
        document.documentElement.style.setProperty('--textcolor', '#ffffff');
        document.documentElement.style.setProperty('--header-bgcolor', '#2c2c2c');
        document.documentElement.style.setProperty('--accent-color', '#3a8c63');
        document.documentElement.style.setProperty('--navcolor', '#2c2c2c');
        document.documentElement.style.setProperty('--border-color', '#444444');
        document.documentElement.style.setProperty('--secondary-color', '#4e4e4e');
        themeToggleIcon.classList.remove('bi-sun');
        themeToggleIcon.classList.add('bi-moon');
    } else {
        document.documentElement.style.setProperty('--bgcolor', '#cdcdcd');
        document.documentElement.style.setProperty('--textcolor', '#1f1f1f');
        document.documentElement.style.setProperty('--header-bgcolor', '#e4e2e2');
        document.documentElement.style.setProperty('--accent-color', '#3a8c63');
        document.documentElement.style.setProperty('--navcolor', '#e4e2e2');
        document.documentElement.style.setProperty('--border-color', '#acaaaa');
        document.documentElement.style.setProperty('--secondary-color', '#686868');
        themeToggleIcon.classList.remove('bi-moon');
        themeToggleIcon.classList.add('bi-sun');
    }
    document.documentElement.dataset.theme = theme; // Set the data-theme attribute for CSS targeting
    shortcutIcon.href = `/assets/icons/${themePath}/favicon.ico`; // Update the favicon based on the theme
    favicon16.href = `/assets/icons/${themePath}/favicon-16x16.png`; // Update the 16x16 favicon based on the theme
    favicon32.href = `/assets/icons/${themePath}/favicon-32x32.png`; // Update the 32x32 favicon based on the theme
    appleTouchIcon.href = `/assets/icons/${themePath}/apple-touch-icon.png`; // Update the Apple touch icon based on the theme
    manifestLink.href = `/assets/icons/${themePath}/site.webmanifest`; // Update the manifest link based on the theme
    logoImg.src = `/assets/icons/${themePath}/logo.png`; // Update the logo image based on the theme
};

const setTheme = (theme) => {
    localStorage.setItem('theme', theme); // Store the selected theme in localStorage
    applyTheme(theme);
}

const getTheme = (theme) => {
    const storedTheme = localStorage.getItem('theme'); // Retrieve the stored theme from localStorage
    if (storedTheme) {
        applyTheme(storedTheme); // Apply the stored theme if it exists
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches; // Check if the user prefers a dark color scheme
        const defaultTheme = prefersDark ? 'dark' : 'light'; // Set the default theme based on the user's preference
        applyTheme(defaultTheme);
    }
}

const changeTheme = () => {
    const currentTheme = document.documentElement.dataset.theme;
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark'; // Toggle between dark and light themes
    setTheme(newTheme); // Set the new theme
}

const initHeader = () => {
    logoImg = document.getElementById("logo-img");
    header = document.getElementById('header');
    themeToggle = document.getElementById('theme-toggle-btn');
    themeToggleIcon = document.getElementById('theme-toggle-icon');
    const logoLink = document.getElementById('logo-link');
    const menuBtn = document.getElementById('menu-btn');

    getTheme();

    themeToggle.addEventListener('click', changeTheme);

    logoLink.addEventListener('click', function (e) {
        e.preventDefault();
        if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            window.location.href = '/';
        }
    });

    menuBtn.addEventListener('click', () => {
        const isOpen = menu.classList.toggle('open');
        document.body.classList.toggle('menu-open', isOpen);
        menuBtn.setAttribute('aria-expanded', isOpen);

        if (isOpen) {
            menuBtnIcon.classList.remove('bi-list');
            menuBtnIcon.classList.add('bi-x');
        } else {
            menuBtnIcon.classList.remove('bi-x');
            menuBtnIcon.classList.add('bi-list');
        }
    });

    const setHeaderHeightVar = () => {
        document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
    };
    setHeaderHeightVar();
    window.addEventListener('resize', setHeaderHeightVar);
};

const initMenu = () => {
    menu = document.getElementById('menu');
}

document.addEventListener('header:loaded', initHeader); // Aguarda o evento de carregamento do header antes de inicializar a lógica do header

document.addEventListener('menu:loaded', initMenu); // Aguarda o evento de carregamento do menu antes de inicializar a lógica do menu