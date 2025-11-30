/**
 * Linear Congruential Generator (LCG)
 * Formula: Zi = (a * Zi-1 + c) mod m
 * 
 * @param {number} a - Multiplier
 * @param {number} c - Increment
 * @param {number} m - Modulus
 * @param {number} initialZ - Initial seed value (Z0)
 * @param {number} count - Number of random numbers to generate
 * @returns {Array<number>} Array of random numbers between 0 and 1
 */
function generateLCG(a, c, m, initialZ, count) {
    if (m <= 0) {
        throw new Error("Modulus (m) must be greater than 0");
    }
    if (count <= 0) {
        throw new Error("Count must be greater than 0");
    }

    const randomNumbers = [];
    let currentZ = initialZ;

    for (let i = 0; i < count; i++) {
        // Calculate next Z value: Zi = (a * Zi-1 + c) mod m
        currentZ = (a * currentZ + c) % m;
        
        // Normalize to [0, 1) range
        const normalizedValue = currentZ / m;
        randomNumbers.push(normalizedValue);
    }

    return randomNumbers;
}

/**
 * Mid-Square Method
 * Takes a 4-digit seed, squares it, takes the middle 4 digits as next seed
 * 
 * @param {number} seed - 4-digit seed (must be 4 digits)
 * @param {number} count - Number of random numbers to generate
 * @returns {Array<number>} Array of random numbers between 0 and 1
 */
function generateMidSquare(seed, count) {
    if (count <= 0) {
        throw new Error("Count must be greater than 0");
    }

    // Validate seed is 4 digits
    if (seed < 1000 || seed > 9999) {
        throw new Error("Seed must be a 4-digit number (1000-9999)");
    }

    const randomNumbers = [];
    let currentSeed = seed;

    for (let i = 0; i < count; i++) {
        // Square the current seed
        const squared = currentSeed * currentSeed;
        
        // Convert to string to extract middle digits
        let squaredStr = squared.toString();
        
        // Pad with zeros if necessary to ensure we can extract middle 4 digits
        while (squaredStr.length < 8) {
            squaredStr = '0' + squaredStr;
        }
        
        // Extract middle 4 digits
        const startIndex = Math.floor((squaredStr.length - 4) / 2);
        const middleDigits = squaredStr.substring(startIndex, startIndex + 4);
        
        // Convert back to number (this becomes the next seed)
        currentSeed = parseInt(middleDigits, 10);
        
        // Normalize to [0, 1) range
        const normalizedValue = currentSeed / 10000;
        randomNumbers.push(normalizedValue);
        
        // Prevent infinite loop if seed becomes 0
        if (currentSeed === 0) {
            throw new Error("Seed became 0, cannot continue. Try a different seed.");
        }
    }

    return randomNumbers;
}

/**
 * Get random numbers based on method type and parameters
 * This is a convenience function that routes to the appropriate generator
 * 
 * @param {string} method - 'LCG' or 'Mid-Square'
 * @param {Object} params - Parameters object
 * @param {number} params.a - For LCG: multiplier
 * @param {number} params.c - For LCG: increment
 * @param {number} params.m - For LCG: modulus
 * @param {number} params.initialZ - For LCG: initial seed
 * @param {number} params.seed - For Mid-Square: 4-digit seed
 * @param {number} count - Number of random numbers to generate
 * @returns {Array<number>} Array of random numbers
 */
function generateRandomNumbers(method, params, count) {
    if (method === 'LCG') {
        return generateLCG(params.a, params.c, params.m, params.initialZ, count);
    } else if (method === 'Mid-Square') {
        return generateMidSquare(params.seed, count);
    } else {
        throw new Error(`Unknown method: ${method}`);
    }
}

// Export functions for use in other modules (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateLCG,
        generateMidSquare,
        generateRandomNumbers
    };
}

