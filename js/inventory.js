let demandData = [];
let leadTimeData = [];
let pendingOrders = [];

function init() {
    demandData = [
        {demand: 0, prob: 0.10},
        {demand: 1, prob: 0.25},
        {demand: 2, prob: 0.35},
        {demand: 3, prob: 0.20},
        {demand: 4, prob: 0.10}
    ];
    
    leadTimeData = [
        {leadTime: 1, prob: 0.30},
        {leadTime: 2, prob: 0.50},
        {leadTime: 3, prob: 0.20}
    ];

    updateDemandTable();
    updateLeadTimeTable();
}

function getDecimalPlaces(data) {
    let maxDecimals = 0;
    data.forEach(item => {
        const probStr = item.prob.toString();
        if (probStr.includes('.')) {
            const decimals = probStr.split('.')[1].length;
            maxDecimals = Math.max(maxDecimals, decimals);
        }
    });
    return maxDecimals;
}

function goToStep(step) {
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`step${i}`).classList.add('hidden');
    }
    document.getElementById(`step${step}`).classList.remove('hidden');
}

function addPendingOrder() {
    const container = document.getElementById('pendingOrdersList');
    const index = pendingOrders.length;
    
    const div = document.createElement('div');
    div.className = 'pending-order-row';
    div.innerHTML = `
        <label>Units:</label>
        <input type="number" class="random-input" id="pendingUnits${index}" value="0" min="0">
        <label>Days Until Arrival:</label>
        <input type="number" class="random-input" id="pendingDays${index}" value="1" min="1">
        <button class="btn btn-secondary" onclick="removePendingOrder(${index})">Remove</button>
    `;
    container.appendChild(div);
    pendingOrders.push({index: index});
}

function removePendingOrder(index) {
    pendingOrders = pendingOrders.filter(o => o.index !== index);
    const container = document.getElementById('pendingOrdersList');
    Array.from(container.children).forEach((child, i) => {
        if (child.querySelector(`#pendingUnits${index}`)) {
            child.remove();
        }
    });
}

function addDemandRow() {
    demandData.push({demand: demandData.length, prob: 0});
    updateDemandTable();
}

function removeDemandRow(index) {
    demandData.splice(index, 1);
    updateDemandTable();
}

function addLeadTimeRow() {
    leadTimeData.push({leadTime: leadTimeData.length, prob: 0});
    updateLeadTimeTable();
}

function removeLeadTimeRow(index) {
    leadTimeData.splice(index, 1);
    updateLeadTimeTable();
}

function updateDemandTable() {
    const tbody = document.getElementById('demandTableBody');
    tbody.innerHTML = '';
    
    const decimalPlaces = getDecimalPlaces(demandData);
    const multiplier = Math.pow(10, decimalPlaces);
    
    let cumProb = 0;
    demandData.forEach((item, index) => {
        const prevCum = cumProb;
        cumProb += item.prob;
        
        let rangeStart = Math.round(prevCum * multiplier);
        let rangeEnd = Math.round(cumProb * multiplier);
        
        if (index === 0) {
            rangeStart = 1;
        } else {
            rangeStart = Math.round(prevCum * multiplier) + 1;
        }
        
        if (index === demandData.length - 1) {
            rangeEnd = multiplier;
        }
        
        let assignment = '';
        if (rangeStart <= rangeEnd) {
            const padLength = decimalPlaces;
            const startStr = String(rangeStart).padStart(padLength, '0');
            // For last row, if rangeEnd equals multiplier, it wraps to 0 (or 00, 000, etc.)
            let endStr;
            if (index === demandData.length - 1 && rangeEnd === multiplier) {
                endStr = '0'.repeat(padLength);
            } else {
                endStr = String(rangeEnd).padStart(padLength, '0');
            }
            assignment = `${startStr}-${endStr}`;
        }
        
        const row = tbody.insertRow();
        row.innerHTML = `
            <td><input type="number" value="${item.demand}" onchange="demandData[${index}].demand = parseFloat(this.value); updateDemandTable()"></td>
            <td><input type="number" step="0.01" value="${item.prob}" onchange="demandData[${index}].prob = parseFloat(this.value); updateDemandTable()"></td>
            <td>${cumProb.toFixed(2)}</td>
            <td>${assignment}</td>
            <td><button class="btn btn-secondary" onclick="removeDemandRow(${index})">Remove</button></td>
        `;
    });
}

function updateLeadTimeTable() {
    const tbody = document.getElementById('leadTimeTableBody');
    tbody.innerHTML = '';
    
    const decimalPlaces = getDecimalPlaces(leadTimeData);
    const multiplier = Math.pow(10, decimalPlaces);
    
    let cumProb = 0;
    leadTimeData.forEach((item, index) => {
        const prevCum = cumProb;
        cumProb += item.prob;
        
        let rangeStart = Math.round(prevCum * multiplier);
        let rangeEnd = Math.round(cumProb * multiplier);
        
        // For first row, start from 1 (or 01 for 2 decimals)
        if (index === 0) {
            rangeStart = 1;
        } else {
            rangeStart = Math.round(prevCum * multiplier) + 1;
        }
        
        // For last row, ensure it ends with 0 (or 00 for 2 decimals)
        if (index === leadTimeData.length - 1) {
            rangeEnd = multiplier;
        }
        
        let assignment = '';
        if (rangeStart <= rangeEnd) {
            const padLength = decimalPlaces;
            const startStr = String(rangeStart).padStart(padLength, '0');
            // For last row, if rangeEnd equals multiplier, it wraps to 0 (or 00, 000, etc.)
            let endStr;
            if (index === leadTimeData.length - 1 && rangeEnd === multiplier) {
                endStr = '0'.repeat(padLength);
            } else {
                endStr = String(rangeEnd).padStart(padLength, '0');
            }
            assignment = `${startStr}-${endStr}`;
        }
        const row = tbody.insertRow();
        row.innerHTML = `
            <td><input type="number" value="${item.leadTime}" onchange="leadTimeData[${index}].leadTime = parseFloat(this.value); updateLeadTimeTable()"></td>
            <td><input type="number" step="0.01" value="${item.prob}" onchange="leadTimeData[${index}].prob = parseFloat(this.value); updateLeadTimeTable()"></td>
            <td>${cumProb.toFixed(2)}</td>
            <td>${assignment}</td>
            <td><button class="btn btn-secondary" onclick="removeLeadTimeRow(${index})">Remove</button></td>
        `;
    });
}

function generateRandomInputs() {
    const numDemand = parseInt(document.getElementById('numDemandRandoms').value);
    const numLeadTime = parseInt(document.getElementById('numLeadTimeRandoms').value);
    
    const demandContainer = document.getElementById('demandRandoms');
    const leadTimeContainer = document.getElementById('leadTimeRandoms');
    
    demandContainer.innerHTML = '';
    leadTimeContainer.innerHTML = '';
    
    for (let i = 0; i < numDemand; i++) {
        demandContainer.innerHTML += `<input type="number" class="random-input" id="demandRand${i}" step="0.01" min="0" max="1" placeholder="0.${i}">`;
    }
    
    for (let i = 0; i < numLeadTime; i++) {
        leadTimeContainer.innerHTML += `<input type="number" class="random-input" id="leadTimeRand${i}" step="0.01" min="0" max="1" placeholder="0.${i}">`;
    }
}

function convertRandomToDigits(random) {
    if (random >= 0 && random < 1) {
        const str = random.toString();
        if (str.includes('.')) {
            const decimals = str.split('.')[1];
            if (decimals.length >= 2) {
                return parseInt(decimals.substring(0, 2));
            } else {
                return parseInt(decimals.substring(0, 1));
            }
        }
        return 0;
    }
    return Math.round(random);
}

function mapDigitsToValue(digits, distribution, isDemand) {
    const decimalPlaces = getDecimalPlaces(distribution);
    const multiplier = Math.pow(10, decimalPlaces);
    
    let cumProb = 0;
    for (let i = 0; i < distribution.length; i++) {
        const prevCum = cumProb;
        cumProb += distribution[i].prob;
        
        let rangeStart = Math.round(prevCum * multiplier);
        let rangeEnd = Math.round(cumProb * multiplier);
        
        if (i === 0) {
            rangeStart = 1;
        } else {
            rangeStart = Math.round(prevCum * multiplier) + 1;
        }
        
        if (i === distribution.length - 1) {
            rangeEnd = multiplier;
        }
        
        if (i === distribution.length - 1 && rangeEnd === multiplier) {
            if (digits === 0 || digits === rangeStart || (digits >= rangeStart && digits <= rangeEnd)) {
                return isDemand ? distribution[i].demand : distribution[i].leadTime;
            }
        } else {
            if (digits >= rangeStart && digits <= rangeEnd) {
                return isDemand ? distribution[i].demand : distribution[i].leadTime;
            }
        }
    }
    
    return isDemand ? distribution[distribution.length-1].demand : distribution[distribution.length-1].leadTime;
}

function readPendingOrdersFromDOM(){
    const container = document.getElementById('pendingOrdersList');
    const list = [];
    Array.from(container.children).forEach((child,i)=>{
        const unitsInput = child.querySelector(`#pendingUnits${i}`) || child.querySelector('input[type="number"]');
        const daysInput = child.querySelector(`#pendingDays${i}`) || child.querySelectorAll('input[type="number"]')[1];
        if(unitsInput && daysInput){
            const units = parseInt(unitsInput.value) || 0;
            const days = parseInt(daysInput.value) || 0;
            if(units>0 && days>=0) list.push({units:units, daysLeft: days});
        }
    });
    return list;
}

function runSimulation() {
    const M = parseInt(document.getElementById('stdInventory').value);
    const N = parseInt(document.getElementById('reviewLength').value);
    const cycles = parseInt(document.getElementById('numCycles').value);
    const startInv = parseInt(document.getElementById('startInventory').value);

    const ordersFromDOM = readPendingOrdersFromDOM();

    const numDemandRandoms = parseInt(document.getElementById('numDemandRandoms').value);
    const numLeadTimeRandoms = parseInt(document.getElementById('numLeadTimeRandoms').value);
    const demandRandoms = [];
    const leadTimeRandoms = [];
    
    for (let i = 0; i < numDemandRandoms; i++) {
        const dr = parseFloat(document.getElementById(`demandRand${i}`)?.value || 0);
        demandRandoms.push(isNaN(dr) ? 0 : dr);
    }
    for (let i = 0; i < numLeadTimeRandoms; i++) {
        const lr = parseFloat(document.getElementById(`leadTimeRand${i}`)?.value || 0);
        leadTimeRandoms.push(isNaN(lr) ? 0 : lr);
    }

    const tbody = document.getElementById('simulationTableBody');
    tbody.innerHTML = '';

    let beginInv = startInv;
    let shortage = 0;
    let demandRandomIndex = 0;
    let leadTimeRandomIndex = 0;
    
    // For first cycle, start with daysLeft - 1 for pending orders
    let activeOrders = ordersFromDOM.map(o=>({units:o.units, daysLeft:Math.max(0, o.daysLeft - 1)}));

    for (let cycle = 1; cycle <= cycles; cycle++) {
        for (let day = 1; day <= N; day++) {
            // Calculate days until arrival display BEFORE processing arrivals
            // This shows the current daysLeft value (including 0 when order arrives)
            // If daysLeft is negative, show "-" instead of 0
            let daysUntilArrivalDisplay = '-';
            if (activeOrders.length > 0) {
                const minDays = Math.min(...activeOrders.map(o => o.daysLeft));
                // If minDays is negative, show "-" (order should have arrived)
                if (minDays < 0) {
                    daysUntilArrivalDisplay = '-';
                } else {
                    daysUntilArrivalDisplay = minDays;
                }
            }
            
            // Check for arriving orders at the START of the day (when daysLeft <= 0)
            let arrivingUnits = 0;
            const remainingOrders = [];
            
            for (let order of activeOrders) {
                if (order.daysLeft < 0) {
                    arrivingUnits += order.units;
                } else {
                    remainingOrders.push(order);
                }
            }
            activeOrders = remainingOrders;

            // If order arrives at START of day, reduce shortage first (until shortage reaches 0)
            // Then add remaining order quantity to beginning inventory of CURRENT day
            if (arrivingUnits > 0) {
                if (shortage > 0) {
                    // Reduce shortage by order quantity (until shortage reaches 0)
                    const usedForShortage = Math.min(arrivingUnits, shortage);
                    shortage -= usedForShortage;
                    // Remaining order quantity goes to beginning inventory of current day
                    beginInv += arrivingUnits - usedForShortage;
                } else {
                    // No shortage, all order quantity goes to beginning inventory of current day
                    beginInv += arrivingUnits;
                }
            }

            // Process demand to calculate new shortage
            const demandRand = demandRandoms.length ? demandRandoms[demandRandomIndex % demandRandoms.length] : 0;
            const demandDigits = convertRandomToDigits(demandRand);
            const demand = mapDigitsToValue(demandDigits, demandData, true);
            demandRandomIndex++;

            let endInv = 0;
            let shortageIncrease = 0;

            if (beginInv === 0) {
                endInv = 0;
                shortageIncrease = demand;
            } else if (demand > beginInv) {
                shortageIncrease = demand - beginInv;
                endInv = 0;
            } else {
                endInv = beginInv - demand;
                shortageIncrease = 0;
            }

            // Shortage is cumulative: previous shortage + new shortage from demand
            shortage += shortageIncrease;

            let orderQty = '-';
            let leadTimeRandDisplay = '-';
            let newOrderInfo = null;

            // Check if we need to place an order at the end of this period
            if (day === N) {
                const orderAmount = M - endInv + shortage;
                if (orderAmount > 0) {
                    orderQty = orderAmount;
                    
                    const ltRand = leadTimeRandoms.length ? leadTimeRandoms[leadTimeRandomIndex % leadTimeRandoms.length] : 0;
                    const ltDigits = convertRandomToDigits(ltRand);
                    leadTimeRandDisplay = ltDigits;
                    const leadTime = mapDigitsToValue(ltDigits, leadTimeData, false);
                    
                    // Store the order info to add after displaying
                    newOrderInfo = {units: orderAmount, daysLeft: leadTime};
                    leadTimeRandomIndex++;
                    
                    // Update display to show the newly placed order's lead time immediately
                    daysUntilArrivalDisplay = leadTime;
                }
            }

            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${cycle}</td>
                <td>${day}</td>
                <td>${beginInv}</td>
                <td>${demandDigits.toString().padStart(2, '0')}</td>
                <td>${demand}</td>
                <td>${endInv}</td>
                <td>${shortage}</td>
                <td>${orderQty}</td>
                <td>${leadTimeRandDisplay}</td>
                <td>${daysUntilArrivalDisplay}</td>
            `;

            // Add new order after displaying (if one was placed)
            if (newOrderInfo !== null) {
                activeOrders.push(newOrderInfo);
            }

            // Decrement all active orders for next day (AFTER displaying)
            activeOrders.forEach(order => order.daysLeft -= 1);

            // Set beginning inventory for next day
            beginInv = endInv;
        }
    }

    goToStep(4);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    init();
});

