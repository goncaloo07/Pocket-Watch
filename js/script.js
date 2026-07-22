const themeMedia = window.matchMedia('(prefers-color-scheme: dark)'); //checks if the user has set a preference for dark mode
const updateTheme = () => {
    const dark = themeMedia.matches; //if the user has a preference for dark mode, dark will be true, otherwise it will be false
    const themeColorMeta = document.getElementById('theme-color-meta');
    const manifestLink = document.getElementById('manifest-link');
    const shortcutIcon = document.getElementById('shortcut-icon');
    if (themeColorMeta) themeColorMeta.content = dark ? '#000000' : '#ffffff';  //if the user has a preference for dark mode, the theme color will be set to black, otherwise it will be set to white
    if (manifestLink) manifestLink.href = dark ? '../assets/icons/dark/site.webmanifest' : '../assets/icons/light/site.webmanifest'; // if the user has a preference for dark mode, the manifest will be set to the dark version, otherwise it will be set to the light version
    if (shortcutIcon) shortcutIcon.href = dark ? '../assets/icons/dark/favicon.ico' : '../assets/icons/light/favicon.ico'; // if the user has a preference for dark mode, the shortcut icon will be set to the dark version, otherwise it will be set to the light version
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'; // if the user has a preference for dark mode, the data-theme attribute will be set to dark, otherwise it will be set to light
};
if (themeMedia.addEventListener) {
    themeMedia.addEventListener('change', updateTheme);
} else if (themeMedia.addListener) {
    themeMedia.addListener(updateTheme);
}
updateTheme();