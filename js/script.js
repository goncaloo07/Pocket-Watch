const themeMedia = window.matchMedia('(prefers-color-scheme: dark)');
const updateTheme = () => {
    const dark = themeMedia.matches;
    const themeColorMeta = document.getElementById('theme-color-meta');
    const manifestLink = document.getElementById('manifest-link');
    const shortcutIcon = document.getElementById('shortcut-icon');
    if (themeColorMeta) themeColorMeta.content = dark ? '#000000' : '#ffffff';
    if (manifestLink) manifestLink.href = dark ? '../assets/icons/dark/site.webmanifest' : '../assets/icons/light/site.webmanifest';
    if (shortcutIcon) shortcutIcon.href = dark ? '../assets/icons/dark/favicon.ico' : '../assets/icons/light/favicon.ico';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
};
if (themeMedia.addEventListener) {
    themeMedia.addEventListener('change', updateTheme);
} else if (themeMedia.addListener) {
    themeMedia.addListener(updateTheme);
}
updateTheme();