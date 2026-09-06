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
 
const applyTheme = (theme) => {
    const themePath = theme === 'dark' ? 'dark' : 'light';
 
    Object.entries(THEME_VARS[themePath]).forEach(([prop, value]) => {
        document.documentElement.style.setProperty(prop, value);
    });
 
    document.documentElement.dataset.theme = themePath;
    themeToggleIcon.classList.toggle('bi-sun', themePath === 'light');
    themeToggleIcon.classList.toggle('bi-moon', themePath === 'dark');
    themeToggleBtn.setAttribute('aria-pressed', themePath === 'dark'); // tells screen readers if dark mode is currently on
 
    shortcutIcon.href = `/assets/icons/${themePath}/favicon.ico`;
    favicon16.href = `/assets/icons/${themePath}/favicon-16x16.png`;
    favicon32.href = `/assets/icons/${themePath}/favicon-32x32.png`;
    appleTouchIcon.href = `/assets/icons/${themePath}/apple-touch-icon.png`;
    manifestLink.href = `/assets/icons/${themePath}/site.webmanifest`;
    document.querySelectorAll('.brand-logo').forEach(img => {
        img.src = `/assets/icons/${themePath}/logo.webp`;
    });     
};
 
const setTheme = (theme) => {
    safeSetItem('theme', theme); // Store the selected theme in localStorage
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
 
const initTheme = () => {
    const storedTheme = localStorage.getItem('theme'); //gets the theme, if there isnt a theme it applies it
    if (storedTheme) {
        applyTheme(storedTheme);
        return;
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
};
 
const toggleTheme = () => {
    const currentTheme = document.documentElement.dataset.theme;
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
};