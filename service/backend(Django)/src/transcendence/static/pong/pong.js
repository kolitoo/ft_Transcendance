let player_side;
let player_name;

let d = {};

let active = false;

function	keydown(event) {
	if (!active)
		return;
	if (event.which == 87 && !d[event.which] && pongWebsocket) {
		const jsonData = { type: "move", side: player_side, key: "up", event: "keydown"};
		const jsonString = JSON.stringify(jsonData);
		pongWebsocket.send(jsonString);
	}
	if (event.which == 83 && !d[event.which] && pongWebsocket) {
		const jsonData = { type: "move", side: player_side, key: "down", event: "keydown"};
		const jsonString = JSON.stringify(jsonData);
		pongWebsocket.send(jsonString);
	}
	d[event.which] = 1;
}

function	keyup(event) {
	if (!active)
		return;
	if (event.which == 87  && d[event.which] && pongWebsocket) {
		const jsonData = { type: "move", side: player_side, key: "up", event: "keyup"};
		const jsonString = JSON.stringify(jsonData);
		pongWebsocket.send(jsonString);
	}
	if (event.which == 83 && d[event.which] && pongWebsocket) {
		const jsonData = { type: "move", side: player_side, key: "down", event: "keyup"};
		const jsonString = JSON.stringify(jsonData);
		pongWebsocket.send(jsonString);
	}
	d[event.which] = 0;
}

function firstConnection(data){
	active = data['active'];
	player_side = data["position"];
	//console.log(`player position : ${player_side}`);
	const player_id = "player" + data['position'].toString();
	const other_id = "player" + data['other_position'].toString();
	const player_element = document.getElementById(player_id);
	if (player_element)
		player_element.textContent = data["username"];
	const other_element = document.getElementById(other_id) ;
	if (other_element)
		other_element.textContent = data["other_username"];
	player_name = data["username"];

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
	var history_left = document.querySelectorAll('.history-left');
	if (history_left.length > 0) {
		history_left.forEach(function(element) {
		element.classList.add('disabled');
	});}
}

function updateOther(data){
	const player_id = player_side === 1 ? "player2" : "player1";
	const other_element = document.getElementById(player_id);
	if (other_element)
		other_element.textContent = data["username"];
}

function playerMove(data){
	if (data['side'] === 1){
		playerleftEl = document.getElementById("player_left");
		if (playerleftEl)
			playerleftEl.style.top = data['pos'] + "%";
	}
	else if (data['side'] === 2){
		playerrightEl = document.getElementById("player_right");
		if (playerrightEl)
			playerrightEl.style.top = data['pos'] + "%";
	}
}

function ballMove(data){
	ballEl = document.getElementById("ball");
	if (ballEl){
		ballEl.style.left = parseFloat(data['left']) + "%";
		ballEl.style.top = parseFloat(data['top']) + "%";
	}
	if (data['movePlayer1'])
		playerMove(data['movePlayer1']);
	if (data['movePlayer2'])
		playerMove(data['movePlayer2']);
}

function endGame(){
	document.body.removeEventListener("keydown", keydown);
	document.body.removeEventListener("keyup", keyup);

	if (document.getElementById("tournoi"))
		return;
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
	}, 3000);
}

function pointScored(data){
	if (data['side'] === 1){
		leftscoreEl = document.getElementById("left_score");
		if (leftscoreEl)
			leftscoreEl.innerText = data['points'];
	}
	else if (data['side'] === 2){
		rightscoreEl = document.getElementById("right_score");
		if (rightscoreEl)
			rightscoreEl.innerText = data['points'];
	}
}

var pongWebsocket;

function pong(room_id) {
	const jwtToken = localStorage.getItem('jwtToken');
	const id = encodeURIComponent(localStorage.getItem('userId'));
	const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
	const wsPath = `${wsProtocol}${window.location.host}/ws/pong/${room_id}/?jwtToken=${jwtToken}&id=${id}`;
	pongWebsocket = new WebSocket(wsPath);

	pongWebsocket.onopen = function(){
		console.log("pongWebsocket opened");
	}

	pongWebsocket.onclose = function(){
		console.log("pongWebsocket closed");
	}

	pongWebsocket.onmessage = function(event) {
		const data = JSON.parse(event.data);

		if (data['type'] === "first_connection"){
			firstConnection(data);
		}
		else if (data['type'] === 'update'){
			updateOther(data);
		}
		else if (data['type'] === 'player_move'){
			playerMove(data);
		}
		else if (data['type'] === 'ball_move'){
			ballMove(data);
		}
		else if (data['type'] === 'point'){
			pointScored(data);
		}
		else if (data['type'] === 'end'){
			endGame();
		}
		else{
			console.log("else");
			console.log(data);
		}
	};

};
