function selectOption(type) {
    const sub = document.getElementById("subOptions");
    const randomDiv = document.getElementById("randomOptions");
    const generatedMethods = document.getElementById("generatedMethods");

    sub.innerHTML = "";
    sub.classList.add("hidden");
    randomDiv.classList.add("hidden");
    generatedMethods.classList.add("hidden");

    if (type === "math") {
        window.location.href = "mathematical.html";
        return;
    }

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

    randomDiv.classList.remove("hidden");

    if (choice === "multi-service") {
        const sub = document.getElementById("subOptions");
        sub.innerHTML += `
            <button class="btn tiny" onclick="chooseMultiService('arrival')">Limitation in Arrival Time</button>
            <button class="btn tiny" onclick="chooseMultiService('end')">Limitation in Service Time Ends</button>
        `;
    }
}

function selectRandom(type) {
    const generatedMethods = document.getElementById("generatedMethods");

    if (type === "generated") generatedMethods.classList.remove("hidden");
    else generatedMethods.classList.add("hidden");
}
