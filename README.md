# POCKET WATCH

Pocket Watch is a personal finance web application designed to help users track their spending and savings, and better understand how they manage their money.

The project is built entirely with **HTML, CSS, and JavaScript**. It has no backend or database and runs completely in the browser. All your data is saved in the browser's localStorage and never leaves the device. The only thing the app asks from the internet is exchange rates, from the public [Frankfurter](https://frankfurter.dev) API. Those requests only contain dates, never your transactions or budgets.

## Features

- Add, edit and delete transactions (spending and receiving)
- Search transactions by name and filter them by type, category, date and amount
- Set budgets per category, or a general one, that renew weekly, monthly, yearly or until a date
- See how much is left in each budget and how much you can spend per day
- Balance history chart for 7 days, 30 days, 1 year or all time, with the transactions of each day
- Breakdown chart of spending by category, or spending vs receiving
- Choose the currency used in the app. Each transaction and budget keeps the currency it was created in and is converted using the exchange rate of its own date
- English and Portuguese
- Light, dark or system theme
- Export your data as JSON (full backup) or CSV (transactions with the balance after each one)
- Import a file you exported before, or delete all your data

## Live Demo

You can try the current version of Pocket Watch here:

**[Open Pocket Watch](https://pocket-watch-murex.vercel.app/)**

## License

This project is licensed under the **MIT License**.