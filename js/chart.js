let chartSegmentsG, 
    chartLegend, 
    chartEmpty, 
    chartContent, 
    chartCenterValue,
    chartCenterLabel, 
    chartSVGWrap,
    CATEGORY_COLORS;

// grabs the chart elements and gives each spending category its own color
const initChart = () => {
    chartSegmentsG = document.getElementById('chart-segments');
    chartLegend = document.getElementById("chart-legend");
    chartEmpty = document.getElementById("chart-empty");
    chartContent = document.getElementById("chart-content");
    chartCenterValue = document.getElementById("chart-center-value");
    chartCenterLabel = document.getElementById("chart-center-label");
    chartSVGWrap = document.querySelector(".chart-svg-wrap");

    // category -> color. The % makes the palette start over if there are more categories than colors
    CATEGORY_COLORS = new Map(
        CATEGORIES_SPENDING.map((cat, index) => [cat, CHART_PALETTE[index % CHART_PALETTE.length]])
    );
};

const CHART_RADIUS = 80; // radius of the circle
const CHART_CIRCUMFERENCE = 2 * Math.PI * CHART_RADIUS;
const CHART_PALETTE = ['#3a8c63', '#5b9bd5', '#e0a72e', '#c1666b', '#7d5ba6', '#4fb0a5', '#d98c4a', '#8fa63a', '#5c6bc0', '#c94f7c']; // colors for the categories

// total spent per category, biggest first. Example: [{ label: "Food", value: 120, color: "#3a8c63" }, ...]
const getCategoryTotals = () => {
    const transactions = getTransactions();
    const spending = transactions.filter(transaction => transaction.transactionType === "spending"); // gets only the spending transactions
    const spendingMap = new Map();
 
    spending.forEach(transaction => {
        const amount = Math.abs(toActive(transaction.transactionAmount, transaction.transactionCurrency, transaction.transactionDate)); // in the active currency
        if (spendingMap.has(transaction.transactionCat)) {
            spendingMap.set(transaction.transactionCat, amount + spendingMap.get(transaction.transactionCat));
        } else {
            spendingMap.set(transaction.transactionCat, amount);
        }
    }); // if there is already that category in the map, sums the values of all the transactions of that category, if not creates a new entry in the map for that category and the value of the transaction
 
    const spendingArr = Array.from(spendingMap) // turns the map into a array
        .map(([key, value]) => ({label: tCat(key), value, color: CATEGORY_COLORS.get(key) || '#999999'})) // label is translated, color still uses the English key
        .sort((a,b) => b.value - a.value); // sorts the map by most value to least
    return spendingArr;
}

// total spent and total received, for the "Spending vs Receiving" view
const getTypeTotals = () => {
    const transactions = getTransactions();
    const spending = transactions.filter(transaction => transaction.transactionType === "spending").reduce((a,b) => a + toActive(b.transactionAmount, b.transactionCurrency, b.transactionDate), 0); // gets the total value spent
    const receiving = transactions.filter(transaction => transaction.transactionType === "receiving").reduce((a,b) => a + toActive(b.transactionAmount, b.transactionCurrency, b.transactionDate), 0); // gets the total value received
    const transactionsArr = [{label: t('common.spending'), value: Math.abs(spending), color: 'var(--negative-color)'}, {label: t('common.receiving'), value: Math.abs(receiving), color: 'var(--positive-color)'}]; // makes an array with both the spending totals and receiving totals
    return transactionsArr;
}

// picks the data that matches the toggle (by category or spending vs receiving)
const getChartData = () => {
    const type = document.querySelector('input[name="chart-mode"]:checked').value; // checks if the chart should show by category or spending vs receiving
    return type === 'category' ? getCategoryTotals() : getTypeTotals();
}

// draws the donut. Each segment is a circle where only part of the outline is visible
const renderSegments = (items) => {
    const total = items.reduce((sum, item) => sum + item.value, 0); // gets the total value from all items
    let cumulative = 0;
    const segmentsHTML = items.map((item, index) => {
        const fraction = item.value / total; // percentage of the total this category has spent
        const dash = fraction * CHART_CIRCUMFERENCE; // how long this segment's colored arc is, based on its share of the total
        const gap = CHART_CIRCUMFERENCE - dash; // the empty space left after the arc, so both add up to a full circle
        const offset = -cumulative * CHART_CIRCUMFERENCE; // where this segment starts, based on how much space earlier segments already used
        cumulative += fraction; // add this segment's share to the running total, so the next one starts in the right place

        return `
        <circle
            data-index="${index}"
            cx="100" cy="100" r="${CHART_RADIUS}"
            fill="none"
            stroke="${item.color}"
            stroke-width="28"
            stroke-dasharray="0 ${CHART_CIRCUMFERENCE}"
            data-dash="${dash}"
            data-gap="${gap}"
            stroke-dashoffset="${offset}"
            class="chart-segment"
        ></circle>
        `; 
    });

    chartSegmentsG.innerHTML = segmentsHTML.join(''); // joins all segments together

    const circles = chartSegmentsG.querySelectorAll(".chart-segment");

    // two frames are needed so the browser draws the "0" start first, and then animates to the real size
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            circles.forEach((circle) => {
                const dash = circle.dataset.dash;
                const gap = circle.dataset.gap;
                circle.setAttribute("stroke-dasharray", `${dash} ${gap}`); // creates the graph with a animation
            });
        });
    });
}

// builds the list next to the chart: color dot, name, amount and percentage
const renderLegend = (items) => {
    const total = items.reduce((sum, item) => sum + item.value, 0); // gets the total value
 
    const legend = items.map((item, index) => {
        const percent = Math.round((item.value / total) * 100); // gets the percentage that item has to the total value
 
        return `
            <li class="chart-legend-item" data-index="${index}">
                <div class="chart-legend-left">
                    <span class="chart-legend-dot" style="background-color: ${item.color}"></span>
                    <span class="chart-legend-name">${item.label}</span>
                </div>
                <span class="chart-legend-amount">${formatAmount(item.value)} (${percent}%)</span>
            </li>
        `;
    })
 
    chartLegend.innerHTML = legend.join('')
}

const attachChartInteractions = () => { // if the mouse enters a category, it will be highlighted and the others dimmed
    const segments = chartSegmentsG.querySelectorAll(".chart-segment")
    const legendItems = chartLegend.querySelectorAll(".chart-legend-item")

    // highlights the segment and the legend item with the same index
    const highlight = (index) => {
        segments.forEach(s => s.classList.toggle("dimmed", s.dataset.index !== String(index)))
        legendItems.forEach(l => l.classList.toggle("active", l.dataset.index === String(index)))
    }

    const clearHighlight = () => {
        segments.forEach(s => s.classList.remove("dimmed"))
        legendItems.forEach(l => l.classList.remove("active"))
    }

    // hovering a segment or its legend item does the same thing
    segments.forEach((s) => {
        s.addEventListener("mouseenter", () => highlight(s.dataset.index)); 
        s.addEventListener("mouseleave", clearHighlight);
    });

    legendItems.forEach((l) => {
        l.addEventListener("mouseenter", () => highlight(l.dataset.index));
        l.addEventListener("mouseleave", clearHighlight);
    });
}

// draws the whole chart, or the empty message if there is nothing to show
const renderChart = () => {
    const data = getChartData() // gets the data for the chart
    const total = data.reduce((sum, item) => sum + item.value, 0); // gets the total value
    
    if (!data || !data.length || total === 0) {
        chartEmpty.classList.remove("hidden"); // if there is nothing to show it will show a empty message
        chartContent.classList.add("hidden");
        return;
    } // if there is it will show the graph
    chartEmpty.classList.add("hidden");
    chartContent.classList.remove("hidden");
    renderSegments(data)
    renderLegend(data)
    attachChartInteractions()
    chartCenterLabel.textContent = t(document.querySelector('input[name="chart-mode"]:checked').value === 'category' ? 'chart.totalSpent' : 'chart.totalActivity');
    chartCenterValue.textContent = formatAmount(total) // total shown in the middle of the donut
}