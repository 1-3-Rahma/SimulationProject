// Store selected options
let selectedOptions = {
    mainType: null,
    subOption: null,
    randomType: null,
    method: null,
    multiServiceType: null
};

function selectOption(type) {
    const sub = document.getElementById("subOptions");
    const randomDiv = document.getElementById("randomOptions");
    const generatedMethods = document.getElementById("generatedMethods");
    const summarySection = document.getElementById("summarySection");

    sub.innerHTML = "";
    sub.classList.add("hidden");
    randomDiv.classList.add("hidden");
    generatedMethods.classList.add("hidden");
    summarySection.classList.add("hidden");

    // Reset selections
    selectedOptions = {
        mainType: null,
        subOption: null,
        randomType: null,
        method: null,
        multiServiceType: null
    };

    if (type === "math") {
        window.location.href = "mathematical.html";
        return;
    }

    selectedOptions.mainType = type;

    if (type === "single") {
        sub.classList.remove("hidden");
        sub.innerHTML = `
            <h3>Single Server Options</h3>
            <button class="btn small" onclick="chooseSub('limited-customers')">Limited by Customer Number</button>
            <button class="btn small" onclick="chooseSub('limited-service')">Limited by Service Time</button>
        `;
    }

    if (type === "multiple") {
        sub.classList.remove("hidden");
        sub.innerHTML = `
            <h3>Multiple Server Options</h3>
            <button class="btn small" onclick="chooseSub('multi-customers')">Limited by Customer Number</button>
            <button class="btn small" onclick="chooseSub('multi-service')">Limited by Service Time</button>
        `;
    }

    if (type === "inventory") {
        alert("Redirect to inventory page (later)");
        return;
    }
}

function chooseSub(choice) {
    const randomDiv = document.getElementById("randomOptions");
    const generatedMethods = document.getElementById("generatedMethods");
    const summarySection = document.getElementById("summarySection");

    selectedOptions.subOption = choice;
    summarySection.classList.add("hidden");

    randomDiv.classList.remove("hidden");

    if (choice === "multi-service") {
        const sub = document.getElementById("subOptions");
        sub.innerHTML += `
            <button class="btn tiny" onclick="chooseMultiService('arrival')">Limitation in Arrival Time</button>
            <button class="btn tiny" onclick="chooseMultiService('end')">Limitation in Service Time Ends</button>
        `;
    }
}

function chooseMultiService(type) {
    selectedOptions.multiServiceType = type;
    updateSummary();
}

function selectRandom(type) {
    const generatedMethods = document.getElementById("generatedMethods");
    const summarySection = document.getElementById("summarySection");

    selectedOptions.randomType = type;
    selectedOptions.method = null; // Reset method when changing random type

    if (type === "generated") {
        generatedMethods.classList.remove("hidden");
        summarySection.classList.add("hidden");
    } else {
        generatedMethods.classList.add("hidden");
        updateSummary();
    }
}

function selectMethod(method) {
    selectedOptions.method = method;
    updateSummary();
}

function updateSummary() {
    const summarySection = document.getElementById("summarySection");
    const summaryText = document.getElementById("summaryText");

    // Check if we have enough selections to show summary
    if (!selectedOptions.mainType || !selectedOptions.subOption || !selectedOptions.randomType) {
        summarySection.classList.add("hidden");
        return;
    }

    // For multi-service, need multiServiceType
    if (selectedOptions.subOption === "multi-service" && !selectedOptions.multiServiceType) {
        summarySection.classList.add("hidden");
        return;
    }

    // For generated random, need method
    if (selectedOptions.randomType === "generated" && !selectedOptions.method) {
        summarySection.classList.add("hidden");
        return;
    }

    // Build summary text
    let summary = "";
    
    // Main type
    if (selectedOptions.mainType === "single") {
        summary += "• <strong>Server Type:</strong> Single Server<br>";
    } else if (selectedOptions.mainType === "multiple") {
        summary += "• <strong>Server Type:</strong> Multiple Server (2 Servers)<br>";
    }

    // Sub option
    if (selectedOptions.subOption === "limited-customers") {
        summary += "• <strong>Limitation:</strong> Limited by Customer Number<br>";
    } else if (selectedOptions.subOption === "limited-service") {
        summary += "• <strong>Limitation:</strong> Limited by Service Time<br>";
    } else if (selectedOptions.subOption === "multi-customers") {
        summary += "• <strong>Limitation:</strong> Limited by Customer Number<br>";
    } else if (selectedOptions.subOption === "multi-service") {
        summary += "• <strong>Limitation:</strong> Limited by Service Time<br>";
        if (selectedOptions.multiServiceType === "arrival") {
            summary += "• <strong>Service Type:</strong> Limitation in Arrival Time<br>";
        } else if (selectedOptions.multiServiceType === "end") {
            summary += "• <strong>Service Type:</strong> Limitation in Service Time Ends<br>";
        }
    }

    // Random type
    if (selectedOptions.randomType === "manual") {
        summary += "• <strong>Random Numbers:</strong> Manual Input<br>";
    } else if (selectedOptions.randomType === "generated") {
        summary += "• <strong>Random Numbers:</strong> Generated";
        if (selectedOptions.method) {
            summary += ` (${selectedOptions.method})`;
        }
        summary += "<br>";
    }

    summaryText.innerHTML = summary;
    summarySection.classList.remove("hidden");
}

function startSimulation() {
    // Check if all required options are selected
    if (!selectedOptions.mainType || !selectedOptions.subOption || !selectedOptions.randomType) {
        alert("Please complete all selections before starting!");
        return;
    }

    // For multi-service, need multiServiceType
    if (selectedOptions.subOption === "multi-service" && !selectedOptions.multiServiceType) {
        alert("Please complete all selections before starting!");
        return;
    }

    // For generated random, need method
    if (selectedOptions.randomType === "generated" && !selectedOptions.method) {
        alert("Please select a random number generation method!");
        return;
    }

    // Navigate based on selections
    // Multiple Server - Limited by Service Time
    if (selectedOptions.mainType === "multiple" && 
        selectedOptions.subOption === "multi-service") {

        // Store selections in sessionStorage for use in random number pages
        sessionStorage.setItem('simulationOptions', JSON.stringify(selectedOptions));

        if(selectedOptions.randomType === "manual"){
            window.location.href = "random/manualInput.html";
            return;
        }
        else{
            if(selectedOptions.multiServiceType === "arrival"){
                window.location.href = "multiple/multiLimitedServiceArrival.html";
                return;
            }
            else if (selectedOptions.multiServiceType === "end"){
                window.location.href = "multiple/multiLimitedServiceEnd.html";
                return;
            }
        }
    }




    // Multiple Server - Limited by Customer Number
    if (selectedOptions.mainType === "multiple" && 
        selectedOptions.subOption === "multi-customers") {
        
        // Store selections in sessionStorage for use in random number pages
        sessionStorage.setItem('simulationOptions', JSON.stringify(selectedOptions));
        
        // Navigate to random number input page based on selection
        if (selectedOptions.randomType === "manual") {
            window.location.href = "random/manualInput.html";
            return;
        } else if (selectedOptions.randomType === "generated") {
            if (selectedOptions.method === "LCG") {
                window.location.href = "random/LCG.html";
                return;
            } else if (selectedOptions.method === "Mid-Square") {
                window.location.href = "random/midSquare.html";
                return;
            }
        }
    }

    // Multiple Server - Limited by Service Time - Manual input
    if (selectedOptions.mainType === "multiple" && 
        selectedOptions.subOption === "multi-service" &&
        selectedOptions.randomType === "manual") {
        
        // Store selections in sessionStorage for use in random number pages
        sessionStorage.setItem('simulationOptions', JSON.stringify(selectedOptions));
        window.location.href = "random/manualInput.html";
        return;
    }
 

    console.log("Starting simulation with options:", selectedOptions);
    alert("Navigation for this combination is not yet implemented.\n\nSelected options:\n" + 
          document.getElementById("summaryText").textContent);
}
