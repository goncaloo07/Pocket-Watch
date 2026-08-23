const CHART_WIDTH = 600;
const CHART_HEIGHT = 200;
const CHART_PADDING = 20;

const calcBalance = () => {
    const transactions = getTransactions()
    let balance = 0
    transactions.forEach(transaction => {
        balance += parseFloat(transaction.transactionAmount) // gets the total balance, by summing all values together
    })
    return balance
};

const initBalancePage = () => {
    balanceChartDiv = document.getElementById('balance-chart-div');
    balanceSummaryDiv = document.getElementById('balance-summary-div');
    balancePeriodInputs = document.querySelectorAll('[name="balance-period"]');
    balancePoints = document.getElementById('balance-points');

    balancePeriodInputs.forEach((period => period.addEventListener("change", renderBalanceHistory)));

    renderBalanceHistory()
};

const renderBalanceHistory = () => {
    const selectedPeriod = document.querySelector('input[name="balance-period"]:checked').value;
    const balanceHistory = getBalanceHistory(selectedPeriod);
    const points = getBalancePoints(balanceHistory, CHART_WIDTH, CHART_HEIGHT, CHART_PADDING);
    const d = buildLinePath(points);
    document.getElementById('balance-line').setAttribute('d', d)
    balancePoints.innerHTML = buildPointCircles(points);
    const gridLines = getBalanceGridLines(balanceHistory, CHART_HEIGHT, CHART_PADDING);
    document.getElementById('balance-grid').innerHTML = buildGridLines(gridLines, CHART_WIDTH);
    document.getElementById('balance-grid-labels').innerHTML = buildGridLabels(gridLines, CHART_HEIGHT);
    const summary = getBalanceSummary(balanceHistory, selectedPeriod);
    balanceSummaryDiv.innerHTML = buildBalanceSummary(summary, selectedPeriod);
}

// Picks `steps + 1` values evenly spread between the data's min and max, and works out the y position for each — same math as getBalancePoints, so a grid line always lines up with the balance it represents.
// if balances range from 100€ to 400€ and steps=3, this returns 4 lines at 100€, 200€, 300€, 400€.
const getBalanceGridLines = (data, chartHeight, padding, steps = 3) => {
    if (data.length === 0) return [];

    const balances = data.map(d => parseFloat(d.balance));
    const min = Math.min(...balances);
    const max = Math.max(...balances);

    // flat balance (no change at all) — just show that one value in the middle
    if (max === min) return [{ value: min, y: chartHeight / 2 }];

    return Array.from({ length: steps + 1 }, (_, i) => {
        const fraction = i / steps; // 0 = min (bottom), 1 = max (top)
        const value = min + (max - min) * fraction;
        const y = chartHeight - (fraction * (chartHeight - 2 * padding) + padding);
        return { value, y };
    });
};

const buildGridLines = (gridLines, plotWidth) => {
    return gridLines.map(line =>
        `<line x1="0" y1="${line.y}" x2="${plotWidth}" y2="${line.y}" class="balance-grid-line"/>`
    ).join('');
};

const buildGridLabels = (gridLines, chartHeight) => {
    return gridLines.map(line => {
        const topPercent = (line.y / chartHeight) * 100;
        return `<span class="balance-grid-label" style="top: ${topPercent}%">${Math.round(line.value)}€</span>`;
    }).join('');
};

const getBalancePoints = (data, chartWidth, chartHeight, padding) => {
    // if there isn't any data, return an empty array to avoid errors
    if (data.length === 0) return [];

    // get the min and max of the data
    const balances = data.map(d => parseFloat(d.balance));
    const min = Math.min(...balances);
    const max = Math.max(...balances);

    // get x and y coordinates for each point
    return data.map((point, i) => {
        const x = data.length === 1 ? chartWidth / 2 : (i / (data.length - 1)) * chartWidth;
        const fraction = max === min ? 0.5 : (parseFloat(point.balance) - min) / (max - min);
        const y = chartHeight - (fraction * (chartHeight - 2 * padding) + padding);
        return { x, y, hasTransactions: point.hasTransactions };
    });
};

const buildLinePath = (points) => {
    if (points.length === 0) return '';
    return points.map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

const buildPointCircles = (points) => {
    return points.filter(point => point.hasTransactions === true).map(point => 
        `<circle cx="${point.x}" cy="${point.y}" r="2" fill="var(--accent-color)"/>`
    ).join('');
};

const getBalanceHistory = (time) => {
    const transactions = getTransactions();
    const end = getTodayISO();
    const today = new Date();
    let balance = 0;
    let start;
    let result = [];
    switch (time) {
        case "7d": 
            start = new Date(today);
            start.setDate(today.getDate() - 6); // 7 days including today
            break;
        case "30d":
            start = new Date(today);
            start.setDate(today.getDate() - 29); // 30 days including today
            break;
        case "1y":
            start = new Date(today);
            start.setFullYear(today.getFullYear() - 1); // 1 year including today
            break;
        default:
            if (transactions.length === 0) {
                start = today;
            } else {
                const oldestDate = transactions.reduce((oldest, t) => 
                    t.transactionDate < oldest ? t.transactionDate : oldest
                , transactions[0].transactionDate);
                start = parseDateISO(oldestDate);
                start.setDate(start.getDate() - 1); // start from the day before the oldest transaction
            }
            break;
    }
    let startISO = formatDateISO(start);
    balance = transactions.reduce((total, transaction) => transaction.transactionDate < startISO ? total + parseFloat(transaction.transactionAmount) : total, 0);
    do {
        const dailyTransactions = transactions.filter(t => t.transactionDate === startISO);
        const hasTransactions = dailyTransactions.length > 0;
        dailyTransactions.forEach(transaction => {
            balance += parseFloat(transaction.transactionAmount);
        });
        result.push({ date: startISO, balance: balance.toFixed(2), hasTransactions });
        start.setDate(start.getDate() + 1);
        startISO = formatDateISO(start);
    } while (startISO <= end);
    return result;
};

const getBalanceSummary = (balanceHistory, period) => {
    const current = parseFloat(balanceHistory[balanceHistory.length - 1].balance);
    const maxDay = balanceHistory.reduce((max, day) => {
        if (parseFloat(day.balance) > parseFloat(max.balance)) {
            max.balance = parseFloat(day.balance);
            max.day = day.date;
        }
        return max;
    }, { balance: '-Infinity', day: null });
    const minDay = balanceHistory.reduce((min, day) => {
        if (parseFloat(day.balance) < parseFloat(min.balance)) {
            min.balance = parseFloat(day.balance);
            min.day = day.date;
        }
        return min;
    }, { balance: 'Infinity', day: null });
    const change = period === "all" ? null : current - parseFloat(balanceHistory[0].balance);
    return { current, maxDay, minDay, change };
};

const buildBalanceSummary = (summary, period) => {
    const { current, maxDay, minDay, change } = summary;

    const changeHTML = period === "all" ? '' : `
        <div class="balance-summary-row balance-summary-change">
            <span class="balance-summary-label">Change</span>
            <span class="balance-summary-value ${change < 0 ? 'negative' : 'positive'}">${change.toFixed(2)}€</span>
        </div>
    `;

    return `
        <div class="balance-summary-row balance-summary-current">
            <span class="balance-summary-label">Current Balance</span>
            <span class="balance-summary-value ${current < 0 ? 'negative' : ''}">${current.toFixed(2)}€</span>
        </div>
        <div class="balance-summary-row balance-summary-max">
            <span class="balance-summary-label">Max Balance</span>
            <span class="balance-summary-value ${maxDay.balance < 0 ? 'negative' : ''}">
                ${maxDay.balance.toFixed(2)}€
                <span class="balance-summary-date">${formatDateDMY(maxDay.day)}</span>
            </span>
        </div>
        <div class="balance-summary-row balance-summary-min">
            <span class="balance-summary-label">Min Balance</span>
            <span class="balance-summary-value ${minDay.balance < 0 ? 'negative' : ''}">
                ${minDay.balance.toFixed(2)}€
                <span class="balance-summary-date">${formatDateDMY(minDay.day)}</span>
            </span>
        </div>
        ${changeHTML}
    `;
};