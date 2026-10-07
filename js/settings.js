// runs once when the settings page loads
const initSettingsPage = () => {
    const savedTheme = localStorage.getItem('theme') || 'system';
    settingsTheme = document.querySelectorAll('[name="settings-theme"]');
    settingsThemeDark = document.getElementById('settings-theme-dark');
    settingsThemeLight = document.getElementById('settings-theme-light');
    settingsThemeSystem = document.getElementById('settings-theme-system');
    if (savedTheme === 'dark') {
        settingsThemeDark.checked = true;
    } else if (savedTheme === 'light') {
        settingsThemeLight.checked = true;
    } else {
        settingsThemeSystem.checked = true;
    }

    settingsTheme.forEach((radio) => {
        radio.addEventListener('change', () => {
            if (settingsThemeDark.checked) {
                setTheme('dark');
            } else if (settingsThemeLight.checked) {
                setTheme('light');
            } else {
                localStorage.removeItem('theme');
                applyTheme(resolveTheme());
            }
        });
    });
};