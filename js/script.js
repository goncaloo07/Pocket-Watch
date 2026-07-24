// DOM references
const shortcutIcon = document.getElementById('shortcut-icon');
const favicon16 = document.getElementById('favicon-16');
const favicon32 = document.getElementById('favicon-32');
const appleTouchIcon = document.getElementById('apple-touch-icon');
const manifestLink = document.getElementById('manifest-link');
const addTransactionBtn = document.getElementById('add-transaction-btn');
const transactionModal = document.getElementById('transaction-modal-overlay');
const closeTransactionModalBtn = document.getElementById('close-modal-btn');
const cancelTransactionModalBtn = document.getElementById('cancel-transaction-btn');
const transactionForm = document.getElementById('transaction-form');
const transactionsEmptyDiv = document.getElementById('transactions-empty');
const transactionsListEl = document.getElementById('transactions-list');

//populated when the menu and header are injected into the DOM
let logoImg, header, themeToggleBtn, themeToggleIcon, menu, menuBtn;

// Constants
const CATEGORY_ICONS = new Map([
    ["Other", "bi-three-dots"],
    ["Food", "bi-cup-straw"],
    ["Groceries", "bi-basket"],
    ["Transport", "bi-car-front"],
    ["Housing", "bi-house-door"],
    ["Bills & Utilities", "bi-lightning-charge"],
    ["Health", "bi-heart-pulse"],
    ["Shopping", "bi-bag"],
    ["Entertainment", "bi-film"],
    ["Education", "bi-mortarboard"],
    ["Salary", "bi-briefcase"],
    ["Gift", "bi-gift"],
    ["Investment", "bi-graph-up-arrow"],
    ["Loan", "bi-cash-coin"],
    ["Refund", "bi-arrow-counterclockwise"],
    ["Freelance", "bi-laptop"],
]) //icon for each category

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
 
    shortcutIcon.href = `/assets/icons/${themePath}/favicon.ico`;
    favicon16.href = `/assets/icons/${themePath}/favicon-16x16.png`;
    favicon32.href = `/assets/icons/${themePath}/favicon-32x32.png`;
    appleTouchIcon.href = `/assets/icons/${themePath}/apple-touch-icon.png`;
    manifestLink.href = `/assets/icons/${themePath}/site.webmanifest`;
    logoImg.src = `/assets/icons/${themePath}/logo.png`;
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

const initTheme = () => {
    const storedTheme = localStorage.getItem('theme');
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

//Header functions

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
    window.addEventListener('resize', updateHeaderHeightVar);
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
        window.location.href = '/';
    }
}

//Menu functions

const initMenu = () => {
    menu = document.getElementById('menu');

    document.querySelectorAll('#menu a[href="/"]').forEach((link) => { //if there's an link for the main page it will do the sendToHomePage function
        link.addEventListener('click', sendToHomePage);
    });
};

//Transaction Modal functions

const getTodayISO = () => { //gets today date for the modal date default
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const toggleTransactionModal = () => { //opens and closes the modal and gets the default date for the date input
    const isOpen = transactionModal.classList.toggle('open');
    if (isOpen) {
        document.getElementById('transaction-date').value = getTodayISO();
    }
};

//Transaction functions

const addTransaction = (e) => {
    e.preventDefault();
 
    const isSpending = document.getElementById('type-spending').checked; //checks if its spending or receiving
    const rawAmount = parseFloat(document.getElementById('transaction-amount').value) || 0; //gets the amount of the transaction
 
    const transaction = {
        transactionName: document.getElementById('transaction-name').value,
        transactionDate: document.getElementById('transaction-date').value,
        transactionType: isSpending ? 'spending' : 'receiving',
        transactionCat: document.getElementById(
            isSpending ? 'transaction-category-spending' : 'transaction-category-receiving'
        ).value,
        transactionAmount: (isSpending ? -rawAmount : rawAmount).toFixed(2),
    };
 
    const transactions = getTransactions();
    transactions.push(transaction);
    saveTransactions(transactions); //adds the transaction to the localStorage
 
    transactionForm.reset();
    toggleTransactionModal();
    renderTransactions();
}; 

const getTransactions = () => { //if there is a transactions in localStorage, it will return it, if not it will create it
    try {
        return JSON.parse(localStorage.getItem('transactions')) ?? [];
    } catch {
        localStorage.setItem('transactions', '[]');
        return [];
    }
};

const saveTransactions = (transactions) => {
    localStorage.setItem('transactions', JSON.stringify(transactions)); //sends the transactions to localStorage
};

// Transactions div functions

const buildTransactionRow = ({ transactionName, transactionAmount, transactionDate, transactionCat }) => {
    const icon = CATEGORY_ICONS.get(transactionCat) || 'bi-three-dots'; //gets the icon for the transaction
    const amountClass = parseFloat(transactionAmount) >= 0 ? 'positive' : 'negative'; //checks if its positive or negative
 
    return `
        <li class="transaction-row">
            <div class="transaction-left">
                <div class="transaction-icon"><i class="bi ${icon}" aria-hidden="true"></i></div>
                <div class="transaction-info">
                    <span class="transaction-name">${transactionName}</span>
                    <span class="transaction-meta">${transactionCat} | <span class="transaction-date">${transactionDate}</span></span>
                </div>
            </div>
            <span class="transaction-amount ${amountClass}">${transactionAmount}€</span>
        </li>
    `;
};

const renderTransactions = () => {
    const transactions = getTransactions(); 
 
    if (transactions.length === 0) { //if there aren't any transactions, the empty message will show
        transactionsEmptyDiv.classList.remove('hidden');
    } else {
        transactionsEmptyDiv.classList.add('hidden');
    }
    transactionsListEl.innerHTML = transactions.map(buildTransactionRow).join(''); //sends all rows to a map, then joins it to build the code
};

// Initializing functions
document.addEventListener('header:loaded', initHeader);
document.addEventListener('menu:loaded', initMenu);
 
addTransactionBtn.addEventListener('click', toggleTransactionModal);
closeTransactionModalBtn.addEventListener('click', toggleTransactionModal);
cancelTransactionModalBtn.addEventListener('click', toggleTransactionModal);
transactionForm.addEventListener('submit', addTransaction);
 
renderTransactions();