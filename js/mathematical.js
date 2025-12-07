// ========== Tab Management ==========

let currentTab = 0;

function switchTab(tabIdx) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`tab${tabIdx}`).classList.add('active');
    document.querySelectorAll('.tab-btn')[tabIdx].classList.add('active');
    currentTab = tabIdx;
}

// ========== Performance Measures Calculation ==========

function calculatePerformanceMeasures() {
    const lambda = parseFloat(document.getElementById('lambda').value);
    const mu = parseFloat(document.getElementById('mu').value);
    
    // Validation
    if (isNaN(lambda) || lambda <= 0) {
        alert('Please enter a valid arrival rate (λ) greater than 0.');
        return;
    }
    
    if (isNaN(mu) || mu <= 0) {
        alert('Please enter a valid service rate (μ) greater than 0.');
        return;
    }
    
    if (mu <= lambda) {
        alert('Service rate (μ) must be greater than arrival rate (λ) for a stable system.');
        return;
    }
    
    // Calculate performance measures
    const Ls = lambda / (mu - lambda); // Expected number of customers in the system
    const Lq = (lambda * lambda) / (mu * (mu - lambda)); // Expected number of customers in the queue
    const Ws = 1 / (mu - lambda); // Expected time spent in the system
    const Wq = lambda / (mu * (mu - lambda)); // Expected time spent in the queue
    const R = (lambda / mu) * 100; // Server utilization (percentage)
    const R_proportion = lambda / mu; // Server utilization (proportion)
    const Po = 100 - R; // Probability of having no customer in the system (percentage)
    
    // Display results
    const resultsDiv = document.getElementById('performanceResults');
    let html = '<div style="background: #f9f9f9; padding: 20px; border-radius: 8px; border: 2px solid #D2B48C; margin-top: 30px;">';
    html += '<h3 style="color: #5C4033; margin-top: 0; border-bottom: 2px solid #8B4513; padding-bottom: 10px;">Performance Measures Results</h3>';
    
    // 1. Ls
    html += '<div style="margin-bottom: 25px; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #8B4513;">';
    html += '<h4 style="color: #5C4033; margin-top: 0;">1. Lₛ: Expected Number of Customers in the System</h4>';
    html += '<p style="margin: 5px 0;"><strong>Formula:</strong> Lₛ = λ / (μ - λ)</p>';
    html += `<p style="margin: 5px 0;"><strong>Calculation:</strong> Lₛ = ${lambda} / (${mu} - ${lambda}) = ${lambda} / ${(mu - lambda).toFixed(4)} = <strong style="color: #8B4513; font-size: 1.1em;">${Ls.toFixed(4)}</strong></p>`;
    html += '</div>';
    
    // 2. Lq
    html += '<div style="margin-bottom: 25px; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #8B4513;">';
    html += '<h4 style="color: #5C4033; margin-top: 0;">2. Lₑ: Expected Number of Customers in the Queue</h4>';
    html += '<p style="margin: 5px 0;"><strong>Formula:</strong> Lₑ = λ² / (μ × (μ - λ))</p>';
    html += `<p style="margin: 5px 0;"><strong>Calculation:</strong> Lₑ = ${lambda}² / (${mu} × (${mu} - ${lambda})) = ${(lambda * lambda).toFixed(4)} / ${(mu * (mu - lambda)).toFixed(4)} = <strong style="color: #8B4513; font-size: 1.1em;">${Lq.toFixed(4)}</strong></p>`;
    html += '</div>';
    
    // 3. Ws
    html += '<div style="margin-bottom: 25px; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #8B4513;">';
    html += '<h4 style="color: #5C4033; margin-top: 0;">3. Wₛ: Expected Time Spent in the System</h4>';
    html += '<p style="margin: 5px 0;"><strong>Formula:</strong> Wₛ = 1 / (μ - λ)</p>';
    html += `<p style="margin: 5px 0;"><strong>Calculation:</strong> Wₛ = 1 / (${mu} - ${lambda}) = 1 / ${(mu - lambda).toFixed(4)} = <strong style="color: #8B4513; font-size: 1.1em;">${Ws.toFixed(4)}</strong> time units</p>`;
    html += '</div>';
    
    // 4. Wq
    html += '<div style="margin-bottom: 25px; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #8B4513;">';
    html += '<h4 style="color: #5C4033; margin-top: 0;">4. Wₑ: Expected Time Spent in the Queue</h4>';
    html += '<p style="margin: 5px 0;"><strong>Formula:</strong> Wₑ = λ / (μ × (μ - λ))</p>';
    html += `<p style="margin: 5px 0;"><strong>Calculation:</strong> Wₑ = ${lambda} / (${mu} × (${mu} - ${lambda})) = ${lambda} / ${(mu * (mu - lambda)).toFixed(4)} = <strong style="color: #8B4513; font-size: 1.1em;">${Wq.toFixed(4)}</strong> time units</p>`;
    html += '</div>';
    
    // 5. R
    html += '<div style="margin-bottom: 25px; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #8B4513;">';
    html += '<h4 style="color: #5C4033; margin-top: 0;">5. R: Server Utilization</h4>';
    html += '<p style="margin: 5px 0;"><strong>Formula:</strong> R = (λ / μ) × 100</p>';
    html += `<p style="margin: 5px 0;"><strong>Calculation:</strong> R = (${lambda} / ${mu}) × 100 = ${R_proportion.toFixed(4)} × 100 = <strong style="color: #8B4513; font-size: 1.1em;">${R.toFixed(2)}%</strong></p>`;
    html += '</div>';
    
    // 6. Po
    html += '<div style="margin-bottom: 25px; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #8B4513;">';
    html += '<h4 style="color: #5C4033; margin-top: 0;">6. P₀: Probability of Having No Customer in the System</h4>';
    html += '<p style="margin: 5px 0;"><strong>Formula:</strong> P₀ = 100 - R</p>';
    html += `<p style="margin: 5px 0;"><strong>Calculation:</strong> P₀ = 100 - ${R.toFixed(2)} = <strong style="color: #8B4513; font-size: 1.1em;">${Po.toFixed(2)}%</strong></p>`;
    html += '</div>';
    
    // Summary box
    html += '<div style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #F5E6D3 0%, #E6D5C3 100%); border-radius: 8px; border: 2px solid #8B4513;">';
    html += '<h3 style="color: #5C4033; margin-top: 0; text-align: center;">Summary of Results</h3>';
    html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-top: 15px;">';
    html += `<div><strong>Lₛ (Expected customers in system):</strong> ${Ls.toFixed(4)}</div>`;
    html += `<div><strong>Lₑ (Expected customers in queue):</strong> ${Lq.toFixed(4)}</div>`;
    html += `<div><strong>Wₛ (Expected time in system):</strong> ${Ws.toFixed(4)}</div>`;
    html += `<div><strong>Wₑ (Expected time in queue):</strong> ${Wq.toFixed(4)}</div>`;
    html += `<div><strong>R (Server utilization):</strong> ${R.toFixed(2)}%</div>`;
    html += `<div><strong>P₀ (Probability of no customers):</strong> ${Po.toFixed(2)}%</div>`;
    html += '</div>';
    html += '</div>';
    
    html += '</div>';
    
    resultsDiv.innerHTML = html;
}

// ========== Probability Calculations ==========

function toggleProbabilityInput() {
    const probType = document.querySelector('input[name="probType"]:checked').value;
    const nInputGroup = document.getElementById('nInputGroup');
    
    if (probType === 'Pn') {
        nInputGroup.style.display = 'block';
    } else {
        nInputGroup.style.display = 'none';
    }
}

function calculateProbability() {
    const lambda = parseFloat(document.getElementById('lambdaProb').value);
    const mu = parseFloat(document.getElementById('muProb').value);
    const probType = document.querySelector('input[name="probType"]:checked').value;
    
    // Validation
    if (isNaN(lambda) || lambda <= 0) {
        alert('Please enter a valid arrival rate (λ) greater than 0.');
        return;
    }
    
    if (isNaN(mu) || mu <= 0) {
        alert('Please enter a valid service rate (μ) greater than 0.');
        return;
    }
    
    if (mu <= lambda) {
        alert('Service rate (μ) must be greater than arrival rate (λ) for a stable system.');
        return;
    }
    
    const R = lambda / mu; // Server utilization (proportion)
    const R_percent = R * 100; // Server utilization (percentage)
    
    const resultsDiv = document.getElementById('probabilityResults');
    let html = '<div style="background: #f9f9f9; padding: 20px; border-radius: 8px; border: 2px solid #D2B48C; margin-top: 30px;">';
    html += '<h3 style="color: #5C4033; margin-top: 0; border-bottom: 2px solid #8B4513; padding-bottom: 10px;">Probability Calculation Results</h3>';
    
    if (probType === 'P0') {
        // Calculate P0
        const Po = 100 - R_percent;
        const Po_proportion = 1 - R;
        
        html += '<div style="margin-bottom: 25px; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #8B4513;">';
        html += '<h4 style="color: #5C4033; margin-top: 0;">P₀: Probability of Having No Customer in the System</h4>';
        html += '<p style="margin: 5px 0;"><strong>Formula:</strong> P₀ = 100 - R</p>';
        html += `<p style="margin: 5px 0;"><strong>Step 1:</strong> Calculate R = (λ / μ) × 100 = (${lambda} / ${mu}) × 100 = ${R_percent.toFixed(2)}%</p>`;
        html += `<p style="margin: 5px 0;"><strong>Step 2:</strong> P₀ = 100 - ${R_percent.toFixed(2)} = <strong style="color: #8B4513; font-size: 1.1em;">${Po.toFixed(2)}%</strong></p>`;
        html += `<p style="margin: 5px 0; font-style: italic; color: #666;">As a proportion: P₀ = 1 - R = 1 - ${R.toFixed(4)} = <strong>${Po_proportion.toFixed(4)}</strong></p>`;
        html += '</div>';
        
        // Summary
        html += '<div style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #F5E6D3 0%, #E6D5C3 100%); border-radius: 8px; border: 2px solid #8B4513;">';
        html += '<h3 style="color: #5C4033; margin-top: 0; text-align: center;">Result</h3>';
        html += `<div style="text-align: center; font-size: 1.5em; color: #8B4513; font-weight: bold; margin-top: 15px;">P₀ = ${Po.toFixed(2)}%</div>`;
        html += '</div>';
        
    } else {
        // Calculate Pn
        const n = parseInt(document.getElementById('nCustomers').value);
        
        if (isNaN(n) || n < 0) {
            alert('Please enter a valid number of customers (n) that is 0 or greater.');
            return;
        }
        
        const Pn = Math.pow(R, n) * (1 - R);
        const Pn_percent = Pn * 100;
        
        html += '<div style="margin-bottom: 25px; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #8B4513;">';
        html += `<h4 style="color: #5C4033; margin-top: 0;">Pₙ: Probability of Having ${n} Customer(s) in the System</h4>`;
        html += '<p style="margin: 5px 0;"><strong>Formula:</strong> Pₙ = Rⁿ × (1 - R)</p>';
        html += `<p style="margin: 5px 0;"><strong>Step 1:</strong> Calculate R = λ / μ = ${lambda} / ${mu} = ${R.toFixed(4)}</p>`;
        html += `<p style="margin: 5px 0;"><strong>Step 2:</strong> Calculate Rⁿ = ${R.toFixed(4)}^${n} = ${Math.pow(R, n).toFixed(6)}</p>`;
        html += `<p style="margin: 5px 0;"><strong>Step 3:</strong> Calculate (1 - R) = 1 - ${R.toFixed(4)} = ${(1 - R).toFixed(4)}</p>`;
        html += `<p style="margin: 5px 0;"><strong>Step 4:</strong> Pₙ = ${Math.pow(R, n).toFixed(6)} × ${(1 - R).toFixed(4)} = <strong style="color: #8B4513; font-size: 1.1em;">${Pn.toFixed(6)}</strong> or <strong style="color: #8B4513; font-size: 1.1em;">${Pn_percent.toFixed(4)}%</strong></p>`;
        html += '</div>';
        
        // Summary
        html += '<div style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #F5E6D3 0%, #E6D5C3 100%); border-radius: 8px; border: 2px solid #8B4513;">';
        html += '<h3 style="color: #5C4033; margin-top: 0; text-align: center;">Result</h3>';
        html += `<div style="text-align: center; font-size: 1.5em; color: #8B4513; font-weight: bold; margin-top: 15px;">Pₙ = ${Pn.toFixed(6)} (${Pn_percent.toFixed(4)}%)</div>`;
        html += '</div>';
    }
    
    html += '</div>';
    
    resultsDiv.innerHTML = html;
}

// ========== Cost of Queuing Model ==========

function calculateCost() {
    const lambda = parseFloat(document.getElementById('lambdaCost').value);
    const mu = parseFloat(document.getElementById('muCost').value);
    const c1 = parseFloat(document.getElementById('c1').value);
    const c = parseInt(document.getElementById('numServersCost').value);
    const c2 = parseFloat(document.getElementById('c2').value);
    
    // Validation
    if (isNaN(lambda) || lambda <= 0) {
        alert('Please enter a valid arrival rate (λ) greater than 0.');
        return;
    }
    
    if (isNaN(mu) || mu <= 0) {
        alert('Please enter a valid service rate (μ) greater than 0.');
        return;
    }
    
    if (mu <= lambda) {
        alert('Service rate (μ) must be greater than arrival rate (λ) for a stable system.');
        return;
    }
    
    if (isNaN(c1) || c1 < 0) {
        alert('Please enter a valid cost of server (C₁) that is 0 or greater.');
        return;
    }
    
    if (isNaN(c) || c < 1) {
        alert('Please enter a valid number of servers (C) that is 1 or greater.');
        return;
    }
    
    if (isNaN(c2) || c2 < 0) {
        alert('Please enter a valid waiting time cost (C₂) that is 0 or greater.');
        return;
    }
    
    // Calculate Ls (expected number of customers in the system)
    const Ls = lambda / (mu - lambda);
    
    // Calculate total cost: T.C. = C₁ × C + C₂ × Lₛ
    const serverCost = c1 * c;
    const waitingCost = c2 * Ls;
    const totalCost = serverCost + waitingCost;
    
    // Display results
    const resultsDiv = document.getElementById('costResults');
    let html = '<div style="background: #f9f9f9; padding: 20px; border-radius: 8px; border: 2px solid #D2B48C; margin-top: 30px;">';
    html += '<h3 style="color: #5C4033; margin-top: 0; border-bottom: 2px solid #8B4513; padding-bottom: 10px;">Cost of Queuing Model Results</h3>';
    
    // Formula explanation
    html += '<div style="margin-bottom: 25px; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #8B4513;">';
    html += '<h4 style="color: #5C4033; margin-top: 0;">Formula: T.C. = C₁ × C + C₂ × Lₛ</h4>';
    html += '<p style="margin: 5px 0;"><strong>Where:</strong></p>';
    html += '<ul style="margin: 10px 0; padding-left: 20px; color: #6B4423;">';
    html += `<li><strong>C₁:</strong> Cost of the server = ${c1.toFixed(2)}</li>`;
    html += `<li><strong>C:</strong> Number of servers = ${c}</li>`;
    html += `<li><strong>C₂:</strong> Waiting time cost for customer = ${c2.toFixed(2)}</li>`;
    html += `<li><strong>Lₛ:</strong> Average number of customers in the system = ${Ls.toFixed(4)}</li>`;
    html += '</ul>';
    html += '</div>';
    
    // Step-by-step calculation
    html += '<div style="margin-bottom: 25px; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #8B4513;">';
    html += '<h4 style="color: #5C4033; margin-top: 0;">Step-by-Step Calculation</h4>';
    html += `<p style="margin: 5px 0;"><strong>Step 1:</strong> Calculate Lₛ = λ / (μ - λ) = ${lambda} / (${mu} - ${lambda}) = ${Ls.toFixed(4)}</p>`;
    html += `<p style="margin: 5px 0;"><strong>Step 2:</strong> Calculate C₁ × C = ${c1.toFixed(2)} × ${c} = <strong>${serverCost.toFixed(2)}</strong></p>`;
    html += `<p style="margin: 5px 0;"><strong>Step 3:</strong> Calculate C₂ × Lₛ = ${c2.toFixed(2)} × ${Ls.toFixed(4)} = <strong>${waitingCost.toFixed(2)}</strong></p>`;
    html += `<p style="margin: 5px 0;"><strong>Step 4:</strong> Calculate T.C. = ${serverCost.toFixed(2)} + ${waitingCost.toFixed(2)} = <strong style="color: #8B4513; font-size: 1.1em;">${totalCost.toFixed(2)}</strong></p>`;
    html += '</div>';
    
    // Summary box
    html += '<div style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #F5E6D3 0%, #E6D5C3 100%); border-radius: 8px; border: 2px solid #8B4513;">';
    html += '<h3 style="color: #5C4033; margin-top: 0; text-align: center;">Total Cost Result</h3>';
    html += '<div style="text-align: center; font-size: 2em; color: #8B4513; font-weight: bold; margin-top: 15px;">T.C. = ' + totalCost.toFixed(2) + '</div>';
    html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px;">';
    html += `<div><strong>Server Cost (C₁ × C):</strong> ${serverCost.toFixed(2)}</div>`;
    html += `<div><strong>Waiting Cost (C₂ × Lₛ):</strong> ${waitingCost.toFixed(2)}</div>`;
    html += `<div><strong>Lₛ (Avg customers in system):</strong> ${Ls.toFixed(4)}</div>`;
    html += '</div>';
    html += '</div>';
    
    html += '</div>';
    
    resultsDiv.innerHTML = html;
}

