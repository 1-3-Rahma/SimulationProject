// ========== Utilities ==========

function parseDistributionText(text) {
    const lines = text.split('\n').map(ln => ln.trim()).filter(ln => ln.length > 0);
    if (lines.length === 0) throw new Error("Distribution cannot be empty.");
    
    const dist = [];
    for (const ln of lines) {
        const parts = ln.split(',').map(p => p.trim());
        if (parts.length !== 2) throw new Error(`Each line must be 'time,prob' -> '${ln}'`);
        
        let t = parseFloat(parts[0]);
        if (isNaN(t)) throw new Error(`Invalid time value: '${parts[0]}' in line '${ln}'`);
        
        let p = parseFloat(parts[1]);
        if (isNaN(p)) throw new Error(`Invalid probability value: '${parts[1]}' in line '${ln}'`);
        if (p < 0 || p > 1) throw new Error(`Probability must be between 0 and 1 in line '${ln}'`);
        
        dist.push([t, p]);
    }
    
    const total = dist.reduce((sum, [_, p]) => sum + p, 0);
    if (Math.abs(total - 1.0) > 1e-6) {
        throw new Error(`Probabilities must sum to 1.0 (current sum = ${total.toFixed(6)})`);
    }
    
    return dist;
}

// Initialize row numbers on page load
window.addEventListener('DOMContentLoaded', () => {
    ['tbodyArrival', 'tbodyService', 'tbodyRnArr', 'tbodyRnServ'].forEach(id => {
        try { updateRowNumbers(id); } catch (e) { /* ignore */ }
    });
});

// Helper function to determine scale from probability decimal places
function determineScaleFromProbabilities(dist) {
    let maxDecimalPlaces = 0;
    
    for (const [_, prob] of dist) {
        // Convert probability to string to count decimal places
        const probStr = prob.toString();
        if (probStr.includes('.')) {
            const decimalPart = probStr.split('.')[1];
            if (decimalPart) {
                maxDecimalPlaces = Math.max(maxDecimalPlaces, decimalPart.length);
            }
        }
    }
    
    // Determine scale: 2 decimal places = 100, 3 = 1000, 4 = 10000, etc.
    // If no decimals or 1 decimal, use 100. If 2 decimals, use 1000, etc.
    if (maxDecimalPlaces <= 2) {
        return 100;  // 0.1, 0.12 → 100 scale
    } else {
        return Math.pow(10, maxDecimalPlaces);  // 0.125 → 1000, 0.1250 → 10000
    }
}

function buildCumulativeIntervals(dist, scale = 100) {
    const table = [];
    let cum = 0.0;
    let prevUpper = -1;
    const n = dist.length;

    for (let i = 0; i < n; i++) {
        const [time, prob] = dist[i];
        cum += prob;
        let upper = Math.round(cum * scale);
        if (upper <= prevUpper) upper = prevUpper + 1;
        if (i === n - 1) upper = scale;

        const low = prevUpper + 1;
        const low0 = low;
        const high0 = upper;
        table.push({
            time: time,
            prob: prob,
            cum: parseFloat(cum.toFixed(5)),
            low: low0,
            high: high0
        });
        prevUpper = upper;
    }

    return table;
}

// Ensure cumulative probability sums to exactly 1 (within small tolerance)
function validateTotalProbability(dist, label, silent = false) {
    const total = dist.reduce((sum, [_, p]) => sum + p, 0);
    if (Math.abs(total - 1) > 1e-6) {
        if (!silent) {
            alert(`${label} probabilities must sum to 1. Current total = ${total.toFixed(4)}. Please adjust the probabilities.`);
        }
        return { ok: false, total };
    }
    return { ok: true, total };
}

function mapRandomToTime(rn, table) {
    // Map using the table's interval bounds (inclusive), allow up to table's high
    let digit = parseFloat(rn);
    if (isNaN(digit)) throw new Error("Invalid random number.");
    const maxScale = table.length > 0 ? table[table.length - 1].high : 99;
    if (digit < 0 || digit > maxScale) throw new Error(`Random numbers must be in the range 0..${maxScale}.`);
    for (const row of table) {
        if (digit >= row.low && digit <= row.high) return row.time;
    }
    return table[table.length - 1].time;
}

// ========== Global State ==========

let arrivalTable = null;
let serviceTable = null;
let currentTab = 0;

// Key for saving/restoring page state across refresh
const STATE_KEY = 'singleLimitedCustomerState_v1';

// Keep track of the last simulation inputs so we can show
// random-number → time mapping tables in Step 5
let lastNumCustomers = 0;
let lastArrivalRns = [];
let lastServiceRns = [];
let lastInterarrivalTimes = [];
let lastServiceTimes = [];

// ========== Tab Management ==========

function switchTab(tabIdx) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`tab${tabIdx}`).classList.add('active');
    document.querySelectorAll('.tab-btn')[tabIdx].classList.add('active');
    currentTab = tabIdx;
    
    // Scroll to top of the page when switching tabs, especially for step 5
    setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
}

function nextTab(tabIdx) {
    // Prevent moving forward when cumulative probability exceeds 1
    if (tabIdx > currentTab) {
        if (currentTab === 1) { // leaving interarrival step
            const dist = readDistributionFromTable('tbodyArrival');
            const { ok } = validateTotalProbability(dist, 'Interarrival');
            if (!ok) return;
        } else if (currentTab === 2) { // leaving service step
            const dist = readDistributionFromTable('tbodyService');
            const { ok } = validateTotalProbability(dist, 'Service');
            if (!ok) return;
        } else if (currentTab === 3) { // leaving random-numbers step
            // Ensure random numbers counts meet requirements before moving to Step 5
            const numCustomers = parseInt(document.getElementById('numCustomers').value);
            if (isNaN(numCustomers) || numCustomers <= 0) {
                alert('Please enter a valid number of customers before proceeding.');
                return;
            }
            const arrRns = readRandomNumbersFromTable('arrival');
            const servRns = readRandomNumbersFromTable('service');
            const requiredArrCount = Math.max(0, numCustomers - 1);
            if (arrRns.length < requiredArrCount) {
                alert(`Need at least ${requiredArrCount} arrival random numbers (for customers 2..${numCustomers}). Currently have ${arrRns.length}.`);
                return;
            }
            if (servRns.length < numCustomers) {
                alert(`Need at least ${numCustomers} service random numbers (one per customer). Currently have ${servRns.length}.`);
                return;
            }
        }
    }
    switchTab(tabIdx);
}

function prevTab(tabIdx) {
    switchTab(tabIdx);
}

// ========== Table Building ==========

function readDistributionFromTable(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    const rows = tbody.querySelectorAll('tr');
    const dist = [];
    
    for (const row of rows) {
        // Account for row-num + action cells in first columns, so inputs are in 3rd and 4th columns
        const timeInput = row.querySelector('td:nth-child(3) input');
        const probInput = row.querySelector('td:nth-child(4) input');
        
        if (!timeInput || !probInput) continue;
        
        const time = parseFloat(timeInput.value);
        const prob = parseFloat(probInput.value);
        
        // Skip empty or invalid rows (allow 0 values but skip NaN)
        if (isNaN(time) || isNaN(prob)) continue;
        if (prob < 0 || prob > 1) continue;
        
        // Only add if at least one value is non-zero (to allow partial input)
        if (time !== 0 || prob !== 0) {
            dist.push([time, prob]);
        }
    }
    
    return dist;
}

function calculateArrivalTable() {
    try {
        const dist = readDistributionFromTable('tbodyArrival');
        if (dist.length === 0) {
            // Don't show alert if table is empty or just has default/empty rows
            const tbody = document.getElementById('tbodyArrival');
            const rows = tbody.querySelectorAll('tr');
            const hasAnyInput = Array.from(rows).some(row => {
                const timeInput = row.querySelector('td:nth-child(3) input');
                const probInput = row.querySelector('td:nth-child(4) input');
                if (!timeInput || !probInput) return false;
                const time = parseFloat(timeInput.value);
                const prob = parseFloat(probInput.value);
                return !isNaN(time) && !isNaN(prob) && (time !== 0 || prob !== 0);
            });
            
            if (!hasAnyInput) {
                // Silently return if no valid input yet (user is still typing)
                return;
            }

            // Only show alert if there are rows but none are valid
            const hasRows = rows.length > 0;
            if (hasRows) {
                alert('Please enter at least one row with valid Time and Probability values.');
            }
                return;
            }

        // Automatically determine scale from probability decimal places
        const scale = determineScaleFromProbabilities(dist);
        const numDigits = Math.max(2, Math.ceil(Math.log10(scale)));
        
        const table = buildCumulativeIntervals(dist, scale);
        arrivalTable = table;
        
        const tbody = document.getElementById('tbodyArrival');
        const rows = tbody.querySelectorAll('tr');
        
        rows.forEach((row, idx) => {
            if (idx < table.length) {
                const cumCell = row.querySelector('td:nth-child(5)');
                const intervalCell = row.querySelector('td:nth-child(6)');
                // Format interval with appropriate number of digits (0-based)
                const interval = `${String(table[idx].low).padStart(numDigits, '0')}-${String(table[idx].high).padStart(numDigits, '0')}`;
                
                if (cumCell) cumCell.textContent = table[idx].cum.toFixed(5);
                if (intervalCell) intervalCell.textContent = interval;
            }
        });
    } catch (err) {
        alert(`Calculation error: ${err.message}`);
    }
}

// Update row numbers for a given tbody
function updateRowNumbers(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    const rows = tbody.querySelectorAll('tr');
    rows.forEach((row, idx) => {
        let numCell = row.querySelector('.row-num');
        if (!numCell) {
            numCell = document.createElement('td');
            numCell.className = 'row-num';
            row.insertBefore(numCell, row.firstElementChild);
        }
        numCell.textContent = (idx + 1).toString();
    });
}

function addArrivalRow() {
    const tbody = document.getElementById('tbodyArrival');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="row-num"></td>
        <td class="action-cell"><button class="btn-delete-row" onclick="deleteArrivalRow(this)" title="Delete row">🗑️</button></td>
        <td><input type="number" class="table-input" step="0.1" value="" placeholder="Time" onchange="calculateArrivalTable()" onblur="if(this.value !== '') calculateArrivalTable()"></td>
        <td><input type="number" class="table-input" step="0.01" value="" placeholder="Prob" onchange="calculateArrivalTable()" onblur="if(this.value !== '') calculateArrivalTable()"></td>
        <td class="calculated-cell"></td>
        <td class="calculated-cell"></td>
    `;
    tbody.appendChild(tr);
    // Focus on the first input of the new row
    tr.querySelector('td:nth-child(3) input').focus();
    updateRowNumbers('tbodyArrival');
}

function deleteArrivalRow(btn) {
    const tbody = document.getElementById('tbodyArrival');
    if (tbody.querySelectorAll('tr').length <= 1) {
        alert('At least one row is required.');
        return;
    }
    btn.closest('tr').remove();
    calculateArrivalTable();
    updateRowNumbers('tbodyArrival');
}

function generateArrivalRows() {
    const input = document.getElementById('arrivalRowCount');
    if (!input) return;
    
    const count = parseInt(input.value) || 3;
    if (count < 1 || count > 50) {
        alert('Please enter a number between 1 and 50.');
        return;
    }
    
    const tbody = document.getElementById('tbodyArrival');
    if (!tbody) return;
    
    for (let i = 0; i < count; i++) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="row-num"></td>
            <td class="action-cell"><button class="btn-delete-row" onclick="deleteArrivalRow(this)" title="Delete row">🗑️</button></td>
            <td><input type="number" class="table-input" step="0.1" min="0" value="" placeholder="Time" onchange="calculateArrivalTable()" onblur="if(this.value !== '') calculateArrivalTable()"></td>
            <td><input type="number" class="table-input" step="0.01" min="0" max="1" value="" placeholder="Prob" onchange="calculateArrivalTable()" onblur="if(this.value !== '') calculateArrivalTable()"></td>
            <td class="calculated-cell"></td>
            <td class="calculated-cell"></td>
        `;
        tbody.appendChild(tr);
    }
    
    // Focus on first input of the last added row
    const lastRow = tbody.lastElementChild;
    if (lastRow) {
        lastRow.querySelector('td:nth-child(3) input').focus();
    }
    
    calculateArrivalTable();
    updateRowNumbers('tbodyArrival');
}

function calculateServiceTable() {
    try {
        const dist = readDistributionFromTable('tbodyService');
        
        if (dist.length === 0) {
            // Don't show alert if table is empty or just has default/empty rows
            const tbody = document.getElementById('tbodyService');
            const rows = tbody.querySelectorAll('tr');
            const hasAnyInput = Array.from(rows).some(row => {
                const timeInput = row.querySelector('td:nth-child(3) input');
                const probInput = row.querySelector('td:nth-child(4) input');
                if (!timeInput || !probInput) return false;
                const time = parseFloat(timeInput.value);
                const prob = parseFloat(probInput.value);
                return !isNaN(time) && !isNaN(prob) && (time !== 0 || prob !== 0);
            });
            
            if (!hasAnyInput) {
                // Silently return if no valid input yet (user is still typing)
                return;
            }
            
            // Only show alert if there are rows but none are valid
            const hasRows = rows.length > 0;
            if (hasRows) {
                alert('Please enter at least one row with valid Time and Probability values.');
        }
        return;
    }

        // Automatically determine scale from probability decimal places
        const scale = determineScaleFromProbabilities(dist);
        const numDigits = Math.max(2, Math.ceil(Math.log10(scale)));
        
        const table = buildCumulativeIntervals(dist, scale);
        serviceTable = table;
        
        const tbody = document.getElementById('tbodyService');
        const rows = tbody.querySelectorAll('tr');
        
        rows.forEach((row, idx) => {
            if (idx < table.length) {
                const cumCell = row.querySelector('td:nth-child(5)');
                const intervalCell = row.querySelector('td:nth-child(6)');
                // Format interval with appropriate number of digits (0-based)
                const interval = `${String(table[idx].low).padStart(numDigits, '0')}-${String(table[idx].high).padStart(numDigits, '0')}`;
                
                if (cumCell) cumCell.textContent = table[idx].cum.toFixed(5);
                if (intervalCell) intervalCell.textContent = interval;
            }
        });
    } catch (err) {
        alert(`Calculation error: ${err.message}`);
    }
}

function addServiceRow() {
    const tbody = document.getElementById('tbodyService');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="row-num"></td>
        <td class="action-cell"><button class="btn-delete-row" onclick="deleteServiceRow(this)" title="Delete row">🗑️</button></td>
        <td><input type="number" class="table-input" step="0.1" min="0" value="" placeholder="Time" onchange="calculateServiceTable()" onblur="if(this.value !== '') calculateServiceTable()"></td>
        <td><input type="number" class="table-input" step="0.01" min="0" max="1" value="" placeholder="Prob" onchange="calculateServiceTable()" onblur="if(this.value !== '') calculateServiceTable()"></td>
        <td class="calculated-cell"></td>
        <td class="calculated-cell"></td>
    `;
    tbody.appendChild(tr);
    // Focus on the first input of the new row
    tr.querySelector('td:nth-child(3) input').focus();
    updateRowNumbers('tbodyService');
}

function deleteServiceRow(btn) {
    const tbody = document.getElementById('tbodyService');
    if (tbody.querySelectorAll('tr').length <= 1) {
        alert('At least one row is required.');
        return;
    }
    btn.closest('tr').remove();
    calculateServiceTable();
    updateRowNumbers('tbodyService');
}

function generateServiceRows() {
    const input = document.getElementById('serviceRowCount');
    if (!input) return;
    
    const count = parseInt(input.value) || 3;
    if (count < 1 || count > 50) {
        alert('Please enter a number between 1 and 50.');
        return;
    }
    
    const tbody = document.getElementById('tbodyService');
    if (!tbody) return;
    
    for (let i = 0; i < count; i++) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="row-num"></td>
            <td class="action-cell"><button class="btn-delete-row" onclick="deleteServiceRow(this)" title="Delete row">🗑️</button></td>
            <td><input type="number" class="table-input" step="0.1" min="0" value="" placeholder="Time" onchange="calculateServiceTable()" onblur="if(this.value !== '') calculateServiceTable()"></td>
            <td><input type="number" class="table-input" step="0.01" min="0" max="1" value="" placeholder="Prob" onchange="calculateServiceTable()" onblur="if(this.value !== '') calculateServiceTable()"></td>
            <td class="calculated-cell"></td>
            <td class="calculated-cell"></td>
        `;
        tbody.appendChild(tr);
    }
    
    // Focus on first input of the last added row
    const lastRow = tbody.lastElementChild;
    if (lastRow) {
        lastRow.querySelector('td:nth-child(3) input').focus();
    }
    
    calculateServiceTable();
    updateRowNumbers('tbodyService');
}

// ========== Random Number Management ==========

function readRandomNumbersFromTable(type) {
    const tbodyId = type === 'arrival' ? 'tbodyRnArr' : 'tbodyRnServ';
    const tbody = document.getElementById(tbodyId);
    const rows = tbody.querySelectorAll('tr');
    const numbers = [];
    
    for (const row of rows) {
        const input = row.querySelector('td:nth-child(3) input');
        if (!input) continue;
        
        const value = parseInt(input.value);
        if (!isNaN(value) && value >= 1 && value <= 100) {
            numbers.push(value);
        }
    }
    
    return numbers;
}

function addRandomNumberRow(type) {
    const tbodyId = type === 'arrival' ? 'tbodyRnArr' : 'tbodyRnServ';
    const tbody = document.getElementById(tbodyId);
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="row-num"></td>
        <td class="action-cell"><button class="btn-delete-row" onclick="deleteRandomNumberRow(this, '${type}')" title="Delete row">🗑️</button></td>
        <td><input type="number" class="table-input" min="1" max="100" value="" placeholder="1-100" onchange="updateRandomNumberCounts()"></td>
    `;
    tbody.appendChild(tr);
    tr.querySelector('td:nth-child(3) input').focus();
    updateRandomNumberCounts();
    updateRowNumbers(tbodyId);
}

function deleteRandomNumberRow(btn, type) {
    const tbodyId = type === 'arrival' ? 'tbodyRnArr' : 'tbodyRnServ';
    const tbody = document.getElementById(tbodyId);
    if (tbody.querySelectorAll('tr').length <= 1) {
        alert('At least one row is required.');
        return;
    }
    btn.closest('tr').remove();
    updateRandomNumberCounts();
    updateRowNumbers(tbodyId);
}

function generateRandomNumberRows(type) {
    const inputId = type === 'arrival' ? 'randomArrivalRowCount' : 'randomServiceRowCount';
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const count = parseInt(input.value) || 5;
    if (count < 1 || count > 100) {
        alert('Please enter a number between 1 and 100.');
        return;
    }

    const tbodyId = type === 'arrival' ? 'tbodyRnArr' : 'tbodyRnServ';
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    
    for (let i = 0; i < count; i++) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="row-num"></td>
            <td class="action-cell"><button class="btn-delete-row" onclick="deleteRandomNumberRow(this, '${type}')" title="Delete row">🗑️</button></td>
            <td><input type="number" class="table-input" min="1" max="100" value="" placeholder="1-100" onchange="updateRandomNumberCounts()"></td>
        `;
        tbody.appendChild(tr);
    }
    
    // Focus on first input of the last added row
    const lastRow = tbody.lastElementChild;
    if (lastRow) {
        lastRow.querySelector('td:nth-child(3) input').focus();
    }
    
    updateRandomNumberCounts();
    updateRowNumbers(tbodyId);
}

function updateRandomNumberCounts() {
    const arrNumbers = readRandomNumbersFromTable('arrival');
    const servNumbers = readRandomNumbersFromTable('service');
    
    const arrivalCountEl = document.getElementById('arrivalCount');
    const serviceCountEl = document.getElementById('serviceCount');
    
    if (arrivalCountEl) arrivalCountEl.textContent = `Count: ${arrNumbers.length} numbers`;
    if (serviceCountEl) serviceCountEl.textContent = `Count: ${servNumbers.length} numbers`;
    
    // Update hidden textareas for backward compatibility
    const txtRnArr = document.getElementById('txtRnArr');
    const txtRnServ = document.getElementById('txtRnServ');
    if (txtRnArr) txtRnArr.value = arrNumbers.join(', ');
    if (txtRnServ) txtRnServ.value = servNumbers.join(', ');
}

// ========== Simulation Execution ==========

function runSimulationFromUI() {
    try {
        const numCustomers = parseInt(document.getElementById('numCustomers').value);
        if (numCustomers <= 0 || isNaN(numCustomers)) {
            alert('Please enter a valid number of customers.');
            switchTab(0);
            return;
        }
        
        // Ensure tables are calculated from inputs
        if (!arrivalTable) {
            calculateArrivalTable();
            if (!arrivalTable) {
                alert('Please fill in the arrival table in Step 2 first.');
                switchTab(1);
                return;
            }
        }
        // Validate arrival sum exactly 1 before proceeding
        const arrivalDistCheck = readDistributionFromTable('tbodyArrival');
        const { ok: arrOk } = validateTotalProbability(arrivalDistCheck, 'Interarrival');
        if (!arrOk) {
            switchTab(1);
            return;
        }
        
        if (!serviceTable) {
            calculateServiceTable();
            if (!serviceTable) {
                alert('Please fill in the service table in Step 3 first.');
                switchTab(2);
                return;
            }
        }
        // Validate service sum exactly 1 before proceeding
        const serviceDistCheck = readDistributionFromTable('tbodyService');
        const { ok: servOk } = validateTotalProbability(serviceDistCheck, 'Service');
        if (!servOk) {
            switchTab(2);
            return;
        }
        
        // Read random numbers from table cells
        const arrRns = readRandomNumbersFromTable('arrival');
        const servRns = readRandomNumbersFromTable('service');
        
        // Validate random numbers count
        const requiredArrCount = Math.max(0, numCustomers - 1);
        if (arrRns.length < requiredArrCount) {
            alert(`Need at least ${requiredArrCount} arrival random numbers (for customers 2..${numCustomers}). Currently have ${arrRns.length}.`);
            switchTab(3);
            return;
        }
        
        if (servRns.length < numCustomers) {
            alert(`Need at least ${numCustomers} service random numbers (one per customer). Currently have ${servRns.length}.`);
            switchTab(3);
        return;
    }

        // Map random numbers to times
        const interarrivalTimes = [0]; // First customer has 0
        for (let i = 0; i < requiredArrCount; i++) {
            const time = mapRandomToTime(arrRns[i], arrivalTable);
            interarrivalTimes.push(time);
        }
        
        const serviceTimes = [];
        for (let i = 0; i < numCustomers; i++) {
            const time = mapRandomToTime(servRns[i], serviceTable);
            serviceTimes.push(time);
        }

        // Store last-used random numbers and mapped times for Step 5 display
        lastNumCustomers = numCustomers;
        lastArrivalRns = arrRns.slice(0, requiredArrCount);
        lastServiceRns = servRns.slice(0, numCustomers);
        lastInterarrivalTimes = interarrivalTimes.slice();
        lastServiceTimes = serviceTimes.slice();
        
        // Run the simulation
        runSimulationWithTimes(numCustomers, interarrivalTimes, serviceTimes);
        switchTab(4);
    } catch (err) {
        alert(`Simulation error: ${err.message}`);
    }
}

function runSimulationWithTimes(n, interarrivalTimes, serviceTimes) {
    const tbody = document.querySelector('#tableResults tbody');
    const resultsDiv = document.getElementById('queueResults');

    if (!tbody) {
        console.error('Results table tbody not found');
        return;
    }

    tbody.innerHTML = '';

    // Simulation arrays
    const arrivalTimes = new Array(n).fill(0);
    const serviceBegin = new Array(n).fill(0);
    const serviceEnd = new Array(n).fill(0);
    const waitingTimes = new Array(n).fill(0);
    const timeInSystem = new Array(n).fill(0);
    const idleTimes = new Array(n).fill(0);

    // First customer
    arrivalTimes[0] = 0;
    serviceBegin[0] = 0;
    serviceEnd[0] = serviceBegin[0] + serviceTimes[0];
    waitingTimes[0] = 0;
    timeInSystem[0] = serviceTimes[0];
    idleTimes[0] = 0;

    for (let i = 1; i < n; i++) {
        arrivalTimes[i] = arrivalTimes[i - 1] + interarrivalTimes[i];

        if (arrivalTimes[i] >= serviceEnd[i - 1]) {
            // server is idle
            idleTimes[i] = arrivalTimes[i] - serviceEnd[i - 1];
            serviceBegin[i] = arrivalTimes[i];
            waitingTimes[i] = 0;
        } else {
            // customer waits
            idleTimes[i] = 0;
            serviceBegin[i] = serviceEnd[i - 1];
            waitingTimes[i] = serviceBegin[i] - arrivalTimes[i];
        }

        serviceEnd[i] = serviceBegin[i] + serviceTimes[i];
        timeInSystem[i] = serviceEnd[i] - arrivalTimes[i];
    }

    // Get the random numbers from the input tables
    const arrivalRns = readRandomNumbersFromTable('arrival');
    const serviceRns = readRandomNumbersFromTable('service');
    
    // Save for potential use in displayDistributionTables
    lastArrivalRns = [...arrivalRns];
    lastServiceRns = [...serviceRns];
    
    // Fill table
    let totalInterarrival = 0;
    let totalService = 0;
    let totalWaiting = 0;
    let totalTimeInSystem = 0;
    let totalIdle = 0;
    let numWaited = 0;

    for (let i = 0; i < n; i++) {
        const tr = document.createElement('tr');
        if (i % 2 === 0) {
            tr.style.background = 'rgba(245, 230, 211, 0.4)';
        }
        
        // Get the random numbers for this row
        const arrivalRn = i > 0 ? (arrivalRns[i-1] !== undefined ? arrivalRns[i-1] : '—') : '—';
        const serviceRn = serviceRns[i] !== undefined ? serviceRns[i] : '—';
        
        // Add cells for each column
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${arrivalRn}</td>
            <td>${i === 0 ? '—' : interarrivalTimes[i].toFixed(2)}</td>
            <td>${serviceRn}</td>
            <td>${serviceTimes[i].toFixed(2)}</td>
            <td>${arrivalTimes[i].toFixed(2)}</td>
            <td>${serviceBegin[i].toFixed(2)}</td>
            <td>${serviceEnd[i].toFixed(2)}</td>
            <td>${waitingTimes[i].toFixed(2)}</td>
            <td>${timeInSystem[i].toFixed(2)}</td>
            <td>${idleTimes[i].toFixed(2)}</td>
        `;
        
        tbody.appendChild(tr);
        
        // Update totals
        totalInterarrival += i === 0 ? 0 : interarrivalTimes[i];
        totalService += serviceTimes[i];
        totalWaiting += waitingTimes[i];
        totalTimeInSystem += timeInSystem[i];
        totalIdle += idleTimes[i];
        if (waitingTimes[i] > 0) numWaited++;
    }

    // Totals row
    const totalRow = document.createElement('tr');
    totalRow.style.background = '#F5E6D3';
    totalRow.style.fontWeight = 'bold';
    totalRow.innerHTML = `
        <td>Total</td>
        <td>—</td>
        <td>${totalInterarrival.toFixed(2)}</td>
        <td>—</td>
        <td>${totalService.toFixed(2)}</td>
        <td></td>
        <td></td>
        <td></td>
        <td>${totalWaiting.toFixed(2)}</td>
        <td>${totalTimeInSystem.toFixed(2)}</td>
        <td>${totalIdle.toFixed(2)}</td>
    `;
    tbody.appendChild(totalRow);
    
    // Display distribution tables
    displayDistributionTables();

    // Performance measures, following the PDF logic
    const avgWaiting = totalWaiting / n;
    const probWait = numWaited / n;
    const totalRunTime = serviceEnd[n - 1]; // last service completion
    const probIdleServer = totalIdle / totalRunTime;
    const avgServiceTime = totalService / n;
    const avgBetweenArrivals = totalInterarrival / (n - 1);
    const avgTimeInSystem = totalTimeInSystem / n;
    const avgTimeThoseWhoWait = numWaited > 0 ? totalWaiting / numWaited : 0;

    // Build detailed step-by-step explanations
    let html = '<div style="background: #f9f9f9; padding: 20px; border-radius: 8px; border: 2px solid #D2B48C;">';
    html += '<h3 style="color: #5C4033; margin-top: 0; border-bottom: 2px solid #8B4513; padding-bottom: 10px;">Performance Measures - Calculation Steps</h3>';
    
    // 1. Average waiting time
    html += '<div style="margin-bottom: 25px; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #8B4513;">';
    html += '<h4 style="color: #5C4033; margin-top: 0;">1. Average Waiting Time (minutes)</h4>';
    html += '<p style="margin: 5px 0;"><strong>Formula:</strong> Average waiting time = Total waiting time ÷ Total number of customers</p>';
    html += `<p style="margin: 5px 0;"><strong>Step 1:</strong> Sum all waiting times from the simulation table = ${totalWaiting.toFixed(2)} minutes</p>`;
    html += `<p style="margin: 5px 0;"><strong>Step 2:</strong> Total number of customers = ${n}</p>`;
    html += `<p style="margin: 5px 0;"><strong>Step 3:</strong> Average = ${totalWaiting.toFixed(2)} ÷ ${n} = <strong style="color: #8B4513; font-size: 1.1em;">${avgWaiting.toFixed(2)} minutes</strong></p>`;
    html += '</div>';
    
    // 2. Probability (wait)
    html += '<div style="margin-bottom: 25px; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #8B4513;">';
    html += '<h4 style="color: #5C4033; margin-top: 0;">2. Probability (Wait)</h4>';
    html += '<p style="margin: 5px 0;"><strong>Formula:</strong> Probability (wait) = Number of customers who wait ÷ Total number of customers</p>';
    html += `<p style="margin: 5px 0;"><strong>Step 1:</strong> Count customers with waiting time > 0 = ${numWaited} customers</p>`;
    html += `<p style="margin: 5px 0;"><strong>Step 2:</strong> Total number of customers = ${n}</p>`;
    html += `<p style="margin: 5px 0;"><strong>Step 3:</strong> Probability = ${numWaited} ÷ ${n} = <strong style="color: #8B4513; font-size: 1.1em;">${probWait.toFixed(2)}</strong></p>`;
    html += '</div>';
    
    // 3. Probability of idle server
    html += '<div style="margin-bottom: 25px; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #8B4513;">';
    html += '<h4 style="color: #5C4033; margin-top: 0;">3. Probability of Idle Server</h4>';
    html += '<p style="margin: 5px 0;"><strong>Formula:</strong> Probability of idle server = Total idle time ÷ Total run time of simulation</p>';
    html += `<p style="margin: 5px 0;"><strong>Step 1:</strong> Sum all idle times from the simulation table = ${totalIdle.toFixed(2)} minutes</p>`;
    html += `<p style="margin: 5px 0;"><strong>Step 2:</strong> Total run time = Time when last service ends = ${totalRunTime.toFixed(2)} minutes</p>`;
    html += `<p style="margin: 5px 0;"><strong>Step 3:</strong> Probability = ${totalIdle.toFixed(2)} ÷ ${totalRunTime.toFixed(2)} = <strong style="color: #8B4513; font-size: 1.1em;">${probIdleServer.toFixed(2)}</strong></p>`;
    html += '</div>';
    
    // 4. Average service time
    html += '<div style="margin-bottom: 25px; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #8B4513;">';
    html += '<h4 style="color: #5C4033; margin-top: 0;">4. Average Service Time (minutes)</h4>';
    html += '<p style="margin: 5px 0;"><strong>Formula:</strong> Average service time = Total service time ÷ Total number of customers</p>';
    html += `<p style="margin: 5px 0;"><strong>Step 1:</strong> Sum all service times from the simulation table = ${totalService.toFixed(2)} minutes</p>`;
    html += `<p style="margin: 5px 0;"><strong>Step 2:</strong> Total number of customers = ${n}</p>`;
    html += `<p style="margin: 5px 0;"><strong>Step 3:</strong> Average = ${totalService.toFixed(2)} ÷ ${n} = <strong style="color: #8B4513; font-size: 1.1em;">${avgServiceTime.toFixed(2)} minutes</strong></p>`;
    html += '</div>';
    
    // 5. Average time between arrivals
    html += '<div style="margin-bottom: 25px; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #8B4513;">';
    html += '<h4 style="color: #5C4033; margin-top: 0;">5. Average Time Between Arrivals (minutes)</h4>';
    html += '<p style="margin: 5px 0;"><strong>Formula:</strong> Average time between arrivals = Sum of interarrival times ÷ (Number of arrivals - 1)</p>';
    html += `<p style="margin: 5px 0;"><strong>Step 1:</strong> Sum all interarrival times (excluding first customer) = ${totalInterarrival.toFixed(2)} minutes</p>`;
    html += `<p style="margin: 5px 0;"><strong>Step 2:</strong> Number of arrivals - 1 = ${n} - 1 = ${n - 1}</p>`;
    html += `<p style="margin: 5px 0;"><strong>Step 3:</strong> Average = ${totalInterarrival.toFixed(2)} ÷ ${n - 1} = <strong style="color: #8B4513; font-size: 1.1em;">${avgBetweenArrivals.toFixed(2)} minutes</strong></p>`;
    html += '</div>';
    
    // 6. Average waiting time of those who wait
    html += '<div style="margin-bottom: 25px; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #8B4513;">';
    html += '<h4 style="color: #5C4033; margin-top: 0;">6. Average Waiting Time of Those Who Wait (minutes)</h4>';
    html += '<p style="margin: 5px 0;"><strong>Formula:</strong> Average waiting time (those who wait) = Total waiting time ÷ Number of customers who wait</p>';
    html += `<p style="margin: 5px 0;"><strong>Step 1:</strong> Sum all waiting times = ${totalWaiting.toFixed(2)} minutes</p>`;
    html += `<p style="margin: 5px 0;"><strong>Step 2:</strong> Number of customers who wait = ${numWaited}</p>`;
    if (numWaited > 0) {
        html += `<p style="margin: 5px 0;"><strong>Step 3:</strong> Average = ${totalWaiting.toFixed(2)} ÷ ${numWaited} = <strong style="color: #8B4513; font-size: 1.1em;">${avgTimeThoseWhoWait.toFixed(2)} minutes</strong></p>`;
    } else {
        html += `<p style="margin: 5px 0;"><strong>Step 3:</strong> No customers waited, so average = <strong style="color: #8B4513; font-size: 1.1em;">0 minutes</strong></p>`;
    }
    html += '</div>';
    
    // 7. Average time customer spends in the system
    html += '<div style="margin-bottom: 25px; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #8B4513;">';
    html += '<h4 style="color: #5C4033; margin-top: 0;">7. Average Time Customer Spends in the System (minutes)</h4>';
    html += '<p style="margin: 5px 0;"><strong>Formula:</strong> Average time in system = Total time in system ÷ Total number of customers</p>';
    html += `<p style="margin: 5px 0;"><strong>Step 1:</strong> Sum all "Time in System" values from the simulation table = ${totalTimeInSystem.toFixed(2)} minutes</p>`;
    html += `<p style="margin: 5px 0;"><strong>Step 2:</strong> Total number of customers = ${n}</p>`;
    html += `<p style="margin: 5px 0;"><strong>Step 3:</strong> Average = ${totalTimeInSystem.toFixed(2)} ÷ ${n} = <strong style="color: #8B4513; font-size: 1.1em;">${avgTimeInSystem.toFixed(2)} minutes</strong></p>`;
    html += '<p style="margin: 5px 0; font-style: italic; color: #666;"><strong>Note:</strong> This can also be calculated as: Average waiting time + Average service time = ' + avgWaiting.toFixed(2) + ' + ' + avgServiceTime.toFixed(2) + ' = ' + avgTimeInSystem.toFixed(2) + ' minutes</p>';
    html += '</div>';
    
    // Summary box
    html += '<div style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #F5E6D3 0%, #E6D5C3 100%); border-radius: 8px; border: 2px solid #8B4513;">';
    html += '<h3 style="color: #5C4033; margin-top: 0; text-align: center;">Summary of Results</h3>';
    html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-top: 15px;">';
    html += `<div><strong>Average waiting time:</strong> ${avgWaiting.toFixed(2)} minutes</div>`;
    html += `<div><strong>Probability (wait):</strong> ${probWait.toFixed(2)}</div>`;
    html += `<div><strong>Probability of idle server:</strong> ${probIdleServer.toFixed(2)}</div>`;
    html += `<div><strong>Average service time:</strong> ${avgServiceTime.toFixed(2)} minutes</div>`;
    html += `<div><strong>Average time between arrivals:</strong> ${avgBetweenArrivals.toFixed(2)} minutes</div>`;
    html += `<div><strong>Average waiting (those who wait):</strong> ${avgTimeThoseWhoWait.toFixed(2)} minutes</div>`;
    html += `<div><strong>Average time in system:</strong> ${avgTimeInSystem.toFixed(2)} minutes</div>`;
    html += '</div>';
    html += '</div>';
    
    html += '</div>';

    if (resultsDiv) {
    resultsDiv.innerHTML = html;
    resultsDiv.className = 'result';
    resultsDiv.style.background = '#f9f9f9';
    resultsDiv.style.color = '#5C4033';
        resultsDiv.style.padding = '20px';
        resultsDiv.style.borderRadius = '8px';
        resultsDiv.style.marginTop = '20px';
    }
    
    // Scroll to top of the page to show simulation table first (not performance measures)
    setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
}

function displayDistributionTables() {
    const distDiv = document.getElementById('distributionTables');
    if (!distDiv) return;
    
    if (!arrivalTable || !serviceTable) return;

    // We expect the last simulation data to be present in the
    // global "last*" variables. If not, just show the distributions.
    const hasRnData =
        lastNumCustomers > 0 &&
        lastInterarrivalTimes.length === lastNumCustomers &&
        lastServiceTimes.length === lastNumCustomers;
    
    let html = '';

    // ========== ARRIVAL SECTION: Distribution + RN→Interarrival ==========
    html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 20px; margin-bottom: 30px;">';

    // Left: Arrival Distribution
    html += '<div class="table-container">';
    html += '<h3 style="color: #5C4033; margin-top: 0; margin-bottom: 15px; text-align: center; border-bottom: 2px solid #8B4513; padding-bottom: 10px;">Arrival Time Distribution</h3>';
    html += '<table class="editable-table" style="width: 100%;">';
    html += '<thead><tr><th>Time</th><th>Probability</th><th>Cumulative</th><th>Random Number Range</th></tr></thead>';
    html += '<tbody>';
    
    for (const row of arrivalTable) {
        const interval = `${String(row.low).padStart(2, '0')}-${String(row.high).padStart(2, '0')}`;
        html += `<tr>
            <td>${row.time.toFixed(3)}</td>
            <td>${row.prob.toFixed(5)}</td>
            <td>${row.cum.toFixed(5)}</td>
            <td>${interval}</td>
        </tr>`;
    }
    
    html += '</tbody></table></div>';

    // Right: Arrival Random Numbers → Interarrival Times (per customer)
    html += '<div class="table-container">';
    html += '<h3 style="color: #5C4033; margin-top: 0; margin-bottom: 15px; text-align: center; border-bottom: 2px solid #8B4513; padding-bottom: 10px;">Arrival Random Numbers → Interarrival Time</h3>';
    html += '<table class="editable-table" style="width: 100%;">';
    html += '<thead><tr><th>Customer</th><th>Random Number</th><th>Interarrival Time</th></tr></thead>';
    html += '<tbody>';

    if (hasRnData) {
        for (let i = 0; i < lastNumCustomers; i++) {
            let rn = '—';
            let inter = lastInterarrivalTimes[i];

            // Customer 1 has no RN and interarrival is 0
            if (i > 0) {
                rn = lastArrivalRns[i - 1] != null ? lastArrivalRns[i - 1] : '—';
            }

            html += `<tr>
                <td>${i + 1}</td>
                <td>${rn}</td>
                <td>${typeof inter === 'number' ? inter.toFixed(3) : '—'}</td>
            </tr>`;
        }
    }

    html += '</tbody></table></div>';
    html += '</div>'; // end arrival grid

    // ========== SERVICE SECTION: Distribution + RN→Service Time ==========
    html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 20px; margin-bottom: 30px;">';

    // Left: Service Distribution
    html += '<div class="table-container">';
    html += '<h3 style="color: #5C4033; margin-top: 0; margin-bottom: 15px; text-align: center; border-bottom: 2px solid #8B4513; padding-bottom: 10px;">Service Time Distribution</h3>';
    html += '<table class="editable-table" style="width: 100%;">';
    html += '<thead><tr><th>Time</th><th>Probability</th><th>Cumulative</th><th>Random Number Range</th></tr></thead>';
    html += '<tbody>';
    
    for (const row of serviceTable) {
        const interval = `${String(row.low).padStart(2, '0')}-${String(row.high).padStart(2, '0')}`;
        html += `<tr>
            <td>${row.time.toFixed(3)}</td>
            <td>${row.prob.toFixed(5)}</td>
            <td>${row.cum.toFixed(5)}</td>
            <td>${interval}</td>
        </tr>`;
    }
    
    html += '</tbody></table></div>';

    // Right: Service Random Numbers → Service Time (per customer)
    html += '<div class="table-container">';
    html += '<h3 style="color: #5C4033; margin-top: 0; margin-bottom: 15px; text-align: center; border-bottom: 2px solid #8B4513; padding-bottom: 10px;">Service Random Numbers → Service Time</h3>';
    html += '<table class="editable-table" style="width: 100%;">';
    html += '<thead><tr><th>Customer</th><th>Random Number</th><th>Service Time</th></tr></thead>';
    html += '<tbody>';

    if (hasRnData) {
        for (let i = 0; i < lastNumCustomers; i++) {
            const rn = lastServiceRns[i] != null ? lastServiceRns[i] : '—';
            const st = lastServiceTimes[i];
            html += `<tr>
                <td>${i + 1}</td>
                <td>${rn}</td>
                <td>${typeof st === 'number' ? st.toFixed(3) : '—'}</td>
            </tr>`;
        }
    }

    html += '</tbody></table></div>';
    html += '</div>'; // end service grid
    
    distDiv.innerHTML = html;
}

async function downloadPDF() {
    document.body.classList.add("pdf-mode");

    const { jsPDF } = window.jspdf;
    const report = document.getElementById("report");

    const pdf = new jsPDF("p", "mm", "a4");

    const canvas = await html2canvas(report, {
        scale: 2
    });

    const imgData = canvas.toDataURL("image/png");

    const pageWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
    }

    pdf.save("SingleServer_LimitedCusomers_Report.pdf");

    document.body.classList.remove("pdf-mode");
}


function clearResults() {
    const tbody = document.querySelector('#tableResults tbody');
    const resultsDiv = document.getElementById('queueResults');
    const distDiv = document.getElementById('distributionTables');
    if (tbody) tbody.innerHTML = '';
    if (resultsDiv) resultsDiv.innerHTML = '';
    if (distDiv) distDiv.innerHTML = '';
    alert('Results cleared. You can run another simulation.');
}

// ========== State Persistence (tab + user inputs) ==========

function collectUserInputs() {
    const inputs = {};
    const fields = document.querySelectorAll('input, select, textarea');
    let hasValue = false;

    fields.forEach(el => {
        if (!el.id) return;
        const val = el.value;
        if (val !== '' && val != null) {
            hasValue = true;
        }
        inputs[el.id] = val;
    });

    return { inputs, hasValue };
}

function collectTableBodies() {
    const bodies = {};
    const tbodies = document.querySelectorAll('tbody[id]');
    let hasContent = false;

    tbodies.forEach(tb => {
        const html = tb.innerHTML;
        if (html && html.trim().length > 0) {
            hasContent = true;
        }
        bodies[tb.id] = html;
    });

    return { bodies, hasContent };
}

function savePageState() {
    try {
        const { inputs, hasValue } = collectUserInputs();
        const { bodies, hasContent } = collectTableBodies();

        // If user hasn't entered anything meaningful, don't persist a state
        if (!hasValue && !hasContent) {
            localStorage.removeItem(STATE_KEY);
            return;
        }

        const state = {
            currentTab,
            inputs,
            bodies,
            hasUserData: true
        };
        localStorage.setItem(STATE_KEY, JSON.stringify(state));
    } catch (e) {
        // Fail silently; persistence is a convenience feature
    }
}

function restorePageState() {
    try {
        const raw = localStorage.getItem(STATE_KEY);
        if (!raw) return;

        const state = JSON.parse(raw);
        if (!state || !state.hasUserData) return;

        // Restore inputs/selects/textareas
        if (state.inputs) {
            Object.keys(state.inputs).forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.value = state.inputs[id];
                }
            });
        }

        // Restore table bodies (arrival/service/random tables)
        if (state.bodies) {
            Object.keys(state.bodies).forEach(id => {
                const tb = document.getElementById(id);
                if (tb && typeof state.bodies[id] === 'string') {
                    tb.innerHTML = state.bodies[id];
                    try {
                        tb.querySelectorAll('td.calculated-cell').forEach(c => c.textContent = '');
                    } catch (e) {}
                }
            });
        }

        // Restore tab index (after DOM is ready)
        if (typeof state.currentTab === 'number') {
            switchTab(state.currentTab);
        }

        // Recalculate derived cells based on restored data
        setTimeout(() => {
            try {
                const arrivalDist = readDistributionFromTable('tbodyArrival');
                if (arrivalDist.length > 0) {
                    calculateArrivalTable();
                }
            } catch (e) {}

            try {
                const serviceDist = readDistributionFromTable('tbodyService');
                if (serviceDist.length > 0) {
                    calculateServiceTable();
                }
            } catch (e) {}

            updateRandomNumberCounts();
        }, 50);
    } catch (e) {
        // If restore fails, ignore and let page behave normally
    }
}

// Save state when the user leaves or refreshes the page
window.addEventListener('beforeunload', savePageState);

// ========== Initialization ==========

// Initialize tables on page load and restore any saved state
document.addEventListener('DOMContentLoaded', function() {
    // First try to restore any previously saved state
    restorePageState();

    // Then, if there were default values, calculate their tables once
    setTimeout(() => {
        try {
            const arrivalDist = readDistributionFromTable('tbodyArrival');
            if (arrivalDist.length > 0) {
                calculateArrivalTable();
            }
        } catch (e) {
            // Silently ignore initialization errors
        }
        
        try {
            const serviceDist = readDistributionFromTable('tbodyService');
            if (serviceDist.length > 0) {
                calculateServiceTable();
            }
        } catch (e) {
            // Silently ignore initialization errors
        }
        
        updateRandomNumberCounts();
    }, 100);
});
