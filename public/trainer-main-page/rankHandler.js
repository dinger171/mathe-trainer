const additionbutton = document.getElementById("addition-rank");
const subtractionbutton = document.getElementById("subtraction-rank");
const multiplicationbutton = document.getElementById("multiplication-rank");
const divisionbutton = document.getElementById("division-rank");
const allbutton = document.getElementById("all-rank");

let type;

function setType(newType) {
    type = newType;
    additionbutton.classList.remove("active");
    subtractionbutton.classList.remove("active");
    multiplicationbutton.classList.remove("active");
    divisionbutton.classList.remove("active");
    allbutton.classList.remove("active");

    switch (type) {
        case "addition":
            additionbutton.classList.add("active");
            break;
        case "subtraction":
            subtractionbutton.classList.add("active");
            break;
        case "multiplication":
            multiplicationbutton.classList.add("active");
            break;
        case "division":
            divisionbutton.classList.add("active");
            break;
        default:
            allbutton.classList.add("active");
    }
    updateRankings()
}
setType("all"); // Default type
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