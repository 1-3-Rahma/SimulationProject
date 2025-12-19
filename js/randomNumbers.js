// Random Number Generation Functions

// Apply the same approximation logic as manual random numbers
function applyDecimalApproximation(value) {
    // Convert to 0-100 scale
    let scaledValue = value * 100;

    // Round to nearest integer
    scaledValue = Math.round(scaledValue);

    return scaledValue;
}

function generateLCG(a, c, m, initialZ, count) {
    const results = [];
    let z = initialZ;

    for (let i = 0; i < count; i++) {
        z = (a * z + c) % m;
        // Normalize to 0-1 range, then apply approximation logic
        const normalizedValue = z / m;
        const approximatedValue = applyDecimalApproximation(normalizedValue);
        results.push(approximatedValue);
    }

    return results;
}

function generateMidSquare(seed, count) {
    const results = [];
    let current = seed;

    for (let i = 0; i < count; i++) {
        // Square the number
        const squared = current * current;

        // Extract middle 4 digits (assuming 4-digit seed)
        const squaredStr = squared.toString().padStart(8, '0');
        const middle = squaredStr.substring(2, 6);
        current = parseInt(middle, 10);

        // If we get 0, use a fallback seed
        if (current === 0) {
            current = (seed + i) % 10000;
        }

        // Normalize to 0-1 range, then apply approximation logic
        const normalizedValue = current / 10000;
        const approximatedValue = applyDecimalApproximation(normalizedValue);
        results.push(approximatedValue);
    }

    return results;
}

function generateRandomNumbers(method, params, count) {
    if (method === 'LCG') {
        return generateLCG(params.a, params.c, params.m, params.initialZ, count);
    } else if (method === 'MidSquare') {
        return generateMidSquare(params.seed, count);
    }
    throw new Error(`Unknown method: ${method}`);
}

