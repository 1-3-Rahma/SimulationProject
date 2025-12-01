let customerRows = 0;
let server1Rows = 0;
let server2Rows = 0;

// Check random method and show appropriate inputs
window.addEventListener('DOMContentLoaded', function() {
    const simulationOptionsStr = sessionStorage.getItem('simulationOptions');
    const randomMethod = sessionStorage.getItem('randomMethod');
    const sidebar = document.getElementById('randomInputSidebar');
    const lcgInputs = document.getElementById('lcgInputs');
    const midSquareInputs = document.getElementById('midSquareInputs');

    if (randomMethod === 'LCG') {
        sidebar.classList.remove('hidden');
        lcgInputs.classList.remove('hidden');
    } else if (randomMethod === 'Mid-Square') {
        sidebar.classList.remove('hidden');
        midSquareInputs.classList.remove('hidden');
    }
    // If method is 'Manual', sidebar stays hidden
});

function createTables() {
    customerRows = parseInt(document.getElementById('customerRows').value);
    server1Rows = parseInt(document.getElementById('server1Rows').value);
    server2Rows = parseInt(document.getElementById('server2Rows').value);

    if (isNaN(customerRows) || customerRows <= 0 || 
        isNaN(server1Rows) || server1Rows <= 0 || 
        isNaN(server2Rows) || server2Rows <= 0) {
        alert('Please enter valid numbers for all tables!');
        return;
    }

    // Create Customer Table
    createTable('customerTableBody', customerRows, 'customer', 'time');
    document.getElementById('customerTableContainer').classList.remove('hidden');

    // Create Server 1 Table
    createTable('server1TableBody', server1Rows, 'server1', 'service');
    document.getElementById('server1TableContainer').classList.remove('hidden');

    // Create Server 2 Table
    createTable('server2TableBody', server2Rows, 'server2', 'service');
    document.getElementById('server2TableContainer').classList.remove('hidden');
}

function createTable(tbodyId, rows, prefix, type) {
    const tbody = document.getElementById(tbodyId);
    tbody.innerHTML = '';

    for (let i = 0; i < rows; i++) {
        const row = document.createElement('tr');
        
        // Time/Service Time input
        const timeCell = document.createElement('td');
        const timeInput = document.createElement('input');
        timeInput.type = 'number';
        timeInput.step = 'any';
        timeInput.min = '0';
        timeInput.className = 'table-input';
        timeInput.id = `${prefix}_time_${i}`;
        timeInput.placeholder = '0';
        timeCell.appendChild(timeInput);

        // Probability input
        const probCell = document.createElement('td');
        const probInput = document.createElement('input');
        probInput.type = 'number';
        probInput.step = 'any';
        probInput.min = '0';
        probInput.max = '1';
        probInput.className = 'table-input';
        probInput.id = `${prefix}_prob_${i}`;
        probInput.placeholder = '0.00';
        probCell.appendChild(probInput);

        // Cumulative Probability (calculated)
        const cumProbCell = document.createElement('td');
        cumProbCell.className = 'calculated-cell';
        cumProbCell.id = `${prefix}_cumprob_${i}`;
        cumProbCell.textContent = '-';

        // Random-Digits Assignment (calculated)
        const randCell = document.createElement('td');
        randCell.className = 'calculated-cell';
        randCell.id = `${prefix}_rand_${i}`;
        randCell.textContent = '-';

        row.appendChild(timeCell);
        row.appendChild(probCell);
        row.appendChild(cumProbCell);
        row.appendChild(randCell);
        tbody.appendChild(row);
    }
}

function calculateCustomerTable() {
    calculateTable('customer', customerRows);
}

function calculateServer1Table() {
    calculateTable('server1', server1Rows);
}

function calculateServer2Table() {
    calculateTable('server2', server2Rows);
}

function calculateTable(prefix, rows) {
    const probabilities = [];
    const times = [];

    // Collect data
    for (let i = 0; i < rows; i++) {
        const time = parseFloat(document.getElementById(`${prefix}_time_${i}`).value);
        const prob = parseFloat(document.getElementById(`${prefix}_prob_${i}`).value);

        if (isNaN(time) || time < 0) {
            alert(`Please enter valid time for row ${i + 1} in ${prefix} table!`);
            return;
        }

        if (isNaN(prob) || prob < 0 || prob > 1) {
            alert(`Please enter valid probability (0-1) for row ${i + 1} in ${prefix} table!`);
            return;
        }

        times.push(time);
        probabilities.push(prob);
    }

    // Check if probabilities sum to 1
    const sum = probabilities.reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1.0) > 0.01) {
        if (!confirm(`Probabilities sum to ${sum.toFixed(4)}, not 1.0. Continue anyway?`)) {
            return;
        }
    }

    // Calculate cumulative probabilities
    let cumulative = 0;
    const cumulativeProbs = [];
    for (let i = 0; i < probabilities.length; i++) {
        cumulative += probabilities[i];
        cumulativeProbs.push(cumulative);
    }

    // Calculate random digit assignments
    const randomDigits = calculateRandomDigits(cumulativeProbs);

    // Update table
    for (let i = 0; i < rows; i++) {
        document.getElementById(`${prefix}_cumprob_${i}`).textContent = cumulativeProbs[i].toFixed(4);
        document.getElementById(`${prefix}_rand_${i}`).textContent = randomDigits[i];
    }
}

function calculateRandomDigits(cumulativeProbs) {
    const ranges = [];
    let prevCum = 0;

    for (let i = 0; i < cumulativeProbs.length; i++) {
        const cum = cumulativeProbs[i];
        
        // Calculate start: previous cumulative * 100, rounded, then +1 (except first)
        let start;
        if (i === 0) {
            start = 1; // First range starts at 01
        } else {
            start = Math.round(prevCum * 100) + 1;
        }
        
        // Calculate end: current cumulative * 100, rounded
        let end = Math.round(cum * 100);

        // Handle the last range (should end at 00 which represents 100)
        if (i === cumulativeProbs.length - 1) {
            if (end === 100) {
                ranges.push(formatRange(start, 0, true)); // 00 represents 100
            } else {
                ranges.push(formatRange(start, end));
            }
        } else {
            ranges.push(formatRange(start, end));
        }

        prevCum = cum;
    }

    return ranges;
}

function formatRange(start, end, isLastZero = false) {
    if (isLastZero && end === 0) {
        // Special case: 84-00 means 84-100
        return `${String(start).padStart(2, '0')}-00`;
    }
    
    if (start === end) {
        return String(start).padStart(2, '0');
    }
    
    return `${String(start).padStart(2, '0')}-${String(end).padStart(2, '0')}`;
}

function startSimulation() {
    // Validate limit is entered
    const limit = parseInt(document.getElementById('simulationLimit').value);
    
    if (isNaN(limit) || limit <= 0) {
        alert('Please enter a valid limit number greater than 0!');
        return;
    }

    // Validate all tables are calculated
    // Check if cumulative probabilities are calculated for all tables
    const customerCumProb = document.getElementById('customer_cumprob_0');
    const server1CumProb = document.getElementById('server1_cumprob_0');
    const server2CumProb = document.getElementById('server2_cumprob_0');

    if (!customerCumProb || customerCumProb.textContent === '-' ||
        !server1CumProb || server1CumProb.textContent === '-' ||
        !server2CumProb || server2CumProb.textContent === '-') {
        alert('Please calculate all tables before starting the simulation!');
        return;
    }

    // Store limit in sessionStorage for use in simulation
    sessionStorage.setItem('simulationLimit', limit);

    // Store random number parameters if LCG or Mid-Square
    const randomMethod = sessionStorage.getItem('randomMethod');
    if (randomMethod === 'LCG') {
        const a = parseFloat(document.getElementById('lcg_a').value);
        const c = parseFloat(document.getElementById('lcg_c').value);
        const m = parseFloat(document.getElementById('lcg_m').value);
        const initial = parseFloat(document.getElementById('lcg_initial').value);

        if (isNaN(a) || isNaN(c) || isNaN(m) || isNaN(initial)) {
            alert('Please enter all LCG parameters!');
            return;
        }

        sessionStorage.setItem('lcgParams', JSON.stringify({ a, c, m, initial }));
    } else if (randomMethod === 'Mid-Square') {
        const seed = parseInt(document.getElementById('midsquare_seed').value);

        if (isNaN(seed) || seed < 1000 || seed > 9999) {
            alert('Please enter a valid 4-digit seed (1000-9999)!');
            return;
        }

        sessionStorage.setItem('midsquareSeed', seed);
    }

    // Save table data to sessionStorage
    saveTableData();
    
    // Navigate to simulation page
    window.location.href = 'SimulationPage.html';
}

function saveTableData() {
    const customerTable = [];
    const server1Table = [];
    const server2Table = [];
    
    // Extract customer table data
    for (let i = 0; i < customerRows; i++) {
        const time = parseFloat(document.getElementById(`customer_time_${i}`).value);
        const cumProb = parseFloat(document.getElementById(`customer_cumprob_${i}`).textContent);
        const randDigits = document.getElementById(`customer_rand_${i}`).textContent;
        customerTable.push({ time, cumulativeProb: cumProb, randomDigits: randDigits });
    }
    
    // Extract server 1 table data
    for (let i = 0; i < server1Rows; i++) {
        const time = parseFloat(document.getElementById(`server1_time_${i}`).value);
        const cumProb = parseFloat(document.getElementById(`server1_cumprob_${i}`).textContent);
        const randDigits = document.getElementById(`server1_rand_${i}`).textContent;
        server1Table.push({ time, cumulativeProb: cumProb, randomDigits: randDigits });
    }
    
    // Extract server 2 table data
    for (let i = 0; i < server2Rows; i++) {
        const time = parseFloat(document.getElementById(`server2_time_${i}`).value);
        const cumProb = parseFloat(document.getElementById(`server2_cumprob_${i}`).textContent);
        const randDigits = document.getElementById(`server2_rand_${i}`).textContent;
        server2Table.push({ time, cumulativeProb: cumProb, randomDigits: randDigits });
    }
    
    sessionStorage.setItem('customerTable', JSON.stringify(customerTable));
    sessionStorage.setItem('server1Table', JSON.stringify(server1Table));
    sessionStorage.setItem('server2Table', JSON.stringify(server2Table));
}

