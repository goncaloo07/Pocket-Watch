let chartSegmentsG, 
    chartLegend, 
    chartEmpty, 
    chartContent, 
    chartCenterValue,
    chartCenterLabel, 
    chartToolTip, 
    chartSVGWrap,
    CATEGORY_COLORS;

const initChart = () => {
    chartSegmentsG = document.getElementById('chart-segments');
    chartLegend = document.getElementById("chart-legend");
    chartEmpty = document.getElementById("chart-empty");
    chartContent = document.getElementById("chart-content");
    chartCenterValue = document.getElementById("chart-center-value");
    chartCenterLabel = document.getElementById("chart-center-label");
    chartToolTip = document.getElementById("chart-tooltip");
    chartSVGWrap = document.querySelector(".chart-svg-wrap");

    CATEGORY_COLORS = new Map(
        CATEGORIES_SPENDING.map((cat, index) => [cat, CHART_PALETTE[index % CHART_PALETTE.length]])
    );
};

const CHART_RADIUS = 80; // radius of the circle
const CHART_CIRCUMFERENCE = 2 * Math.PI * CHART_RADIUS;
const CHART_PALETTE = ['#3a8c63', '#5b9bd5', '#e0a72e', '#c1666b', '#7d5ba6', '#4fb0a5', '#d98c4a', '#8fa63a', '#5c6bc0', '#c94f7c']; // colors for the categories

const getCategoryTotals = () => {
    const transactions = getTransactions();
    const spending = transactions.filter(transaction => transaction.transactionType === "spending"); // gets only the spending transactions
    const spendingMap = new Map();

    spending.forEach(transaction => {
        if (spendingMap.has(transaction.transactionCat)) {
            spendingMap.set(transaction.transactionCat, Math.abs(parseFloat(transaction.transactionAmount)) + spendingMap.get(transaction.transactionCat));
        } else {
            spendingMap.set(transaction.transactionCat, Math.abs(parseFloat(transaction.transactionAmount)));
        }
    }) // if there is already that category in the map, sums the values of all the transactions of that category, if not creates a new entry in the map for that category and the value of the transaction

    const spendingArr = Array.from(spendingMap) // turns the map into a array
        .map(([key, value], index) => ({label: key, value, color: CATEGORY_COLORS.get(key) || '#999999'})) // turns the array back into a map but with a new value for each entry (the color)
        .sort((a,b) => b.value - a.value); // sorts the map by most value to least
    return spendingArr;
}

const getTypeTotals = () => {
    const transactions = getTransactions();
    const spending = transactions.filter(transaction => transaction.transactionType === "spending").reduce((a,b) => a + parseFloat(b.transactionAmount), 0); // gets the total value spent
    const receiving = transactions.filter(transaction => transaction.transactionType === "receiving").reduce((a,b) => a + parseFloat(b.transactionAmount), 0); // gets the total value received
    const transactionsArr = [{label: 'Spending', value: Math.abs(spending), color: 'var(--negative-color)'}, {label: 'Receiving', value: Math.abs(receiving), color: 'var(--positive-color)'}]; // makes an array with both the spending totals and receiving totals
    return transactionsArr;
}

const getChartData = () => {
    const type = document.querySelector('input[name="chart-mode"]:checked').value; // checks if the chart should show by category or spending vs receiving
    return type === 'category' ? getCategoryTotals() : getTypeTotals();
}

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
                <span class="chart-legend-amount">${item.value.toFixed(2)}€ (${percent}%)</span>
            </li>
        `;
    })

    chartLegend.innerHTML = legend.join('')
}

const attachChartInteractions = () => { // if the mouse enters a category, it will be highlighted and the others dimmed
    const segments = chartSegmentsG.querySelectorAll(".chart-segment")
    const legendItems = chartLegend.querySelectorAll(".chart-legend-item")

    const highlight = (index) => {
        segments.forEach(s => s.classList.toggle("dimmed", s.dataset.index !== String(index)))
        legendItems.forEach(l => l.classList.toggle("active", l.dataset.index === String(index)))
    }

    const clearHighlight = () => {
        segments.forEach(s => s.classList.remove("dimmed"))
        legendItems.forEach(l => l.classList.remove("active"))
    }

    segments.forEach((s) => {
        s.addEventListener("mouseenter", () => highlight(s.dataset.index)); 
        s.addEventListener("mouseleave", clearHighlight);
    });

    legendItems.forEach((l) => {
        l.addEventListener("mouseenter", () => highlight(l.dataset.index));
        l.addEventListener("mouseleave", clearHighlight);
    });
}

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
    chartCenterLabel.textContent = document.querySelector('input[name="chart-mode"]:checked').value === 'category' ? "Total Spent" : "Total Activity"
    chartCenterValue.textContent = `${total.toFixed(2)}€`
}