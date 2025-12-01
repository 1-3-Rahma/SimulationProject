// Simulation state
let simulationData = {
    customerTable: [],
    server1Table: [],
    server2Table: [],
    limit: 0,
    limitType: '', // 'arrival' or 'end'
    randomMethod: '',
    lcgParams: null,
    midsquareSeed: null,
    manualRandomNumbers: [],
    currentStep: 0,
    currentCustomer: 0,
    needsArrivalRandom: false,
    needsServiceRandom: false,
    randomNumberIndex: 0,
    lcgState: null,
    midsquareState: null
};

let simulationResults = [];
let server1EndTime = 0;
let server2EndTime = 0;

// Initialize simulation
window.addEventListener('DOMContentLoaded', function() {
    loadSimulationData();
    initializeSimulation();
});

function loadSimulationData() {
    // Load limit
    simulationData.limit = parseInt(sessionStorage.getItem('simulationLimit')) || 0;
    
    // Determine limit type from simulation options
    const simulationOptionsStr = sessionStorage.getItem('simulationOptions');
    if (simulationOptionsStr) {
        const options = JSON.parse(simulationOptionsStr);
        if (options.multiServiceType === 'arrival') {
            simulationData.limitType = 'arrival';
        } else if (options.multiServiceType === 'end') {
            simulationData.limitType = 'end';
        }
    }
    
    // Load random method
    simulationData.randomMethod = sessionStorage.getItem('randomMethod') || 'Manual';
    
    // Load random number parameters
    const lcgParamsStr = sessionStorage.getItem('lcgParams');
    if (lcgParamsStr) {
        simulationData.lcgParams = JSON.parse(lcgParamsStr);
        simulationData.lcgState = simulationData.lcgParams.initial;
    }
    
    const midsquareSeed = sessionStorage.getItem('midsquareSeed');
    if (midsquareSeed) {
        simulationData.midsquareSeed = parseInt(midsquareSeed);
        simulationData.midsquareState = simulationData.midsquareSeed;
    }
    
    // Load table data from sessionStorage or reconstruct from page
    loadTableData();
}

function loadTableData() {
    // Try to load from sessionStorage first
    const customerTableStr = sessionStorage.getItem('customerTable');
    const server1TableStr = sessionStorage.getItem('server1Table');
    const server2TableStr = sessionStorage.getItem('server2Table');
    
    if (customerTableStr && server1TableStr && server2TableStr) {
        simulationData.customerTable = JSON.parse(customerTableStr);
        simulationData.server1Table = JSON.parse(server1TableStr);
        simulationData.server2Table = JSON.parse(server2TableStr);
    } else {
        // Reconstruct from previous page (would need to go back and get it)
        alert('Table data not found. Please go back and calculate tables first.');
        window.location.href = '../home.html';
    }
}

function initializeSimulation() {
    // Check if manual random numbers were already entered
    const storedManualNumbers = sessionStorage.getItem('randomNumbers');
    if (storedManualNumbers && simulationData.randomMethod === 'Manual') {
        simulationData.manualRandomNumbers = JSON.parse(storedManualNumbers);
    }
    
    // Create first customer row and process it
    addCustomerRow(1);
    processCustomer(1);
    
    // Show manual input if method is manual and need more numbers
    if (simulationData.randomMethod === 'Manual' && simulationData.manualRandomNumbers.length < 2) {
        document.getElementById('manualRandomInput').classList.remove('hidden');
        document.getElementById('currentStep').textContent = '1 (Service)';
    } else {
        document.getElementById('nextStepBtn').style.display = 'block';
    }
}

function addCustomerRow(customerNumber) {
    const tbody = document.getElementById('simulationTableBody');
    const row = document.createElement('tr');
    row.id = `customer_${customerNumber}`;
    
    // Customer number
    const customerCell = document.createElement('td');
    customerCell.textContent = customerNumber;
    row.appendChild(customerCell);
    
    // Random digits for arrival (-- for first customer)
    const arrivalRandCell = document.createElement('td');
    arrivalRandCell.id = `arrivalRand_${customerNumber}`;
    arrivalRandCell.textContent = customerNumber === 1 ? '--' : '-';
    row.appendChild(arrivalRandCell);
    
    // Time between arrivals
    const timeBetweenCell = document.createElement('td');
    timeBetweenCell.id = `timeBetween_${customerNumber}`;
    timeBetweenCell.textContent = customerNumber === 1 ? '0' : '-';
    row.appendChild(timeBetweenCell);
    
    // Clock time of arrival
    const clockTimeCell = document.createElement('td');
    clockTimeCell.id = `clockTime_${customerNumber}`;
    clockTimeCell.textContent = customerNumber === 1 ? '0' : '-';
    row.appendChild(clockTimeCell);
    
    // Random digits for service
    const serviceRandCell = document.createElement('td');
    serviceRandCell.id = `serviceRand_${customerNumber}`;
    serviceRandCell.textContent = '-';
    row.appendChild(serviceRandCell);
    
    // Server 1 columns
    const s1BeginCell = document.createElement('td');
    s1BeginCell.id = `s1Begin_${customerNumber}`;
    s1BeginCell.textContent = '-';
    row.appendChild(s1BeginCell);
    
    const s1ServiceTimeCell = document.createElement('td');
    s1ServiceTimeCell.id = `s1ServiceTime_${customerNumber}`;
    s1ServiceTimeCell.textContent = '-';
    row.appendChild(s1ServiceTimeCell);
    
    const s1EndCell = document.createElement('td');
    s1EndCell.id = `s1End_${customerNumber}`;
    s1EndCell.textContent = '-';
    row.appendChild(s1EndCell);
    
    // Server 2 columns
    const s2BeginCell = document.createElement('td');
    s2BeginCell.id = `s2Begin_${customerNumber}`;
    s2BeginCell.textContent = '-';
    row.appendChild(s2BeginCell);
    
    const s2ServiceTimeCell = document.createElement('td');
    s2ServiceTimeCell.id = `s2ServiceTime_${customerNumber}`;
    s2ServiceTimeCell.textContent = '-';
    row.appendChild(s2ServiceTimeCell);
    
    const s2EndCell = document.createElement('td');
    s2EndCell.id = `s2End_${customerNumber}`;
    s2EndCell.textContent = '-';
    row.appendChild(s2EndCell);
    
    // Time in queue
    const queueTimeCell = document.createElement('td');
    queueTimeCell.id = `queueTime_${customerNumber}`;
    queueTimeCell.textContent = '-';
    row.appendChild(queueTimeCell);
    
    tbody.appendChild(row);
}

function getRandomNumber() {
    if (simulationData.randomMethod === 'Manual') {
        // Return the next manual random number
        if (simulationData.randomNumberIndex < simulationData.manualRandomNumbers.length) {
            const num = simulationData.manualRandomNumbers[simulationData.randomNumberIndex];
            simulationData.randomNumberIndex++;
            return num;
        }
        return null; // Need user input
    } else if (simulationData.randomMethod === 'LCG') {
        // Generate next LCG number
        if (simulationData.lcgState === null) {
            simulationData.lcgState = simulationData.lcgParams.initial;
        }
        simulationData.lcgState = (simulationData.lcgParams.a * simulationData.lcgState + simulationData.lcgParams.c) % simulationData.lcgParams.m;
        return simulationData.lcgState / simulationData.lcgParams.m;
    } else if (simulationData.randomMethod === 'Mid-Square') {
        // Generate next Mid-Square number
        if (simulationData.midsquareState === null) {
            simulationData.midsquareState = simulationData.midsquareSeed;
        }
        const squared = simulationData.midsquareState * simulationData.midsquareState;
        let squaredStr = squared.toString();
        while (squaredStr.length < 8) {
            squaredStr = '0' + squaredStr;
        }
        const startIndex = Math.floor((squaredStr.length - 4) / 2);
        const middleDigits = squaredStr.substring(startIndex, startIndex + 4);
        simulationData.midsquareState = parseInt(middleDigits, 10);
        if (simulationData.midsquareState === 0) {
            throw new Error('Mid-Square seed became 0');
        }
        return simulationData.midsquareState / 10000;
    }
    return null;
}

function randomToTwoDigit(randomNum) {
    // Convert 0-1 random number to 00-99 (0-99)
    const digit = Math.floor(randomNum * 100);
    // Handle edge case: if exactly 1.0, return 99
    return digit === 100 ? 99 : digit;
}

function findTimeFromTable(randomDigit, table) {
    // Find which range the random digit falls into
    // Handle 00 as 100
    if (randomDigit === 0) randomDigit = 100;
    
    for (let i = 0; i < table.length; i++) {
        const range = table[i].randomDigits;
        if (range.includes('-')) {
            const parts = range.split('-');
            let start = parseInt(parts[0]);
            let end = parts[1] === '00' ? 100 : parseInt(parts[1]);
            
            if (start === 0) start = 100;
            
            if (randomDigit >= start && randomDigit <= end) {
                return table[i].time;
            }
        } else {
            const single = parseInt(range);
            const singleValue = single === 0 ? 100 : single;
            if (randomDigit === singleValue) {
                return table[i].time;
            }
        }
    }
    return table[table.length - 1].time; // Default to last
}

function processCustomer(customerNumber) {
    let arrivalRandom, serviceRandom;
    
    // Get random numbers
    if (customerNumber === 1) {
        arrivalRandom = null; // First customer has no arrival random
    } else {
        // Check if we already have arrival random for this customer
        const arrivalRandCell = document.getElementById(`arrivalRand_${customerNumber}`);
        if (arrivalRandCell && arrivalRandCell.textContent !== '-' && arrivalRandCell.textContent !== '--') {
            // Already processed, get from cell
            const arrivalDigit = parseInt(arrivalRandCell.textContent);
            arrivalRandom = arrivalDigit / 100;
        } else {
            arrivalRandom = getRandomNumber();
            if (arrivalRandom === null && simulationData.randomMethod === 'Manual') {
                // Need user input for arrival
                simulationData.currentCustomer = customerNumber;
                simulationData.needsArrivalRandom = true;
                simulationData.needsServiceRandom = false;
                document.getElementById('currentStep').textContent = `${customerNumber} (Arrival)`;
                document.getElementById('manualRandomInput').classList.remove('hidden');
                return false;
            }
        }
    }
    
    // Check if we already have service random for this customer
    const serviceRandCell = document.getElementById(`serviceRand_${customerNumber}`);
    if (serviceRandCell && serviceRandCell.textContent !== '-') {
        // Already processed, get from cell
        const serviceDigit = parseInt(serviceRandCell.textContent);
        serviceRandom = serviceDigit / 100;
    } else {
        serviceRandom = getRandomNumber();
        if (serviceRandom === null && simulationData.randomMethod === 'Manual') {
            // Need user input for service
            simulationData.currentCustomer = customerNumber;
            simulationData.needsArrivalRandom = false;
            simulationData.needsServiceRandom = true;
            document.getElementById('currentStep').textContent = `${customerNumber} (Service)`;
            document.getElementById('manualRandomInput').classList.remove('hidden');
            return false;
        }
    }
    
    // Calculate values
    let timeBetweenArrivals = 0;
    let clockTime = 0;
    
    if (customerNumber === 1) {
        clockTime = 0;
    } else {
        const arrivalDigit = randomToTwoDigit(arrivalRandom);
        timeBetweenArrivals = findTimeFromTable(arrivalDigit, simulationData.customerTable);
        const prevClockTime = parseFloat(document.getElementById(`clockTime_${customerNumber - 1}`).textContent);
        clockTime = prevClockTime + timeBetweenArrivals;
        
        // Update arrival random and time between
        document.getElementById(`arrivalRand_${customerNumber}`).textContent = String(arrivalDigit).padStart(2, '0');
        document.getElementById(`timeBetween_${customerNumber}`).textContent = timeBetweenArrivals.toFixed(2);
    }
    
    document.getElementById(`clockTime_${customerNumber}`).textContent = clockTime.toFixed(2);
    
    // Service time
    const serviceDigit = randomToTwoDigit(serviceRandom);
    const serviceTime1 = findTimeFromTable(serviceDigit, simulationData.server1Table);
    const serviceTime2 = findTimeFromTable(serviceDigit, simulationData.server2Table);
    
    document.getElementById(`serviceRand_${customerNumber}`).textContent = String(serviceDigit).padStart(2, '0');
    
    // Determine which server to use
    const s1Available = server1EndTime <= clockTime;
    const s2Available = server2EndTime <= clockTime;
    
    let serviceBegin, serviceTime, serviceEnd, queueTime;
    
    if (s1Available && s2Available) {
        // Both available, use server 1
        serviceBegin = clockTime;
        serviceTime = serviceTime1;
        serviceEnd = serviceBegin + serviceTime;
        queueTime = 0;
        
        document.getElementById(`s1Begin_${customerNumber}`).textContent = serviceBegin.toFixed(2);
        document.getElementById(`s1ServiceTime_${customerNumber}`).textContent = serviceTime.toFixed(2);
        document.getElementById(`s1End_${customerNumber}`).textContent = serviceEnd.toFixed(2);
        server1EndTime = serviceEnd;
    } else if (s1Available) {
        // Server 1 available
        serviceBegin = clockTime;
        serviceTime = serviceTime1;
        serviceEnd = serviceBegin + serviceTime;
        queueTime = 0;
        
        document.getElementById(`s1Begin_${customerNumber}`).textContent = serviceBegin.toFixed(2);
        document.getElementById(`s1ServiceTime_${customerNumber}`).textContent = serviceTime.toFixed(2);
        document.getElementById(`s1End_${customerNumber}`).textContent = serviceEnd.toFixed(2);
        server1EndTime = serviceEnd;
    } else if (s2Available) {
        // Server 2 available
        serviceBegin = clockTime;
        serviceTime = serviceTime2;
        serviceEnd = serviceBegin + serviceTime;
        queueTime = 0;
        
        document.getElementById(`s2Begin_${customerNumber}`).textContent = serviceBegin.toFixed(2);
        document.getElementById(`s2ServiceTime_${customerNumber}`).textContent = serviceTime.toFixed(2);
        document.getElementById(`s2End_${customerNumber}`).textContent = serviceEnd.toFixed(2);
        server2EndTime = serviceEnd;
    } else {
        // Both busy, use the one that finishes first
        if (server1EndTime <= server2EndTime) {
            serviceBegin = server1EndTime;
            serviceTime = serviceTime1;
            serviceEnd = serviceBegin + serviceTime;
            queueTime = serviceBegin - clockTime;
            
            document.getElementById(`s1Begin_${customerNumber}`).textContent = serviceBegin.toFixed(2);
            document.getElementById(`s1ServiceTime_${customerNumber}`).textContent = serviceTime.toFixed(2);
            document.getElementById(`s1End_${customerNumber}`).textContent = serviceEnd.toFixed(2);
            server1EndTime = serviceEnd;
        } else {
            serviceBegin = server2EndTime;
            serviceTime = serviceTime2;
            serviceEnd = serviceBegin + serviceTime;
            queueTime = serviceBegin - clockTime;
            
            document.getElementById(`s2Begin_${customerNumber}`).textContent = serviceBegin.toFixed(2);
            document.getElementById(`s2ServiceTime_${customerNumber}`).textContent = serviceTime.toFixed(2);
            document.getElementById(`s2End_${customerNumber}`).textContent = serviceEnd.toFixed(2);
            server2EndTime = serviceEnd;
        }
    }
    
    document.getElementById(`queueTime_${customerNumber}`).textContent = queueTime.toFixed(2);
    
    // Check stopping condition
    let shouldStop = false;
    if (simulationData.limitType === 'arrival') {
        if (clockTime >= simulationData.limit) {
            shouldStop = true;
        }
    } else if (simulationData.limitType === 'end') {
        if (serviceEnd >= simulationData.limit) {
            shouldStop = true;
        }
    }
    
    if (shouldStop) {
        document.getElementById('simulationStatus').textContent = 'Completed';
        document.getElementById('nextStepBtn').style.display = 'none';
        document.getElementById('manualRandomInput').classList.add('hidden');
        return true;
    }
    
    return true;
}

function processManualRandom() {
    const value = parseFloat(document.getElementById('manualRandomValue').value);
    if (isNaN(value) || value < 0 || value > 1) {
        alert('Please enter a valid random number between 0 and 1!');
        return;
    }
    
    simulationData.manualRandomNumbers.push(value);
    document.getElementById('manualRandomValue').value = '';
    document.getElementById('manualRandomInput').classList.add('hidden');
    
    // Continue processing the current customer
    const customerNumber = simulationData.currentCustomer;
    if (simulationData.needsArrivalRandom || simulationData.needsServiceRandom) {
        processCustomer(customerNumber);
    } else {
        nextStep();
    }
}

function nextStep() {
    const customerNumber = simulationResults.length + 1;
    addCustomerRow(customerNumber);
    
    const completed = processCustomer(customerNumber);
    if (completed) {
        simulationResults.push(customerNumber);
        if (document.getElementById('simulationStatus').textContent !== 'Completed') {
            if (simulationData.randomMethod === 'Manual') {
                document.getElementById('manualRandomInput').classList.remove('hidden');
            } else {
                document.getElementById('nextStepBtn').style.display = 'block';
            }
        }
    }
}

function exportResults() {
    // Export simulation results (implementation can be added)
    alert('Export functionality to be implemented');
}

