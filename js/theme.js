// DOM references 
const shortcutIcon = document.getElementById('shortcut-icon');
const favicon16 = document.getElementById('favicon-16');
const favicon32 = document.getElementById('favicon-32');
const appleTouchIcon = document.getElementById('apple-touch-icon');
const manifestLink = document.getElementById('manifest-link');
 
const THEME_VARS = {
    dark: {
        '--bgcolor': '#1f1f1f',
        '--textcolor': '#ffffff',
        '--header-bgcolor': '#2c2c2c',
        '--accent-color': '#3a8c63',
        '--navcolor': '#2c2c2c',
        '--border-color': '#444444',
        '--secondary-color': '#4e4e4e',
    },
    light: {
        '--bgcolor': '#cdcdcd',
        '--textcolor': '#1f1f1f',
        '--header-bgcolor': '#e4e2e2',
        '--accent-color': '#3a8c63',
        '--navcolor': '#e4e2e2',
        '--border-color': '#acaaaa',
        '--secondary-color': '#686868',
    },
}; //colors for each theme

// paints the page with a theme ("dark" or "light"): colors, toggle icon, favicons and logos
const applyTheme = (theme) => {
    const themePath = theme === 'dark' ? 'dark' : 'light'; // anything that is not "dark" becomes light

    // sets each CSS variable on <html>, so the whole stylesheet changes at once
    Object.entries(THEME_VARS[themePath]).forEach(([prop, value]) => {
        document.documentElement.style.setProperty(prop, value);
    });
 
    document.documentElement.dataset.theme = themePath; // CSS also uses [data-theme="dark"]
    // the header may not exist yet, so only touch the toggle button if it does
    if (themeToggleIcon && themeToggleBtn) {
        themeToggleIcon.classList.toggle('bi-sun', themePath === 'light');
        themeToggleIcon.classList.toggle('bi-moon', themePath === 'dark');
        themeToggleBtn.setAttribute('aria-pressed', themePath === 'dark'); // tells screen readers if dark mode is currently on
    }
 
    // each theme has its own set of icons, so the paths follow the theme name
    shortcutIcon.href = `/assets/icons/${themePath}/favicon.ico`;
    favicon16.href = `/assets/icons/${themePath}/favicon-16x16.png`;
    favicon32.href = `/assets/icons/${themePath}/favicon-32x32.png`;
    appleTouchIcon.href = `/assets/icons/${themePath}/apple-touch-icon.png`;
    manifestLink.href = `/assets/icons/${themePath}/site.webmanifest`;
    document.querySelectorAll('.brand-logo').forEach(img => {
        img.src = `/assets/icons/${themePath}/logo.webp`;
    });     
};

// saves the user's choice and applies it. Example: setTheme('dark') keeps dark on the next visit
const setTheme = (theme) => {
    safeSetItem('theme', theme); // Store the selected theme in localStorage
    applyTheme(resolveTheme(theme));
}

// runs on page load: uses the saved theme, or the device setting if nothing was saved
const initTheme = () => {
    const storedTheme = localStorage.getItem('theme');
    applyTheme(resolveTheme(storedTheme));
};

// header button: flips between light and dark
const toggleTheme = () => {
    const currentTheme = document.documentElement.dataset.theme;
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
};

// turns a saved value into a real theme. "system" (or nothing saved) follows the device
const resolveTheme = (theme) => {
    if (theme === 'dark' || theme === 'light') {
        return theme;
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches; // true if the device is in dark mode
    return prefersDark ? 'dark' : 'light';
};