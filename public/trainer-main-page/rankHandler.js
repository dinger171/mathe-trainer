const additionbutton = document.getElementById("addition-rank");
const subtractionbutton = document.getElementById("subtraction-rank");
const multiplicationbutton = document.getElementById("multiplication-rank");
const divisionbutton = document.getElementById("division-rank");
const allbutton = document.getElementById("all-rank");

let type;

function setType(newType) {
    if (type === newType) return; // No change, do nothing
    type = newType;
    additionbutton.classList.remove("active");
    subtractionbutton.classList.remove("active");
    multiplicationbutton.classList.remove("active");
    divisionbutton.classList.remove("active");
    allbutton.classList.remove("active");

    switch (type) {
        case "addition":
            additionbutton.classList.add("active");
            localStorage.setItem("rankType", "addition");
            break;
        case "subtraction":
            subtractionbutton.classList.add("active");
            localStorage.setItem("rankType", "subtraction");
            break;
        case "multiplication":
            multiplicationbutton.classList.add("active");
            localStorage.setItem("rankType", "multiplication");
            break;
        case "division":
            divisionbutton.classList.add("active");
            localStorage.setItem("rankType", "division");
            break;
        default:
            allbutton.classList.add("active");
            localStorage.setItem("rankType", "all");
            break;
    }
    updateRankings()
    switch_audio.play(); // Play switch sound
}
localStorage.getItem("rankType") ? setType(localStorage.getItem("rankType")) : setType("all");
additionbutton.addEventListener("click", () => setType("addition"));
subtractionbutton.addEventListener("click", () => setType("subtraction"));
multiplicationbutton.addEventListener("click", () => setType("multiplication"));
divisionbutton.addEventListener("click", () => setType("division"));
allbutton.addEventListener("click", () => setType("all"));

function updateRankings() {
    const rankTable = document.querySelector(".ranking-content");
    rankTable.innerHTML = ""; // Clear previous rankings

    fetch(`/get-rankings?type=${type}&top=all`)
        .then(response => response.json())
        .then(data => {
            data.forEach((entry, index) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${entry.name}</td>
                    <td>${entry.score}</td>
                `;
                if (entry.isyou) {
                    row.style.backgroundColor = "#d4edda"; // Highlight current user
                }
                console.log(entry)
                rankTable.appendChild(row);
            });
        })
        .catch(error => console.error("Error fetching rankings:", error));
}
setInterval(updateRankings, 10000); // Update every 10 seconds