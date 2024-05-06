function	keydown4(event) {
	if (!active)
		return;
	if (player_side == 3 || player_side == 4){
		if (event.which == 65 && !d[event.which] && pong4Websocket) {
			const jsonData = { type: "move", side: player_side, key: "left", event: "keydown"};
			const jsonString = JSON.stringify(jsonData);
			pong4Websocket.send(jsonString);
		}
		if (event.which == 68 && !d[event.which] && pong4Websocket) {
			const jsonData = { type: "move", side: player_side, key: "right", event: "keydown"};
			const jsonString = JSON.stringify(jsonData);
			pong4Websocket.send(jsonString);
		}
	}
	else {
		if (event.which == 87 && !d[event.which] && pong4Websocket) {
			const jsonData = { type: "move", side: player_side, key: "up", event: "keydown"};
			const jsonString = JSON.stringify(jsonData);
			pong4Websocket.send(jsonString);
		}
		if (event.which == 83 && !d[event.which] && pong4Websocket) {
			const jsonData = { type: "move", side: player_side, key: "down", event: "keydown"};
			const jsonString = JSON.stringify(jsonData);
			pong4Websocket.send(jsonString);
		}
	}
	d[event.which] = 1;
}

function	keyup4(event) {
	if (!active)
		return;
	if (player_side == 3 || player_side == 4){
		if (event.which == 65  && d[event.which] && pong4Websocket) {
			const jsonData = { type: "move", side: player_side, key: "left", event: "keyup"};
			const jsonString = JSON.stringify(jsonData);
			pong4Websocket.send(jsonString);
		}
		if (event.which == 68 && d[event.which] && pong4Websocket) {
			const jsonData = { type: "move", side: player_side, key: "right", event: "keyup"};
			const jsonString = JSON.stringify(jsonData);
			pong4Websocket.send(jsonString);
		}
	}
	else {
		if (event.which == 87  && d[event.which] && pong4Websocket) {
			const jsonData = { type: "move", side: player_side, key: "up", event: "keyup"};
			const jsonString = JSON.stringify(jsonData);
			pong4Websocket.send(jsonString);
		}
		if (event.which == 83 && d[event.which] && pong4Websocket) {
			const jsonData = { type: "move", side: player_side, key: "down", event: "keyup"};
			const jsonString = JSON.stringify(jsonData);
			pong4Websocket.send(jsonString);
		}
	}
	d[event.which] = 0;
}

function firstConnection4(data){
	active = data['active'];

	const player_left = document.getElementById("player1");
	if (player_left)
		player_left.textContent = data["left_username"];
	const player_right = document.getElementById("player2");
	if (player_right)
		player_right.textContent = data["right_username"];
	const player_top = document.getElementById("player3");
	if (player_top)
		player_top.textContent = data["top_username"];
	const player_bottom = document.getElementById("player4");
	if (player_bottom)
		player_bottom.textContent = data["bottom_username"];
	player_side = data["player_side"];

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

function playerMove4(data){
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
	else if (data['side'] === 3){
		playertopEl = document.getElementById("player_top");
		if (playertopEl)
			playertopEl.style.left = data['pos'] + "%";
	}
	else if (data['side'] === 4){
		playerbottomEl = document.getElementById("player_bottom");
		if (playerbottomEl)
			playerbottomEl.style.left = data['pos'] + "%";
	}
}

function ballMove4(data){
	ballEl = document.getElementById("ball4");
	if (ballEl){
		ballEl.style.left = parseFloat(data['left']) + "%";
		ballEl.style.top = parseFloat(data['top']) + "%";
	}
	if (data['movePlayer1'])
		playerMove4(data['movePlayer1']);
	if (data['movePlayer2'])
		playerMove4(data['movePlayer2']);
	if (data['movePlayer3'])
		playerMove4(data['movePlayer3']);
	if (data['movePlayer4'])
		playerMove4(data['movePlayer4']);
}

function endGame4(){
	document.body.removeEventListener("keydown", keydown4);
	document.body.removeEventListener("keyup", keyup4);

	if (document.getElementById("tournoi"))
		return;
	setTimeout(function() {
		mainEl = document.getElementById("main");
		if (mainEl){
			mainEl.innerHTML = `
			<div class="p-3">
				<div id="score" class="bg-black w-100 row fs-1 fw-bold text-white text-center m-0"></div>
				<div id="pong" class="ratio ratio-4x3 bg-black shadow">
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
				</div>
			</div>
			`
			if (mainEl.classList.contains("col-lg-5")){
				mainEl.classList.remove("col-lg-5");
			}
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

function pointScored4(data){
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
	else if (data['side'] === 3){
		topscoreEl = document.getElementById("top_score");
		if (topscoreEl)
			topscoreEl.innerText = data['points'];
	}
	else if (data['side'] === 4){
		bottomscoreEl = document.getElementById("bottom_score");
		if (bottomscoreEl)
			bottomscoreEl.innerText = data['points'];
	}
}

var pong4Websocket;

function pong4(room_id) {
	const jwtToken = localStorage.getItem('jwtToken');
	const id = encodeURIComponent(localStorage.getItem('userId'));
	const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
	const wsPath = `${wsProtocol}${window.location.host}/ws/pong4/${room_id}/?jwtToken=${jwtToken}&id=${id}`;
	pong4Websocket = new WebSocket(wsPath);

	pong4Websocket.onopen = function(){
		console.log("pong4Websocket opened");
	}

	pong4Websocket.onclose = function(){
		console.log("pong4Websocket closed");
	}

	pong4Websocket.onmessage = function(event) {
		const data = JSON.parse(event.data);

		if (data['type'] === "first_connection"){
			firstConnection4(data);
		}
		else if (data['type'] === 'player_move'){
			playerMove4(data);
		}
		else if (data['type'] === 'ball_move'){
			ballMove4(data);
		}
		else if (data['type'] === 'point'){
			pointScored4(data);
		}
		else if (data['type'] === 'end'){
			endGame4();
		}
		else{
			console.log("else");
			console.log(data);
		}
	};

};
