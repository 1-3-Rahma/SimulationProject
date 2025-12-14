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

function buildCumulativeIntervals(dist) {
    const table = [];
    let cum = 0.0;
    let prevUpper = 0;
    const n = dist.length;
    
    for (let i = 0; i < n; i++) {
        const [time, prob] = dist[i];
        cum += prob;
        let upper = Math.round(cum * 100);
        if (upper <= prevUpper) upper = prevUpper + 1;
        if (i === n - 1) upper = 100;
        
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
    if (rn < 1 || rn > 100) throw new Error("Random numbers must be in the range 1..100.");
    for (const row of table) {
        if (rn >= row.low && rn <= row.high) return row.time;
    }
    return table[table.length - 1].time;
}

// ========== Time-Limited Simulation Core ==========

function runTimeLimitedSimulation(timeLimit, limitType, arrivalTable, serviceTable, arrRns, servRns) {
    let serverAvailable = 0.0;
    let servIdx = 0;
    let arrIdx = 0;
    const results = [];
    let currentTime = 0.0;
    let customerNumber = 1;

    while (true) {
        let arrivalTime, arrInterval, rnArr;
        
        if (customerNumber === 1) {
            arrivalTime = 0.0;
            arrInterval = null;
            rnArr = null;
        } else {
            if (arrIdx >= arrRns.length) {
                throw new Error(`Not enough arrival random numbers. Needed at least ${arrIdx + 1}.`);
            }
            rnArr = arrRns[arrIdx];
            arrIdx++;
            arrInterval = mapRandomToTime(rnArr, arrivalTable);
            currentTime += arrInterval;
            arrivalTime = currentTime;
        }

        // Check stopping condition based on arrival time
        if (limitType === "arrival" || limitType === "both") {
            if (arrivalTime > timeLimit) {
                break; // Stop before processing this customer
            }
        }

        const startService = customerNumber === 1 ? 0.0 : Math.max(arrivalTime, serverAvailable);
        const wait = customerNumber === 1 ? 0.0 : startService - arrivalTime;

        if (servIdx >= servRns.length) {
            throw new Error(`Not enough service random numbers. Needed at least ${servIdx + 1}.`);
        }

        const rnServ = servRns[servIdx];
        servIdx++;
        
        const servTime = mapRandomToTime(rnServ, serviceTable);
        const endService = startService + servTime;
        
        // Check stopping condition based on service end time
        if (limitType === "serviceEnd" || limitType === "both") {
            if (endService > timeLimit) {
                // Include this customer if service end exceeds limit
                results.push({
                    cust: customerNumber,
                    rn_arr: rnArr,
                    arr_interval: arrInterval,
                    arrival_time: parseFloat(arrivalTime.toFixed(3)),
                    rn_serv: rnServ,
                    service_time: servTime,
                    start: parseFloat(startService.toFixed(3)),
                    wait: parseFloat(wait.toFixed(3)),
                    end: parseFloat(endService.toFixed(3))
                });
                break; // Stop after including this customer
            }
        }

        serverAvailable = endService;

        results.push({
            cust: customerNumber,
            rn_arr: rnArr,
            arr_interval: arrInterval,
            arrival_time: parseFloat(arrivalTime.toFixed(3)),
            rn_serv: rnServ,
            service_time: servTime,
            start: parseFloat(startService.toFixed(3)),
            wait: parseFloat(wait.toFixed(3)),
            end: parseFloat(endService.toFixed(3))
        });

        customerNumber++;
        
        // Safety check to prevent infinite loops
        if (customerNumber > 10000) {
            throw new Error("Simulation exceeded maximum iterations. Check your time limit and random numbers.");
        }
    }

    return {
        results: results
    };
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
    if (!tbody) return [];
    
    const rows = tbody.querySelectorAll('tr');
    const dist = [];
    
    for (const row of rows) {
        const timeInput = row.querySelector('td:nth-child(2) input');
        const probInput = row.querySelector('td:nth-child(3) input');
        
        if (!timeInput || !probInput) continue;
        
        const time = parseFloat(timeInput.value);
        const prob = parseFloat(probInput.value);
        
        if (isNaN(time) || isNaN(prob)) continue;
        if (prob < 0 || prob > 1) continue;
        
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
            
            if (!hasAnyInput) return;
            
            const hasRows = rows.length > 0;
            if (hasRows) {
                alert('Please enter at least one row with valid Time and Probability values.');
            }
            return;
        }
        
        const table = buildCumulativeIntervals(dist);
        arrivalTable = table;
        
        const tbody = document.getElementById('tbodyArrival');
        const rows = tbody.querySelectorAll('tr');
        
        rows.forEach((row, idx) => {
            if (idx < table.length) {
                const cumCell = row.querySelector('td:nth-child(4)');
                const intervalCell = row.querySelector('td:nth-child(5)');
                const interval = `${String(table[idx].low).padStart(2, '0')}-${String(table[idx].high).padStart(2, '0')}`;
                
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
        <td><input type="number" class="table-input" step="0.1" min="0" value="" placeholder="Time" onchange="calculateArrivalTable()" onblur="if(this.value !== '') calculateArrivalTable()"></td>
        <td><input type="number" class="table-input" step="0.01" min="0" max="1" value="" placeholder="Prob" onchange="calculateArrivalTable()" onblur="if(this.value !== '') calculateArrivalTable()"></td>
        <td class="calculated-cell">--</td>
        <td class="calculated-cell">--</td>
    `;
    tbody.appendChild(tr);
    tr.querySelector('td:nth-child(2) input').focus();
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

function calculateServiceTable() {
    try {
        const dist = readDistributionFromTable('tbodyService');
        
        if (dist.length === 0) {
            const tbody = document.getElementById('tbodyService');
            if (!tbody) return;
            
            const rows = tbody.querySelectorAll('tr');
            const hasAnyInput = Array.from(rows).some(row => {
                const timeInput = row.querySelector('td:nth-child(2) input');
                const probInput = row.querySelector('td:nth-child(3) input');
                if (!timeInput || !probInput) return false;
                const time = parseFloat(timeInput.value);
                const prob = parseFloat(probInput.value);
                return !isNaN(time) && !isNaN(prob) && (time !== 0 || prob !== 0);
            });
            
            if (!hasAnyInput) return;
            
            const hasRows = rows.length > 0;
            if (hasRows) {
                alert('Please enter at least one row with valid Time and Probability values.');
            }
            return;
        }
        
        const table = buildCumulativeIntervals(dist);
        serviceTable = table;
        
        const tbody = document.getElementById('tbodyService');
        const rows = tbody.querySelectorAll('tr');
        
        rows.forEach((row, idx) => {
            if (idx < table.length) {
                const cumCell = row.querySelector('td:nth-child(4)');
                const intervalCell = row.querySelector('td:nth-child(5)');
                const interval = `${String(table[idx].low).padStart(2, '0')}-${String(table[idx].high).padStart(2, '0')}`;
                
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
    if (!tbody) return;
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="action-cell"><button class="btn-delete-row" onclick="deleteServiceRow(this)" title="Delete row">🗑️</button></td>
        <td><input type="number" class="table-input" step="0.1" min="0" value="" placeholder="Time" onchange="calculateServiceTable()" onblur="if(this.value !== '') calculateServiceTable()"></td>
        <td><input type="number" class="table-input" step="0.01" min="0" max="1" value="" placeholder="Prob" onchange="calculateServiceTable()" onblur="if(this.value !== '') calculateServiceTable()"></td>
        <td class="calculated-cell">--</td>
        <td class="calculated-cell">--</td>
    `;
    tbody.appendChild(tr);
    tr.querySelector('td:nth-child(2) input').focus();
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
}

function deleteServiceRow(btn) {
    const tbody = document.getElementById('tbodyService');
    if (!tbody) return;
    
    if (tbody.querySelectorAll('tr').length <= 1) {
        alert('At least one row is required.');
        return;
    }
    btn.closest('tr').remove();
    calculateServiceTable();
}

// ========== Random Number Management ==========

function readRandomNumbersFromTable(type) {
    const tbodyId = type === 'arrival' ? 'tbodyRnArr' : 'tbodyRnServ';
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return [];
    
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
    if (!tbody) return;
    
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
    if (!tbody) return;
    
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
    
    const txtRnArr = document.getElementById('txtRnArr');
    const txtRnServ = document.getElementById('txtRnServ');
    if (txtRnArr) txtRnArr.value = arrNumbers.join(', ');
    if (txtRnServ) txtRnServ.value = servNumbers.join(', ');
}

// ========== Simulation Execution ==========

function runSimulationFromUI() {
    try {
        const timeLimit = parseFloat(document.getElementById('timeLimit').value);
        if (isNaN(timeLimit) || timeLimit <= 0) {
            alert('Please enter a valid time limit greater than 0.');
            switchTab(0);
            return;
        }
        
        const limitType = document.getElementById('limitType').value;
        
        // Ensure tables are calculated
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
        
        // Read random numbers
        const arrRns = readRandomNumbersFromTable('arrival');
        const servRns = readRandomNumbersFromTable('service');
        
        if (arrRns.length < 10) {
            alert(`Recommended: At least 10 arrival random numbers for time-limited simulation. Currently have ${arrRns.length}.`);
        }
        
        if (servRns.length < 10) {
            alert(`Recommended: At least 10 service random numbers for time-limited simulation. Currently have ${servRns.length}.`);
        }
        
        const simData = runTimeLimitedSimulation(
            timeLimit, 
            limitType, 
            arrivalTable, 
            serviceTable, 
            arrRns, 
            servRns
        );
        
        populateResults(simData, timeLimit, limitType);
        switchTab(4);
    } catch (err) {
        alert(`Simulation error: ${err.message}`);
    }
}

function populateResults(simData, timeLimit, limitType) {
    const tbody = document.querySelector('#tableResults tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const results = simData.results;
    const n = results.length;
    
    // Calculate totals for performance measures
    let totalInterarrival = 0;
    let totalService = 0;
    let totalWaiting = 0;
    let totalTimeInSystem = 0;
    let totalIdle = 0;
    let numWaited = 0;
    
    for (let i = 0; i < n; i++) {
        const row = results[i];
        const tr = document.createElement('tr');
        
        // Calculate interarrival (skip first customer)
        if (i > 0 && row.arr_interval !== null) {
            totalInterarrival += row.arr_interval;
        }
        
        // Calculate totals
        totalService += row.service_time;
        totalWaiting += row.wait;
        if (row.wait > 0) numWaited++;
        
        // Calculate time in system (end - arrival_time)
        const timeInSystem = row.arrival_time !== null ? row.end - row.arrival_time : row.service_time;
        totalTimeInSystem += timeInSystem;
        
        // Calculate idle time (time between previous service end and current arrival)
        let idleTime = 0;
        if (i > 0) {
            const prevEnd = results[i - 1].end;
            const currArrival = row.arrival_time !== null ? row.arrival_time : 0;
            if (currArrival > prevEnd) {
                idleTime = currArrival - prevEnd;
                totalIdle += idleTime;
            }
        }
        
        // Format interarrival time (show '—' for first customer)
        const interarrival = i === 0 ? '—' : (row.arr_interval !== null ? row.arr_interval.toFixed(3) : '—');
        
        tr.innerHTML = `
            <td>${row.cust}</td>
            <td>${interarrival}</td>
            <td>${row.arrival_time !== null ? row.arrival_time.toFixed(3) : '0.000'}</td>
            <td>${row.service_time.toFixed(3)}</td>
            <td>${row.start.toFixed(3)}</td>
            <td>${row.end.toFixed(3)}</td>
            <td>${row.wait.toFixed(3)}</td>
            <td>${timeInSystem.toFixed(3)}</td>
            <td>${idleTime.toFixed(3)}</td>
        `;
        tbody.appendChild(tr);
    }
    
    // Display time limit info
    const timeLimitDiv = document.getElementById('timeLimitInfo');
    if (timeLimitDiv) {
        const lastCustomer = results[results.length - 1];
        const limitTypeText = limitType === 'arrival' ? 'Arrival Time' : 
                             limitType === 'serviceEnd' ? 'Service End Time' : 
                             'Arrival or Service End Time';
        timeLimitDiv.innerHTML = `
            <strong>Simulation stopped at:</strong> ${limitTypeText} limit of ${timeLimit.toFixed(2)}. 
            Processed ${n} customer(s). 
            Last customer: Arrival=${lastCustomer.arrival_time !== null ? lastCustomer.arrival_time.toFixed(3) : '--'}, End=${lastCustomer.end.toFixed(3)}
        `;
        timeLimitDiv.classList.remove('hidden');
    }
    
    // Display distribution tables
    displayDistributionTables();
    
    // Calculate performance measures
    calculatePerformanceMeasures(n, totalInterarrival, totalService, totalWaiting, totalTimeInSystem, totalIdle, numWaited, results);
}

function calculatePerformanceMeasures(n, totalInterarrival, totalService, totalWaiting, totalTimeInSystem, totalIdle, numWaited, results) {
    const resultsDiv = document.getElementById('queueResults');
    if (!resultsDiv) return;
    
    // Calculate metrics
    const avgWaiting = totalWaiting / n;
    const probWait = numWaited / n;
    const totalRunTime = results.length > 0 ? results[results.length - 1].end : 0;
    const probIdleServer = totalRunTime > 0 ? totalIdle / totalRunTime : 0;
    const avgServiceTime = totalService / n;
    const avgBetweenArrivals = n > 1 ? totalInterarrival / (n - 1) : 0;
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
    if (n > 1) {
        html += `<p style="margin: 5px 0;"><strong>Step 3:</strong> Average = ${totalInterarrival.toFixed(2)} ÷ ${n - 1} = <strong style="color: #8B4513; font-size: 1.1em;">${avgBetweenArrivals.toFixed(2)} minutes</strong></p>`;
    } else {
        html += `<p style="margin: 5px 0;"><strong>Step 3:</strong> Only one customer, so average = <strong style="color: #8B4513; font-size: 1.1em;">0 minutes</strong></p>`;
    }
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
    
    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; margin-bottom: 30px;">';
    
    // Arrival Time Distribution Table
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
    
    // Service Time Distribution Table
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
    html += '</div>';
    
    distDiv.innerHTML = html;
}

function printToPDF() {
    window.print();
}

function clearResults() {
    const tbody = document.querySelector('#tableResults tbody');
    const resultsDiv = document.getElementById('queueResults');
    const distDiv = document.getElementById('distributionTables');
    if (tbody) tbody.innerHTML = '';
    if (resultsDiv) resultsDiv.innerHTML = '';
    if (distDiv) distDiv.innerHTML = '';
    
    const timeLimitDiv = document.getElementById('timeLimitInfo');
    if (timeLimitDiv) timeLimitDiv.classList.add('hidden');
    
    alert('Results cleared. You can run another simulation.');
}

// ========== Initialization ==========

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        try {
            const arrivalDist = readDistributionFromTable('tbodyArrival');
            if (arrivalDist.length > 0) {
                calculateArrivalTable();
            }
        } catch (e) {
            // Silently ignore
        }
        
        try {
            const serviceDist = readDistributionFromTable('tbodyService');
            if (serviceDist.length > 0) {
                calculateServiceTable();
            }
        } catch (e) {
            // Silently ignore
        }
    }, 100);
});

