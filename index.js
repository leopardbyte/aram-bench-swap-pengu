 import utils from '../_utils'

async function rerollChampion(){
    await fetch("/lol-champ-select/v1/session/my-selection/reroll", {"method":"POST"})
    console.log("rerolled")
}

window.rerollChampion = rerollChampion

let isFunction1On = false;
let predefinedChampionIds = [222, 4, 203, 119, 29, 110, 22, 429, 18, 96, 51, 21, 133, 67, 518, 15, 17, 145]; // Replace with your champion IDs
let intervalId;

window.extraFunction1 = async function() {
    isFunction1On = !isFunction1On;
     
    if (isFunction1On) {
        // Start the interval
        intervalId = setInterval(async () => {
            // Check the game phase
            let gamePhaseResponse = await fetch("/lol-gameflow/v1/gameflow-phase");
            let gamePhase = await gamePhaseResponse.json();

            if (gamePhase !== "ChampSelect") {
                console.log("Not in ChampSelect phase, exiting function.");
                clearInterval(intervalId);
                
                document.getElementById("extraButton1").querySelector('lol-uikit-flat-button').innerHTML = "Switch On";
                isFunction1On = false;
                
                return;
            }

            // Get the champion IDs on the bench
            console.log(`Searching bench for predefinedID`)
            let response = await fetch("/lol-champ-select/v1/session");
            let data = await response.json();
            let benchChampionIds = data.benchChampions.map(champ => champ.championId);

            // Check if any of the predefined champion IDs are on the bench
            for (let id of predefinedChampionIds) {
                if (benchChampionIds.includes(id)) {
                    try {
                        await fetch(`/lol-champ-select/v1/session/bench/swap/${id}`, {"method":"POST"});
                        console.log(`Successfully swapped champion with ID ${id}`);
                        clearInterval(intervalId);
                        isFunction1On = false;
                        document.getElementById("extraButton1").querySelector('lol-uikit-flat-button').innerHTML = "Switch On";
                    } catch (error) {
                        console.error(`Failed to swap champion with ID ${id}: ${error}`);
                    }
                }
            }

        }, 500); // update bench every 0.5 seconds
    } else {
        clearInterval(intervalId);
    }
}

async function generateButtons(siblingDiv) {
    // Check the game phase first
    let gamePhaseResponse = await fetch("/lol-gameflow/v1/gameflow-phase");
    let gamePhase = await gamePhaseResponse.json();

    if (gamePhase === "ChampSelect") {
        const parentDiv = document.createElement("div")
        parentDiv.setAttribute("class", "switch-button-container")
        parentDiv.setAttribute("style", "position: absolute; right: 10px; bottom: 57px; display: flex; align-items: flex-end;")    //("style", "position: fixed; right: 10px; bottom: 57px; display: flex; align-items: flex-end; flex-direction: column;")

        
        const extraButton1Div = createButton("extraButton1", isFunction1On ? "Switch off" : "Switch ON", "window.extraFunction1()")
        parentDiv.appendChild(extraButton1Div);

        siblingDiv.parentNode.insertBefore(parentDiv, siblingDiv)
    }
}

function createButton(id, text, onclick) {
    const div = document.createElement("div");
    div.setAttribute("class", "button ember-view");
    div.setAttribute("onclick", onclick)
    div.setAttribute("id", id);

    const button = document.createElement("lol-uikit-flat-button");
    button.innerHTML = text;
    div.appendChild(button);

    if (id === "extraButton1") {
        div.onclick = function() {
            window.extraFunction1();
            div.querySelector('lol-uikit-flat-button').innerHTML = isFunction1On ? "Switch off" : "Switch on";
        }
    }

    return div;
}

let addButtonObserver = async (mutations) => {
    if (utils.phase == "ChampSelect" && document.querySelector(".bottom-right-buttons") && !document.querySelector(".switch-button-container")){
        await generateButtons(document.querySelector(".bottom-right-buttons"))
    }
}

window.addEventListener('load', () => {
    utils.routineAddCallback(addButtonObserver, ["bottom-right-buttons"])
    utils.addCss("//plugins/aram-bench-swap/assets/reroll_button.css")
})