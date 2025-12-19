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

function parseRnList(text) {
    if (!text.trim()) return [];
    const tokens = text.replace(/,/g, ' ').replace(/\n/g, ' ').split(/\s+/).filter(t => t.length > 0);
    const rns = [];
    for (const token of tokens) {
        const v = parseInt(token, 10);
        if (isNaN(v)) throw new Error(`Invalid random number: '${token}'`);
        if (v < 1 || v > 100) throw new Error(`Random numbers must be between 1 and 100: '${v}'`);
        rns.push(v);
    }
    return rns;
}

function weightedAverage(dist) {
    return dist.reduce((sum, [t, p]) => sum + t * p, 0);
}

// ========== Simulation Core ==========

function runCallCenterSimulation(numCustomers, arrivalTable, s1Table, s2Table, arrRns, servRns, preference, arrRnsDisplay = null, servRnsDisplay = null) {
    if (arrRns.length < Math.max(0, numCustomers - 1)) {
        throw new Error(`Need at least ${Math.max(0, numCustomers - 1)} arrival random numbers.`);
    }

    const serversAvailable = [0.0, 0.0];
    let servIdx = 0;
    const results = [];
    let currentTime = 0.0;

    // Detect faster/slower
    const avg1 = weightedAverage(s1Table.map(r => [r.time, r.prob]));
    const avg2 = weightedAverage(s2Table.map(r => [r.time, r.prob]));
    const fasterId = avg1 < avg2 ? 0 : 1;
    const slowerId = avg1 < avg2 ? 1 : 0;

    for (let i = 1; i <= numCustomers; i++) {
        let arrivalTime, arrInterval, rnArr;
        
        if (i === 1) {
            arrivalTime = 0.0; // First customer arrives at time 0
            arrInterval = null; // No interval for first customer
            rnArr = null; // No random number for first customer
        } else {
            rnArr = arrRns[i - 2];
            arrInterval = mapRandomToTime(rnArr, arrivalTable);
            currentTime += arrInterval;
            arrivalTime = currentTime;
        }

        const s1Avail = serversAvailable[0];
        const s2Avail = serversAvailable[1];

        let serverId;
        if (i === 1) {
            // First customer: both servers available, choose based on preference
            serverId = preference === 'Faster' ? fasterId : slowerId;
        } else {
            // Subsequent customers: choose based on availability
            if (s1Avail <= arrivalTime && s2Avail <= arrivalTime) {
                serverId = preference === 'Faster' ? fasterId : slowerId;
            } else if (s1Avail <= arrivalTime) {
                serverId = 0;
            } else if (s2Avail <= arrivalTime) {
                serverId = 1;
            } else {
                serverId = s1Avail <= s2Avail ? 0 : 1;
            }
        }

        const startService = i === 1 ? 0.0 : Math.max(arrivalTime, serversAvailable[serverId]);
        const wait = i === 1 ? 0.0 : startService - arrivalTime;

        if (servIdx >= servRns.length) {
            throw new Error(`Not enough service random numbers. Needed at least ${servIdx + 1}.`);
        }

        const rnServ = servRns[servIdx];
        servIdx++;
        
        const servTable = serverId === 0 ? s1Table : s2Table;
        const servTime = mapRandomToTime(rnServ, servTable);
        const endService = startService + servTime;
        serversAvailable[serverId] = endService;

        // Use display values for showing in the table, but keep null for first customer
        const displayRnArr = rnArr === null ? null : (arrRnsDisplay ? arrRnsDisplay[i - 2] : rnArr);
        const displayRnServ = servRnsDisplay ? servRnsDisplay[i - 1] : rnServ;

        results.push({
            cust: i,
            rn_arr: displayRnArr, // null for first customer (shows '--')
            arr_interval: arrInterval, // null for first customer (shows '--')
            arrival_time: parseFloat(arrivalTime.toFixed(3)), // 0.000 for first customer
            server: serverId + 1,
            server_name: serverId === 0 ? 'Server 1' : 'Server 2',
            rn_serv: displayRnServ,
            service_time: servTime,
            start: parseFloat(startService.toFixed(3)),
            wait: parseFloat(wait.toFixed(3)),
            end: parseFloat(endService.toFixed(3))
        });
    }

    return {
        results: results,
        avg1: parseFloat(avg1.toFixed(4)),
        avg2: parseFloat(avg2.toFixed(4)),
        fasterId: fasterId,
        slowerId: slowerId
    };
}

// ========== Global State ==========

let arrivalTable = null;
let s1Table = null;
let s2Table = null;
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
    // Prevent moving forward when any cumulative probability exceeds 1
    if (tabIdx > currentTab) {
        if (currentTab === 1) { // leaving interarrival step
            const dist = readDistributionFromTable('tbodyArrival');
            const { ok } = validateTotalProbability(dist, 'Interarrival');
            if (!ok) return;
        } else if (currentTab === 2) { // leaving service step
            const dist1 = readDistributionFromTable('tbodyS1');
            const dist2 = readDistributionFromTable('tbodyS2');
            const { ok: ok1 } = validateTotalProbability(dist1, 'Service (Server 1)');
            if (!ok1) return;
            const { ok: ok2 } = validateTotalProbability(dist2, 'Service (Server 2)');
            if (!ok2) return;
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
            // Only show alert if user explicitly tries to calculate with invalid data
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

function buildArrivalTable() {
    try {
        const txt = document.getElementById('txtArrivals').value.trim();
        if (!txt) {
            // Try reading from table instead
            calculateArrivalTable();
            return;
        }
        
        const dist = parseDistributionText(txt);
        arrivalTable = buildCumulativeIntervals(dist);
        
        const tbody = document.getElementById('tbodyArrival');
        tbody.innerHTML = '';
        
        for (const row of arrivalTable) {
            const tr = document.createElement('tr');
            const interval = `${String(row.low).padStart(2, '0')}-${String(row.high).padStart(2, '0')}`;
            tr.innerHTML = `
                <td class="action-cell"><button class="btn-delete-row" onclick="deleteArrivalRow(this)" title="Delete row">🗑️</button></td>
                <td><input type="number" class="table-input" step="0.1" min="0" value="${row.time}" onchange="calculateArrivalTable()"></td>
                <td><input type="number" class="table-input" step="0.01" min="0" max="1" value="${row.prob.toFixed(2)}" onchange="calculateArrivalTable()"></td>
                <td class="calculated-cell">${row.cum.toFixed(5)}</td>
                <td class="calculated-cell">${interval}</td>
            `;
            tbody.appendChild(tr);
        }
        
        alert('Arrival table generated. Proceed to Step 3: Service Times.');
    } catch (err) {
        alert(`Arrival input error: ${err.message}`);
    }
}

function calculateServiceTable(serverId) {
    try {
        const tbodyId = serverId === 1 ? 'tbodyS1' : 'tbodyS2';
        const dist = readDistributionFromTable(tbodyId);
        
        if (dist.length === 0) {
            // Don't show alert if table is empty or just has default/empty rows
            // Only show alert if user explicitly tries to calculate with invalid data
            const tbody = document.getElementById(tbodyId);
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
        
        const table = buildCumulativeIntervals(dist);
        
        if (serverId === 1) {
            s1Table = table;
        } else {
            s2Table = table;
        }
        
        const tbody = document.getElementById(tbodyId);
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
        
        // Update speed detection if both tables are ready
        if (s1Table && s2Table) {
            updateSpeedDetection();
        }
    } catch (err) {
        alert(`Calculation error: ${err.message}`);
    }
}

function addServiceRow(serverId) {
    const tbodyId = serverId === 1 ? 'tbodyS1' : 'tbodyS2';
    const tbody = document.getElementById(tbodyId);
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="action-cell"><button class="btn-delete-row" onclick="deleteServiceRow(this, ${serverId})" title="Delete row">🗑️</button></td>
        <td><input type="number" class="table-input" step="0.1" min="0" value="" placeholder="Time" onchange="calculateServiceTable(${serverId})" onblur="if(this.value !== '') calculateServiceTable(${serverId})"></td>
        <td><input type="number" class="table-input" step="0.01" min="0" max="1" value="" placeholder="Prob" onchange="calculateServiceTable(${serverId})" onblur="if(this.value !== '') calculateServiceTable(${serverId})"></td>
        <td class="calculated-cell">--</td>
        <td class="calculated-cell">--</td>
    `;
    tbody.appendChild(tr);
    // Focus on the first input of the new row
    tr.querySelector('td:nth-child(2) input').focus();
}

function deleteServiceRow(btn, serverId) {
    const tbodyId = serverId === 1 ? 'tbodyS1' : 'tbodyS2';
    const tbody = document.getElementById(tbodyId);
    if (tbody.querySelectorAll('tr').length <= 1) {
        alert('At least one row is required.');
        return;
    }
    btn.closest('tr').remove();
    calculateServiceTable(serverId);
}

function updateSpeedDetection() {
    if (!s1Table || !s2Table) return;
    
    // Use the calculated tables (which have normalized probabilities) instead of reading from DOM
    const dist1 = s1Table.map(r => [r.time, r.prob]);
    const dist2 = s2Table.map(r => [r.time, r.prob]);
    
    if (dist1.length === 0 || dist2.length === 0) return;
    
    const avg1 = weightedAverage(dist1);
    const avg2 = weightedAverage(dist2);
    const faster = avg1 < avg2 ? 'Server 1' : 'Server 2';
    const slower = avg1 < avg2 ? 'Server 2' : 'Server 1';
    const minAvg = Math.min(avg1, avg2).toFixed(3);
    const maxAvg = Math.max(avg1, avg2).toFixed(3);
    
    const speedDiv = document.getElementById('speedDetection');
    speedDiv.innerHTML = `Detected: Faster = <strong>${faster}</strong> (avg=${minAvg}), Slower = <strong>${slower}</strong> (avg=${maxAvg})`;
    speedDiv.classList.remove('hidden');
}

function buildServiceTables() {
    try {
        // Try reading from textareas first, then fall back to tables
        const txt1 = document.getElementById('txtS1').value.trim();
        const txt2 = document.getElementById('txtS2').value.trim();
        
        let dist1, dist2;
        
        if (txt1) {
            dist1 = parseDistributionText(txt1);
            s1Table = buildCumulativeIntervals(dist1);
            
            const tbody1 = document.getElementById('tbodyS1');
            tbody1.innerHTML = '';
            for (const row of s1Table) {
                const tr = document.createElement('tr');
                const interval = `${String(row.low).padStart(2, '0')}-${String(row.high).padStart(2, '0')}`;
                tr.innerHTML = `
                    <td class="action-cell"><button class="btn-delete-row" onclick="deleteServiceRow(this, 1)" title="Delete row">🗑️</button></td>
                    <td><input type="number" class="table-input" step="0.1" min="0" value="${row.time}" onchange="calculateServiceTable(1)"></td>
                    <td><input type="number" class="table-input" step="0.01" min="0" max="1" value="${row.prob.toFixed(2)}" onchange="calculateServiceTable(1)"></td>
                    <td class="calculated-cell">${row.cum.toFixed(5)}</td>
                    <td class="calculated-cell">${interval}</td>
                `;
                tbody1.appendChild(tr);
            }
        } else {
            calculateServiceTable(1);
            dist1 = readDistributionFromTable('tbodyS1');
        }
        
        if (txt2) {
            dist2 = parseDistributionText(txt2);
            s2Table = buildCumulativeIntervals(dist2);
            
            const tbody2 = document.getElementById('tbodyS2');
            tbody2.innerHTML = '';
            for (const row of s2Table) {
                const tr = document.createElement('tr');
                const interval = `${String(row.low).padStart(2, '0')}-${String(row.high).padStart(2, '0')}`;
                tr.innerHTML = `
                    <td class="action-cell"><button class="btn-delete-row" onclick="deleteServiceRow(this, 2)" title="Delete row">🗑️</button></td>
                    <td><input type="number" class="table-input" step="0.1" min="0" value="${row.time}" onchange="calculateServiceTable(2)"></td>
                    <td><input type="number" class="table-input" step="0.01" min="0" max="1" value="${row.prob.toFixed(2)}" onchange="calculateServiceTable(2)"></td>
                    <td class="calculated-cell">${row.cum.toFixed(5)}</td>
                    <td class="calculated-cell">${interval}</td>
                `;
                tbody2.appendChild(tr);
            }
        } else {
            calculateServiceTable(2);
            dist2 = readDistributionFromTable('tbodyS2');
        }
        
        // Show detection
        updateSpeedDetection();
        
        alert('Service tables generated. Proceed to Step 4: Random Numbers.');
    } catch (err) {
        alert(`Service input error: ${err.message}`);
    }
}

// ========== Simulation Execution ==========

function readRandomNumbersFromTable(type, forDisplay = false) {
    const tbodyId = type === 'arrival' ? 'tbodyRnArr' : 'tbodyRnServ';
    const tbody = document.getElementById(tbodyId);
    const rows = tbody.querySelectorAll('tr');
    const numbers = [];

    for (const row of rows) {
        const input = row.querySelector('td:nth-child(2) input');
        if (!input) continue;

        const rawValue = parseFloat(input.value);
        if (isNaN(rawValue)) continue;

        // Restrict to 0-100 range
        if (rawValue < 0 || rawValue > 100) continue;

        // Process the value (round to nearest integer)
        let processedValue = Math.round(rawValue);

        if (forDisplay) {
            // For display purposes, return the processed value (rounded, but 0 stays as 0)
            numbers.push(processedValue);
        } else {
            // For calculation purposes, treat 0 as 100, others as processed
            const normalizedValue = (processedValue === 0) ? 100 : processedValue;
            numbers.push(normalizedValue);
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
        <td><input type="number" class="table-input" min="0" max="100" step="0.01" value="" placeholder="0-100" onchange="updateRandomNumberCounts()"></td>
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
            <td><input type="number" class="table-input" min="0" max="100" step="0.01" value="" placeholder="0-100" onchange="updateRandomNumberCounts()"></td>
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
    const arrNumbers = readRandomNumbersFromTable('arrival', true); // Use display values for UI
    const servNumbers = readRandomNumbersFromTable('service', true); // Use display values for UI
    
    document.getElementById('arrivalCount').textContent = `Count: ${arrNumbers.length} numbers`;
    document.getElementById('serviceCount').textContent = `Count: ${servNumbers.length} numbers`;
    
    // Update hidden textareas for backward compatibility
    document.getElementById('txtRnArr').value = arrNumbers.join(', ');
    document.getElementById('txtRnServ').value = servNumbers.join(', ');
}

function runSimulationFromUI() {
    try {
        const numCustomers = parseInt(document.getElementById('numCustomers').value);
        if (numCustomers <= 0) throw new Error("Number must be > 0.");
        
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
        
        if (!s1Table || !s2Table) {
            if (!s1Table) calculateServiceTable(1);
            if (!s2Table) calculateServiceTable(2);
            
            if (!s1Table || !s2Table) {
                alert('Please fill in both service tables in Step 3 first.');
                switchTab(2);
                return;
            }
        }
        // Validate both service sums exactly 1 before proceeding
        const serviceDistCheck1 = readDistributionFromTable('tbodyS1');
        const serviceDistCheck2 = readDistributionFromTable('tbodyS2');
        const { ok: servOk1 } = validateTotalProbability(serviceDistCheck1, 'Service (Server 1)');
        if (!servOk1) {
            switchTab(2);
            return;
        }
        const { ok: servOk2 } = validateTotalProbability(serviceDistCheck2, 'Service (Server 2)');
        if (!servOk2) {
            switchTab(2);
            return;
        }
        
        // Read random numbers from table cells
        const arrRns = readRandomNumbersFromTable('arrival'); // For calculations (0 becomes 100)
        const servRns = readRandomNumbersFromTable('service'); // For calculations (0 becomes 100)
        const arrRnsDisplay = readRandomNumbersFromTable('arrival', true); // For display (processed, 0 stays 0)
        const servRnsDisplay = readRandomNumbersFromTable('service', true); // For display (processed, 0 stays 0)

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

        const preference = document.querySelector('input[name="preference"]:checked').value;

        const simData = runCallCenterSimulation(numCustomers, arrivalTable, s1Table, s2Table, arrRns, servRns, preference, arrRnsDisplay, servRnsDisplay);
        
        populateResults(simData);
        switchTab(4);
    } catch (err) {
        alert(`Simulation error: ${err.message}`);
    }
}

function populateResults(simData) {
    const tbody = document.querySelector('#tableResults tbody');
    tbody.innerHTML = '';
    
    const results = simData.results;
    const n = results.length;
    
    // Calculate totals for performance measures
    let totalService = 0;
    let totalWaiting = 0;
    const serverServiceTime = [0, 0]; // Track service time per server (Server 1 and Server 2)
    
    for (const row of results) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.cust}</td>
            <td>${row.rn_arr !== null ? row.rn_arr : '--'}</td>
            <td>${row.arr_interval !== null ? row.arr_interval.toFixed(3) : '--'}</td>
            <td>${row.arrival_time !== null ? row.arrival_time.toFixed(3) : '--'}</td>
            <td>${row.server}</td>
            <td>${row.server_name}</td>
            <td>${row.rn_serv}</td>
            <td>${row.service_time.toFixed(3)}</td>
            <td>${row.start.toFixed(3)}</td>
            <td>${row.wait.toFixed(3)}</td>
            <td>${row.end.toFixed(3)}</td>
        `;
        tbody.appendChild(tr);
        
        // Calculate totals
        totalService += row.service_time;
        totalWaiting += row.wait;
        
        // Track service time per server (server is 1-indexed, so subtract 1 for array index)
        const serverIdx = row.server - 1;
        if (serverIdx >= 0 && serverIdx < 2) {
            serverServiceTime[serverIdx] += row.service_time;
        }
    }
    
    const faster = simData.fasterId === 0 ? 'Server 1' : 'Server 2';
    const slower = simData.slowerId === 0 ? 'Server 1' : 'Server 2';
    const infoDiv = document.getElementById('speedInfo');
    infoDiv.innerHTML = `Detected faster: <strong>${faster}</strong> (avg=${simData.avg1}), slower: <strong>${slower}</strong> (avg=${simData.avg2})`;
    infoDiv.classList.remove('hidden');
    
    // Display distribution tables
    displayDistributionTables();
    
    // Calculate performance measures
    const totalRunTime = results.length > 0 ? results[results.length - 1].end : 0;
    const numServers = 2; // Two servers in this simulation
    calculatePerformanceMeasures(n, totalService, totalWaiting, totalRunTime, numServers, serverServiceTime);
}

function calculatePerformanceMeasures(n, totalService, totalWaiting, totalRunTime, numServers, serverServiceTime) {
    const resultsDiv = document.getElementById('queueResults');
    if (!resultsDiv) return;
    
    // Calculate metrics
    const avgWaiting = totalWaiting / n;
    const utilization = totalRunTime > 0 ? totalService / (numServers * totalRunTime) : 0;
    
    // Calculate individual server utilization
    const serverUtilizations = [];
    for (let i = 0; i < numServers; i++) {
        const util = totalRunTime > 0 ? serverServiceTime[i] / totalRunTime : 0;
        serverUtilizations.push(util);
    }
    
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
    
    // 2. Overall Server Utilization
    html += '<div style="margin-bottom: 25px; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #8B4513;">';
    html += '<h4 style="color: #5C4033; margin-top: 0;">2. Overall Server Utilization</h4>';
    html += '<p style="margin: 5px 0;"><strong>Formula:</strong> Utilization = Total service time ÷ (Number of servers × Total run time)</p>';
    html += `<p style="margin: 5px 0;"><strong>Step 1:</strong> Sum all service times from the simulation table = ${totalService.toFixed(2)} minutes</p>`;
    html += `<p style="margin: 5px 0;"><strong>Step 2:</strong> Number of servers = ${numServers}</p>`;
    html += `<p style="margin: 5px 0;"><strong>Step 3:</strong> Total run time = Time when last service ends = ${totalRunTime.toFixed(2)} minutes</p>`;
    html += `<p style="margin: 5px 0;"><strong>Step 4:</strong> Utilization = ${totalService.toFixed(2)} ÷ (${numServers} × ${totalRunTime.toFixed(2)}) = ${totalService.toFixed(2)} ÷ ${(numServers * totalRunTime).toFixed(2)} = <strong style="color: #8B4513; font-size: 1.1em;">${utilization.toFixed(4)}</strong> or <strong style="color: #8B4513; font-size: 1.1em;">${(utilization * 100).toFixed(2)}%</strong></p>`;
    html += '</div>';
    
    // 3. Individual Server Utilization
    html += '<div style="margin-bottom: 25px; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #8B4513;">';
    html += '<h4 style="color: #5C4033; margin-top: 0;">3. Individual Server Utilization</h4>';
    html += '<p style="margin: 5px 0;"><strong>Formula:</strong> Server Utilization = Total service time for that server ÷ Total run time</p>';
    html += `<p style="margin: 5px 0;"><strong>Step 1:</strong> Total run time = Time when last service ends = ${totalRunTime.toFixed(2)} minutes</p>`;
    
    for (let i = 0; i < numServers; i++) {
        const serverNum = i + 1;
        html += `<p style="margin: 5px 0;"><strong>Server ${serverNum}:</strong></p>`;
        html += `<p style="margin: 5px 0; padding-left: 20px;">- Total service time for Server ${serverNum} = ${serverServiceTime[i].toFixed(2)} minutes</p>`;
        html += `<p style="margin: 5px 0; padding-left: 20px;">- Utilization = ${serverServiceTime[i].toFixed(2)} ÷ ${totalRunTime.toFixed(2)} = <strong style="color: #8B4513; font-size: 1.1em;">${serverUtilizations[i].toFixed(4)}</strong> or <strong style="color: #8B4513; font-size: 1.1em;">${(serverUtilizations[i] * 100).toFixed(2)}%</strong></p>`;
    }
    html += '</div>';
    
    // Summary box
    html += '<div style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #F5E6D3 0%, #E6D5C3 100%); border-radius: 8px; border: 2px solid #8B4513;">';
    html += '<h3 style="color: #5C4033; margin-top: 0; text-align: center;">Summary of Results</h3>';
    html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-top: 15px;">';
    html += `<div><strong>Average waiting time:</strong> ${avgWaiting.toFixed(2)} minutes</div>`;
    html += `<div><strong>Overall server utilization:</strong> ${utilization.toFixed(4)} (${(utilization * 100).toFixed(2)}%)</div>`;
    for (let i = 0; i < numServers; i++) {
        html += `<div><strong>Server ${i + 1} utilization:</strong> ${serverUtilizations[i].toFixed(4)} (${(serverUtilizations[i] * 100).toFixed(2)}%)</div>`;
    }
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
    const distDiv = document.getElementById('distributionTables');
    if (tbody) tbody.innerHTML = '';
    if (resultsDiv) resultsDiv.innerHTML = '';
    if (distDiv) distDiv.innerHTML = '';
    
    const speedDiv = document.getElementById('speedInfo');
    if (speedDiv) speedDiv.classList.add('hidden');
    
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
            const s1Dist = readDistributionFromTable('tbodyS1');
            if (s1Dist.length > 0) {
                calculateServiceTable(1);
            }
        } catch (e) {
            // Silently ignore initialization errors
        }
        
        try {
            const s2Dist = readDistributionFromTable('tbodyS2');
            if (s2Dist.length > 0) {
                calculateServiceTable(2);
            }
        } catch (e) {
            // Silently ignore initialization errors
        }
    }, 100);
});

function displayDistributionTables() {
    const distDiv = document.getElementById('distributionTables');
    if (!distDiv) return;
    
    if (!arrivalTable || !s1Table || !s2Table) return;
    
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
    
    // Server 1 Service Time Distribution Table
    html += '<div class="table-container">';
    html += '<h3 style="color: #5C4033; margin-top: 0; margin-bottom: 15px; text-align: center; border-bottom: 2px solid #8B4513; padding-bottom: 10px;">Server 1 Service Time Distribution</h3>';
    html += '<table class="editable-table" style="width: 100%;">';
    html += '<thead><tr><th>Time</th><th>Probability</th><th>Cumulative</th><th>Random Number Range</th></tr></thead>';
    html += '<tbody>';
    
    for (const row of s1Table) {
        const interval = `${String(row.low).padStart(2, '0')}-${String(row.high).padStart(2, '0')}`;
        html += `<tr>
            <td>${row.time.toFixed(3)}</td>
            <td>${row.prob.toFixed(5)}</td>
            <td>${row.cum.toFixed(5)}</td>
            <td>${interval}</td>
        </tr>`;
    }
    
    html += '</tbody></table></div>';
    
    // Server 2 Service Time Distribution Table
    html += '<div class="table-container">';
    html += '<h3 style="color: #5C4033; margin-top: 0; margin-bottom: 15px; text-align: center; border-bottom: 2px solid #8B4513; padding-bottom: 10px;">Server 2 Service Time Distribution</h3>';
    html += '<table class="editable-table" style="width: 100%;">';
    html += '<thead><tr><th>Time</th><th>Probability</th><th>Cumulative</th><th>Random Number Range</th></tr></thead>';
    html += '<tbody>';
    
    for (const row of s2Table) {
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

async function downloadPDF() {
    document.body.classList.add("pdf-mode");

    const tableContainer = document.querySelector(".table-container");
    tableContainer.classList.remove("scrollable");

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

    pdf.save("MultiServer_LimitedCustomers_Report.pdf");

    tableContainer.classList.add("scrollable");
    document.body.classList.remove("pdf-mode");
}
