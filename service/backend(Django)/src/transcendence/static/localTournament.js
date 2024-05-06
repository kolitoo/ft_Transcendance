function tournamentLocal(){
    const pongElem = document.getElementById("pong");
    if (pongElem){
        pongElem.innerHTML = `
        <div id="play" class="text-center">
            <input id="inputPlayer1Username" type="text" class="form-control m-1" placeholder="${getTranslation("Player 1")}" data-placeHolder-translate="Player 1" required>
            <input id="inputPlayer2Username" type="text" class="form-control m-1" placeholder="${getTranslation("Player 2")}" data-placeHolder-translate="Player 2" required>
            <input id="inputPlayer3Username" type="text" class="form-control m-1" placeholder="${getTranslation("Player 3")}" data-placeHolder-translate="Player 3" required>
            <input id="inputPlayer4Username" type="text" class="form-control m-1" placeholder="${getTranslation("Player 4")}" data-placeHolder-translate="Player 4" required>
            <button type="button" class="btn btn-primary" onclick="tryStartTournament()">Start</button>
            <button class="btn btn-danger m-1" onclick="leaveQueue()">
                <i class="bi bi-box-arrow-left"></i>
            </button>
        </div>
        `;
    }
}

class LocalTournament{
    constructor(){
        this.player1Username;
        this.player2Username;
        this.player3Username;
        this.player4Username;

        this.Final1Username;
        this.Final2Username;
    }
}

let localTournament = new LocalTournament();

function win(str){
    if (!document.getElementById("tournoi"))
        return;

    let scoreEl = document.getElementById('score');
    let pongEl = document.getElementById('pong');
    if (!scoreEl || !pongEl)
        return;

    if (!localTournament.Final1Username){
        if (str === "left")
            localTournament.Final1Username = localTournament.player1Username;
        else if (str === "right")
            localTournament.Final1Username = localTournament.player2Username;

        scoreEl.innerHTML = "";
        pongEl.innerHTML = `<div id="play" class="text-light text-center"></div>`
        let play = document.getElementById("play");
        str = getTranslation("demi finale");
        play.innerHTML = `${str} : ${localTournament.player3Username} VS ${localTournament.player4Username}`;

        setTimeout(function() {
            playLocal(localTournament.player3Username, localTournament.player4Username);
        }, 1000);
    }
    else if (!localTournament.Final2Username){
        if (str === "left")
            localTournament.Final2Username = localTournament.player3Username;
        else if (str === "right")
            localTournament.Final2Username = localTournament.player4Username;

        scoreEl.innerHTML = "";
        pongEl.innerHTML = `<div id="play" class="text-light text-center"></div>`
        let play = document.getElementById("play");
        str = getTranslation("finale");
        play.innerHTML = `${str} : ${localTournament.Final1Username} VS ${localTournament.Final2Username}`;

        setTimeout(function() {
            playLocal(localTournament.Final1Username, localTournament.Final2Username);
        }, 1000);
    }
    else {
        tournoiEl = document.getElementById("tournoi");
        if (tournoiEl)
            tournoiEl.remove();

        scoreEl.innerHTML = "";
        pongEl.innerHTML = `<div id="play" class="text-light text-center"></div>`
        strWin = getTranslation("WINNER IS : ");
        let winnerName = null;
        if (str === "left")
            winnerName = localTournament.Final1Username;
        else if (str === "right")
            winnerName = localTournament.Final2Username;
        let play = document.getElementById("play");
        if (play)
            play.innerHTML = `${strWin}${winnerName}`;

        endLocalGame();
    }
}

function tryStartTournament(){
    let player1El = document.getElementById("inputPlayer1Username");
    let player2El = document.getElementById("inputPlayer2Username");
    let player3El = document.getElementById("inputPlayer3Username");
    let player4El = document.getElementById("inputPlayer4Username");
    if (!player1El || !player2El || !player3El || !player4El)
        return;
    if (player1El.value == "" || player1El.value == null || player2El.value == "" || player2El.value == null || player3El.value == "" || player3El.value == null || player4El.value == "" || player4El.value == null)
        return;

    localTournament = new LocalTournament();

    localTournament.player1Username = player1El.value;
    localTournament.player2Username = player2El.value;
    localTournament.player3Username = player3El.value;
    localTournament.player4Username = player4El.value;

    const main = document.getElementById("main");
    let tournoi = document.createElement("div");
    tournoi.setAttribute("id", "tournoi");
    if (main)
        main.prepend(tournoi);

    let scoreEl = document.getElementById('score');
    let pongEl = document.getElementById('pong');
    if (!scoreEl || !pongEl)
        return;
    scoreEl.innerHTML = "";
    pongEl.innerHTML = `<div id="play" class="text-light text-center"></div>`
    let play = document.getElementById("play");
    str = getTranslation("demi finale");
    play.innerHTML = `${str} : ${localTournament.player1Username} VS ${localTournament.player2Username}`;

    setTimeout(function() {
        playLocal(localTournament.player1Username, localTournament.player2Username);
    }, 1000);
}