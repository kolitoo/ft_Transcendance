function makeLocalPongGame(){
    const score = document.getElementById("score");
    if (score){
        score.innerHTML =`
        <div id="player1" class="col-sm-5 overflow-hidden p-0" data-innerText-translate="Player 1">${getTranslation("Player 1")}</div>
        <div id="left_score" class="col-sm-1 overflow-hidden p-0">0</div>
        <div id="right_score" class="col-sm-1 overflow-hidden p-0">0</div>
        <div id="player2" class="col-sm-5 overflow-hidden p-0" data-innerText-translate="Player 2">${getTranslation("Player 2")}</div>
        `;
    }
    const pongElem = document.getElementById("pong");
    if (pongElem){
        pongElem.innerHTML = `
        <div id="pong_borders" class="border-top border-bottom border-5 border-white row no--bs-gutter-x m-0">
            <div class="col no--bs-gutter-x">
                <div id="player_left" class="bg-white float-start rounded"></div>
                <div id="localBall" class="nopadding bg-white rounded float-start"></div>
                <div id="player_right" class="bg-white float-end rounded"></div>
            </div>
        </div>`;
    }
    document.body.addEventListener("keydown", localKeydown);
    document.body.addEventListener("keyup", localKeyup);

    if (queuebutton)
        queuebutton.removeEventListener("click", addToQueue);
    if (tournamentbutton)
        tournamentbutton.removeEventListener("click", tournament);
    if (fourplayersbutton)
        fourplayersbutton.removeEventListener("click", fourPlayers);

    const   chat_menu_btn = document.getElementById('chatMenuButton');
    if (chat_menu_btn){
        if (!chat_menu_btn.classList.contains('collapsed')){
            chat_menu_btn.classList.add('collapsed');
            chat_menu_btn.ariaExpanded = false;
            const chat_menu = document.getElementById('chatMenu');
            if (chat_menu && chat_menu.classList.contains('show')){
                chat_menu.classList.remove('show');
            }
        }
        chat_menu_btn.classList.add('disabled');
    }

    const   dropdown_el = document.getElementById("account_dropdown");
    if (dropdown_el){
        if (dropdown_el.classList.contains('show')){
            dropdown_el.classList.remove('show');
            dropdown_el.ariaExpanded = false;
            const dropdownMenu_el = dropdown_el.closest('#dropdown-menu');
            if (dropdownMenu_el && dropdownMenu_el.classList.contains('show')){
                dropdownMenu_el.classList.remove('show');
                dropdownMenu_el.removeAttribute('data-bs-popper');
            }
        }
        dropdown_el.classList.add('disabled');
    }
    //     const   history_left = document.getElementById("history_left");
    var history_left = document.querySelectorAll('.history-left');
    if (history_left.length > 0) {
	history_left.forEach(function(element) {
		element.classList.add('disabled');
	});}


    sendDataToSocket('update_user_status', {status : 'in game'});
}

function endLocalGame(){
    if (document.getElementById("tournoi"))
        return;

    document.body.removeEventListener("keydown", localKeydown);
    document.body.removeEventListener("keyup", localKeyup);

    setTimeout(function() {
        scoreEl = document.getElementById("score");
        if (scoreEl)
            scoreEl.innerHTML = "";
        pongEl = document.getElementById("pong");
        if (pongEl){
            pongEl.innerHTML = `
            <div class="position-absolute top-0 end-0" style="left: unset; width: unset;">
                <div class="d-flex">
                    <div class="form-text text-white m-1" data-innerText-translate="Server">${getTranslation("Server")}</div>
                    <div class="form-check form-switch form-check-inline m-1">
                        <input id="toggleLocal" class="form-check-input form-check-inline m-0" type="checkbox" onchange="toggleServerLocal(this)">
                    </div>
                    <div class="form-text text-white m-1" data-innerText-translate="Local">${getTranslation("Local")}</div>
                </div>
            </div>
            <div id="play" class="text-light text-center collapse show">
                <div id="queue_button" class="btn" type="button" style="font-size: 4rem;"><i class="bi bi-shuffle text-light"></i></div>
                <div id="tournament_button" class="btn" type="button" style="font-size: 4rem;"><i class="bi bi-trophy-fill text-light"></i></div>
                <div id="four_players_button" class="btn" type="button" style="font-size: 4rem;"><i class="bi bi-4-circle-fill text-light"></i></div>
            </div>
            <div id="localPlay" class="text-light text-center collapse">
                <div id="localGame" class="btn" type="button" style="font-size: 4rem;" onclick="playLocal(null, null)"><i class="bi bi-play-circle-fill text-light"></i></div>
                <div id="localTournament" class="btn" type="button" style="font-size: 4rem;" onclick="tournamentLocal()"><i class="bi bi-trophy-fill text-light"></i></div>
            </div>
            `;
        }
        queuebutton = document.getElementById("queue_button");
        if (queuebutton)
            queuebutton.addEventListener("click", addToQueue);
        tournamentbutton = document.getElementById("tournament_button");
        if (tournamentbutton)
            tournamentbutton.addEventListener("click", tournament);
        fourplayersbutton = document.getElementById("four_players_button");
        if (fourplayersbutton)
            fourplayersbutton.addEventListener("click", fourPlayers);

        const   chat_menu_btn = document.getElementById('chatMenuButton');
        if (chat_menu_btn){
            if (chat_menu_btn.classList.contains('disabled')){
                chat_menu_btn.classList.remove('disabled');
            }
        }
        const   dropdown_el = document.getElementById("account_dropdown");
        if (dropdown_el){
            if (dropdown_el.classList.contains('disabled')){
                dropdown_el.classList.remove('disabled');
            }
        }
	var history_left = document.querySelectorAll('.history-left');
	if (history_left.length > 0) {
		history_left.forEach(function(element) {
		if (element.classList.contains('disabled')) {
			element.classList.remove('disabled');
		}
	});
}
        sendDataToSocket('update_user_status', {status : 'online'});
    }, 3000);
}
class Local{
    constructor(){
        this.pointsLeft = 0;
        this.pointsRight = 0;
        this.ballXY = {};
        this.posBall = {};
        this.posleft = 50;
        this.posRight = 50;
        this.pongRefreshIntervalId = null;
        this.d = {};
    }
}

let local = new Local();

function    localKeydown(event) {
    local.d[event.which] = true;
}

function    localKeyup(event) {
    local.d[event.which] = false;
}

function init(){
    local.d = {};
    local.pointsLeft = 0;
    local.pointsRight = 0;
    local.ballXY = {};
    local.posBall = [50,50];
    local.posleft = 50;
    local.posRight = 50;

    Math.floor(Math.random() * 2) == 0 ? local.ballXY[0] = 1 : local.ballXY[0] = -1;
    local.ballXY[1] = Math.random() - 0.5;
}

function reset(){
    local.posBall = [50,50];
    ballEl = document.getElementById("localBall");
    if (ballEl){
        ballEl.style.left = local.posBall[0];
        ballEl.style.top = local.posBall[1];
    }
    local.posleft = 50;
    playerLeftEl = document.getElementById("player_left");
    if (playerLeftEl)
        playerLeftEl.style.top = local.posleft;
    local.posRight = 50;
    playerRightEl = document.getElementById("player_right");
    if (playerRightEl)
        playerRightEl.style.top = local.posRight;
}

function scoreRight(){
    if (local.pongRefreshIntervalId){
        clearInterval(local.pongRefreshIntervalId);
        local.pongRefreshIntervalId = null;
    }
    scoreRightEl = document.getElementById("right_score");
    if (scoreRightEl){
        local.pointsRight += 1;
        scoreRightEl.innerText = local.pointsRight;
    }
    local.ballXY[0] = -1;
    local.ballXY[1] = Math.random() - 0.5;
    reset();
    if (local.pointsRight >= 10){
        win("right");
        endLocalGame();
        return;
    }
    if (!local.pongRefreshIntervalId)
        local.pongRefreshIntervalId = setInterval(pongLoop, 17);
}

function scoreLeft(){
    if (local.pongRefreshIntervalId){
        clearInterval(local.pongRefreshIntervalId);
        local.pongRefreshIntervalId = null;
    }
    scoreLeftEl = document.getElementById("left_score");
    if (scoreLeftEl){
        local.pointsLeft += 1;
        scoreLeftEl.innerText = local.pointsLeft;
    }
    local.ballXY[0] = 1;
    local.ballXY[1] = Math.random() - 0.5;
    reset();
    if (local.pointsLeft >= 10){
        win("left");
        endLocalGame();
        return;
    }
    if (!local.pongRefreshIntervalId)
    local.pongRefreshIntervalId = setInterval(pongLoop, 17);
}

function leftPaddleHitbox(){
    if (local.posBall[0] <= 1.5 && local.posleft - 5 <= local.posBall[1] + 0.5 && local.posleft + 5 >= local.posBall[1] - 0.5){
        local.ballXY[0] *= -1;
        local.ballXY[1] = (local.posBall[1] - local.posleft) / 11;
    }
    else if (local.posBall[0] < 0.5)
        scoreRight();
}

function rightPaddleHitbox(){
    if (local.posBall[0] >= 98.5 && local.posRight - 5 <= local.posBall[1] + 0.5 && local.posRight + 5 >= local.posBall[1] - 0.5){
        local.ballXY[0] *= -1;
        local.ballXY[1] = (local.posBall[1] - local.posRight) / 11;
    }
    else if (local.posBall[0] > 99.5)
        scoreLeft();
}

function moveBall(){
    ballEl = document.getElementById("localBall");
    if (!ballEl)
        return;

    local.posBall[0] += local.ballXY[0];
    ballEl.style.left = local.posBall[0] + '%';
    if (local.ballXY[0] < 0)
        leftPaddleHitbox();
    else if (local.ballXY[0] > 0)
        rightPaddleHitbox();

    local.posBall[1] += local.ballXY[1];
    ballEl.style.top = local.posBall[1] + '%';
    if ((local.ballXY[1] < 0 && local.posBall[1] + local.ballXY[1] < 0.5) || (local.ballXY[1] > 0 && local.posBall[1] + local.ballXY[1] > 99.5)) // collision Y
        local.ballXY[1] *= -1;
}

function movePlayer(){
    playerLeftEl = document.getElementById("player_left");
    if (!playerLeftEl)
        return;
    if (local.d[87] && !local.d[83] && local.posleft - 1 >= 5)
        local.posleft -= 1;
    if (local.d[83] && !local.d[87] && local.posleft + 1 <= 95)
        local.posleft += 1;
    playerLeftEl.style.top = local.posleft + '%';

    playerRightEl = document.getElementById("player_right");
    if (!playerRightEl)
        return;
    if (local.d[73] && !local.d[75] && local.posRight - 1 >= 5)
        local.posRight -= 1;
    if (local.d[75] && !local.d[73] && local.posRight + 1 <= 95)
        local.posRight += 1;
    playerRightEl.style.top = local.posRight + '%';
}

function pongLoop(){
    moveBall();
    movePlayer();
}

function playLocal(player1, player2){
    makeLocalPongGame();
    init();

    playerLeftEl = document.getElementById("player1");
    if (player1 && playerLeftEl)
        playerLeftEl.innerText = player1;
    playerRightEl = document.getElementById("player2");
    if (player2 && playerRightEl)
        playerRightEl.innerText = player2;

    if (local.pongRefreshIntervalId){
        clearInterval(local.pongRefreshIntervalId);
        local.pongRefreshIntervalId = null;
    }
    if (document.getElementById("player1"))
        local.pongRefreshIntervalId = setInterval(pongLoop, 17);
}