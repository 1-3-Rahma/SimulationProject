function parseNumbers(input) {
    return input.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));
}

function calculateMean() {
    const input = document.getElementById('meanInput').value;
    const numbers = parseNumbers(input);
    const resultDiv = document.getElementById('meanResult');
    
    if (numbers.length === 0) {
        resultDiv.textContent = 'Please enter valid numbers!';
        resultDiv.className = 'result';
        resultDiv.style.background = '#ffebee';
        resultDiv.style.color = '#c62828';
        return;
    }
    
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    resultDiv.textContent = `Mean = ${mean.toFixed(4)}`;
    resultDiv.className = 'result';
    resultDiv.style.background = '#e8f5e9';
    resultDiv.style.color = '#2e7d32';
}

function calculateStdDev() {
    const input = document.getElementById('stdInput').value;
    const numbers = parseNumbers(input);
    const resultDiv = document.getElementById('stdResult');
    
    if (numbers.length === 0) {
        resultDiv.textContent = 'Please enter valid numbers!';
        resultDiv.className = 'result';
        resultDiv.style.background = '#ffebee';
        resultDiv.style.color = '#c62828';
        return;
    }
    
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
    const stdDev = Math.sqrt(variance);
    
    resultDiv.textContent = `Standard Deviation = ${stdDev.toFixed(4)}`;
    resultDiv.className = 'result';
    resultDiv.style.background = '#e8f5e9';
    resultDiv.style.color = '#2e7d32';
}

function calculateProbability() {
    const favorable = parseFloat(document.getElementById('favorable').value);
    const total = parseFloat(document.getElementById('total').value);
    const resultDiv = document.getElementById('probResult');
    
    if (isNaN(favorable) || isNaN(total) || total === 0) {
        resultDiv.textContent = 'Please enter valid numbers!';
        resultDiv.className = 'result';
        resultDiv.style.background = '#ffebee';
        resultDiv.style.color = '#c62828';
        return;
    }
    
    const probability = favorable / total;
    resultDiv.textContent = `Probability = ${probability.toFixed(4)} (${(probability * 100).toFixed(2)}%)`;
    resultDiv.className = 'result';
    resultDiv.style.background = '#e8f5e9';
    resultDiv.style.color = '#2e7d32';
}

function calculateLittlesLaw() {
    const arrivalRate = parseFloat(document.getElementById('arrivalRate').value);
    const avgTime = parseFloat(document.getElementById('avgTime').value);
    const resultDiv = document.getElementById('littlesResult');
    
    if (isNaN(arrivalRate) || isNaN(avgTime)) {
        resultDiv.textContent = 'Please enter valid numbers!';
        resultDiv.className = 'result';
        resultDiv.style.background = '#ffebee';
        resultDiv.style.color = '#c62828';
        return;
    }
    
    const avgNumber = arrivalRate * avgTime;
    resultDiv.textContent = `Average Number in System (L) = ${avgNumber.toFixed(4)}`;
    resultDiv.className = 'result';
    resultDiv.style.background = '#e8f5e9';
    resultDiv.style.color = '#2e7d32';
}

function calculateUtilization() {
    const arrivalRate = parseFloat(document.getElementById('utilArrival').value);
    const serviceRate = parseFloat(document.getElementById('serviceRate').value);
    const resultDiv = document.getElementById('utilResult');
    
    if (isNaN(arrivalRate) || isNaN(serviceRate) || serviceRate === 0) {
        resultDiv.textContent = 'Please enter valid numbers!';
        resultDiv.className = 'result';
        resultDiv.style.background = '#ffebee';
        resultDiv.style.color = '#c62828';
        return;
    }
    
    const utilization = arrivalRate / serviceRate;
    if (utilization > 1) {
        resultDiv.textContent = `Utilization = ${utilization.toFixed(4)} (Warning: > 1, system is unstable!)`;
        resultDiv.style.background = '#fff3e0';
        resultDiv.style.color = '#e65100';
    } else {
        resultDiv.textContent = `Utilization (ρ) = ${utilization.toFixed(4)} (${(utilization * 100).toFixed(2)}%)`;
        resultDiv.style.background = '#e8f5e9';
        resultDiv.style.color = '#2e7d32';
    }
    resultDiv.className = 'result';
}

