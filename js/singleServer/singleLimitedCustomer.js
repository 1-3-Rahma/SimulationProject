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
    let prevUpper = 0;
    const n = dist.length;
    
    for (let i = 0; i < n; i++) {
        const [time, prob] = dist[i];
        cum += prob;
        let upper = Math.round(cum * scale);
        if (upper <= prevUpper) upper = prevUpper + 1;
        if (i === n - 1) upper = scale;
        
        const low = prevUpper + 1;
        table.push({
            time: time,
            prob: prob,
            cum: parseFloat(cum.toFixed(5)),
            low: low,
            high: upper
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
    // Convert rn to number and handle 0 as max scale value
    let digit = parseFloat(rn);
    if (isNaN(digit)) throw new Error("Invalid random number.");
    
    // Find the max scale from the table (last row's high value)
    const maxScale = table.length > 0 ? table[table.length - 1].high : 100;
    
    // If digit is 0, treat it as max scale (since 00 represents max in display)
    if (digit === 0) digit = maxScale;
    
    // Check if digit is within valid range
    if (digit < 1 || digit > maxScale) {
        throw new Error(`Random numbers must be in the range 1..${maxScale}.`);
    }
    
    for (const row of table) {
        if (digit >= row.low && digit <= row.high) return row.time;
    }
    return table[table.length - 1].time;
}

// ========== Global State ==========

let arrivalTable = null;
let serviceTable = null;
let currentTab = 0;

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
        // Account for action cell in first column, so inputs are in 2nd and 3rd columns
        const timeInput = row.querySelector('td:nth-child(2) input');
        const probInput = row.querySelector('td:nth-child(3) input');
        
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
                const timeInput = row.querySelector('td:nth-child(2) input');
                const probInput = row.querySelector('td:nth-child(3) input');
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
        const numDigits = Math.ceil(Math.log10(scale));
        
        const table = buildCumulativeIntervals(dist, scale);
        arrivalTable = table;
        
        const tbody = document.getElementById('tbodyArrival');
        const rows = tbody.querySelectorAll('tr');
        
        rows.forEach((row, idx) => {
            if (idx < table.length) {
                const cumCell = row.querySelector('td:nth-child(4)');
                const intervalCell = row.querySelector('td:nth-child(5)');
                // Format interval with appropriate number of digits
                const highDisplay = table[idx].high === scale ? 0 : table[idx].high;
                const interval = `${String(table[idx].low).padStart(numDigits, '0')}-${String(highDisplay).padStart(numDigits, '0')}`;
                
                if (cumCell) cumCell.textContent = table[idx].cum.toFixed(5);
                if (intervalCell) intervalCell.textContent = interval;
            }
        });
    } catch (err) {
        alert(`Calculation error: ${err.message}`);
    }
}

function addArrivalRow() {
    const tbody = document.getElementById('tbodyArrival');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="action-cell"><button class="btn-delete-row" onclick="deleteArrivalRow(this)" title="Delete row">🗑️</button></td>
        <td><input type="number" class="table-input" step="0.1" value="" placeholder="Time" onchange="calculateArrivalTable()" onblur="if(this.value !== '') calculateArrivalTable()"></td>
        <td><input type="number" class="table-input" step="0.01" value="" placeholder="Prob" onchange="calculateArrivalTable()" onblur="if(this.value !== '') calculateArrivalTable()"></td>
        <td class="calculated-cell">--</td>
        <td class="calculated-cell">--</td>
    `;
    tbody.appendChild(tr);
    // Focus on the first input of the new row
    tr.querySelector('td:nth-child(2) input').focus();
}

function deleteArrivalRow(btn) {
    const tbody = document.getElementById('tbodyArrival');
    if (tbody.querySelectorAll('tr').length <= 1) {
        alert('At least one row is required.');
        return;
    }
    btn.closest('tr').remove();
    calculateArrivalTable();
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
            <td class="action-cell"><button class="btn-delete-row" onclick="deleteArrivalRow(this)" title="Delete row">🗑️</button></td>
            <td><input type="number" class="table-input" step="0.1" min="0" value="" placeholder="Time" onchange="calculateArrivalTable()" onblur="if(this.value !== '') calculateArrivalTable()"></td>
            <td><input type="number" class="table-input" step="0.01" min="0" max="1" value="" placeholder="Prob" onchange="calculateArrivalTable()" onblur="if(this.value !== '') calculateArrivalTable()"></td>
            <td class="calculated-cell">--</td>
            <td class="calculated-cell">--</td>
        `;
        tbody.appendChild(tr);
    }
    
    // Focus on first input of the last added row
    const lastRow = tbody.lastElementChild;
    if (lastRow) {
        lastRow.querySelector('td:nth-child(2) input').focus();
    }
    
    calculateArrivalTable();
}

function calculateServiceTable() {
    try {
        const dist = readDistributionFromTable('tbodyService');
        
        if (dist.length === 0) {
            // Don't show alert if table is empty or just has default/empty rows
            const tbody = document.getElementById('tbodyService');
            const rows = tbody.querySelectorAll('tr');
            const hasAnyInput = Array.from(rows).some(row => {
                const timeInput = row.querySelector('td:nth-child(2) input');
                const probInput = row.querySelector('td:nth-child(3) input');
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
        const numDigits = Math.ceil(Math.log10(scale));
        
        const table = buildCumulativeIntervals(dist, scale);
        serviceTable = table;
        
        const tbody = document.getElementById('tbodyService');
        const rows = tbody.querySelectorAll('tr');
        
        rows.forEach((row, idx) => {
            if (idx < table.length) {
                const cumCell = row.querySelector('td:nth-child(4)');
                const intervalCell = row.querySelector('td:nth-child(5)');
                // Format interval with appropriate number of digits
                const highDisplay = table[idx].high === scale ? 0 : table[idx].high;
                const interval = `${String(table[idx].low).padStart(numDigits, '0')}-${String(highDisplay).padStart(numDigits, '0')}`;
                
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
        <td class="action-cell"><button class="btn-delete-row" onclick="deleteServiceRow(this)" title="Delete row">🗑️</button></td>
        <td><input type="number" class="table-input" step="0.1" min="0" value="" placeholder="Time" onchange="calculateServiceTable()" onblur="if(this.value !== '') calculateServiceTable()"></td>
        <td><input type="number" class="table-input" step="0.01" min="0" max="1" value="" placeholder="Prob" onchange="calculateServiceTable()" onblur="if(this.value !== '') calculateServiceTable()"></td>
        <td class="calculated-cell">--</td>
        <td class="calculated-cell">--</td>
    `;
    tbody.appendChild(tr);
    // Focus on the first input of the new row
    tr.querySelector('td:nth-child(2) input').focus();
}

function deleteServiceRow(btn) {
    const tbody = document.getElementById('tbodyService');
    if (tbody.querySelectorAll('tr').length <= 1) {
        alert('At least one row is required.');
        return;
    }
    btn.closest('tr').remove();
    calculateServiceTable();
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
            <td class="action-cell"><button class="btn-delete-row" onclick="deleteServiceRow(this)" title="Delete row">🗑️</button></td>
            <td><input type="number" class="table-input" step="0.1" min="0" value="" placeholder="Time" onchange="calculateServiceTable()" onblur="if(this.value !== '') calculateServiceTable()"></td>
            <td><input type="number" class="table-input" step="0.01" min="0" max="1" value="" placeholder="Prob" onchange="calculateServiceTable()" onblur="if(this.value !== '') calculateServiceTable()"></td>
            <td class="calculated-cell">--</td>
            <td class="calculated-cell">--</td>
        `;
        tbody.appendChild(tr);
    }
    
    // Focus on first input of the last added row
    const lastRow = tbody.lastElementChild;
    if (lastRow) {
        lastRow.querySelector('td:nth-child(2) input').focus();
    }
    
    calculateServiceTable();
}

// ========== Random Number Management ==========

function readRandomNumbersFromTable(type) {
    const tbodyId = type === 'arrival' ? 'tbodyRnArr' : 'tbodyRnServ';
    const tbody = document.getElementById(tbodyId);
    const rows = tbody.querySelectorAll('tr');
    const numbers = [];
    
    for (const row of rows) {
        const input = row.querySelector('td:nth-child(2) input');
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
        <td class="action-cell"><button class="btn-delete-row" onclick="deleteRandomNumberRow(this, '${type}')" title="Delete row">🗑️</button></td>
        <td><input type="number" class="table-input" min="1" max="100" value="" placeholder="1-100" onchange="updateRandomNumberCounts()"></td>
    `;
    tbody.appendChild(tr);
    tr.querySelector('td:nth-child(2) input').focus();
    updateRandomNumberCounts();
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
            <td class="action-cell"><button class="btn-delete-row" onclick="deleteRandomNumberRow(this, '${type}')" title="Delete row">🗑️</button></td>
            <td><input type="number" class="table-input" min="1" max="100" value="" placeholder="1-100" onchange="updateRandomNumberCounts()"></td>
        `;
        tbody.appendChild(tr);
    }
    
    // Focus on first input of the last added row
    const lastRow = tbody.lastElementChild;
    if (lastRow) {
        lastRow.querySelector('td:nth-child(2) input').focus();
    }
    
    updateRandomNumberCounts();
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

        const inter = i === 0 ? '—' : interarrivalTimes[i].toString();

        totalInterarrival += i === 0 ? 0 : interarrivalTimes[i];
        totalService += serviceTimes[i];
        totalWaiting += waitingTimes[i];
        totalTimeInSystem += timeInSystem[i];
        totalIdle += idleTimes[i];
        if (waitingTimes[i] > 0) numWaited++;

        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${inter}</td>
            <td>${arrivalTimes[i]}</td>
            <td>${serviceTimes[i]}</td>
            <td>${serviceBegin[i]}</td>
            <td>${serviceEnd[i]}</td>
            <td>${waitingTimes[i]}</td>
            <td>${timeInSystem[i]}</td>
            <td>${idleTimes[i]}</td>
        `;

        tbody.appendChild(tr);
    }

    // Totals row
    const totalRow = document.createElement('tr');
    totalRow.style.background = '#F5E6D3';
    totalRow.style.fontWeight = 'bold';
    totalRow.innerHTML = `
        <td>Total</td>
        <td>${totalInterarrival}</td>
        <td></td>
        <td>${totalService}</td>
        <td></td>
        <td></td>
        <td>${totalWaiting}</td>
        <td>${totalTimeInSystem}</td>
        <td>${totalIdle}</td>
    `;
    tbody.appendChild(totalRow);

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

function clearResults() {
    const tbody = document.querySelector('#tableResults tbody');
    const resultsDiv = document.getElementById('queueResults');
    if (tbody) tbody.innerHTML = '';
    if (resultsDiv) resultsDiv.innerHTML = '';
    alert('Results cleared. You can run another simulation.');
}

// ========== Initialization ==========

// Initialize tables on page load
document.addEventListener('DOMContentLoaded', function() {
    // Calculate initial tables if they have default values (silently, no alerts)
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
