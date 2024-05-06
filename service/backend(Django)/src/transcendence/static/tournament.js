let is_owner = false;

let tournamentWebsocket;

function return_to_main(){
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
	let queuebutton = document.getElementById("queue_button");
	if (queuebutton)
		queuebutton.addEventListener("click", addToQueue);
	let tournamentbutton = document.getElementById("tournament_button");
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
}

function start_tournament(){
	const JSONdata = {"owner" : is_owner, "start" : true};
	const JSONstring = JSON.stringify(JSONdata);
	tournamentWebsocket.send(JSONstring);
}

function tournament_info(data){
	is_owner = data['owner'];
	let play = document.getElementById('play');
	if (play)
		play.innerHTML = '';
	const main = document.getElementById("main");
	let tournoi = document.createElement("div");
	tournoi.setAttribute("id", "tournoi");
	if (main)
		main.prepend(tournoi);
	if (is_owner){
		str = getTranslation("You are the owner of the tournament")
		play.innerHTML += `<div id="tournament_text" class="text-center" data-innerText-translate="You are the owner of the tournament">${str}</div><div id="tournament_pos" class="text-center"></div>`;
		play.innerHTML += '<button id="tournament_start" class="btn btn-primary rounded"><i class="bi bi-play-circle-fill"></i></button><button id="leaveQueueButton" class="btn btn-danger m-1" onclick="leaveQueue()"><i class="bi bi-box-arrow-left"></i></button>';
		start = document.getElementById("tournament_start");
		if (start)
			start.addEventListener("click", start_tournament);
	} else {
		str1 = getTranslation("You are a guest of ")
		str2 = getTranslation("'s tournament")
		play.innerHTML = `<div id="tournament_text" class="text-center" data-guest-translate="${data['owner_name']}">${str1}${data['owner_name']}${str2}</div><div id="tournament_pos" class="text-center"></div><button id="leaveQueueButton" class="btn btn-danger m-1" onclick="leaveQueue()"><i class="bi bi-box-arrow-left"></i></button>`;
	}
}

function tournament_update(data){
	const element = document.getElementById("tournament_pos");
	if (element){
		str1 = getTranslation("You are in position");
		str2 = getTranslation("missing");
		element.setAttribute("data-position-translate", `${data['pos']} ${data['len']} ${data['missing']}`);
		element.textContent = `${str1} ${data['pos']} / ${data['len']} (${data['missing']} ${str2})`;
	}
}

function tournament_launch(class_name){
	if (!is_owner)
		return;
	const button = document.getElementById("tournament_start");
	if (button && button.classList.contains('disabled'))
		button.classList.remove('disabled');
	if (button && class_name)
		button.classList.add(class_name);
}

function notify_player(){
	notificationEl = document.getElementById('notificationArea');
	if (notificationEl){
		const notification = document.createElement('div');
		notification.classList.add('alert', 'alert-info', 'p-2', 'fs-6', 'd-flex', 'justify-content-between', 'align-items-center');
		str = getTranslation("You are awaited for your next tournament game");
		notification.innerHTML = `${str}<button type="button" class="btn-close" aria-label="Close"></button>`;

		setTimeout(() => {
			notification.remove();
		}, 3000);
		const closeButton = notification.querySelector('.btn-close');
			closeButton.addEventListener('click', () => {
			notification.remove();
		});
		const notificationArea = document.getElementById('notificationArea');
		if (notificationArea)
			notificationArea.appendChild(notification);
	}
}

function passthrough_client(data){
	let scoreEl = document.getElementById('score');
	let pongEl = document.getElementById('pong');

	if (!scoreEl || !pongEl)
		return;

	if (data['event'] == 'announcement' && data.hasOwnProperty('winner')){
		scoreEl.innerHTML = "";
		pongEl.innerHTML = `<div id="play" class="text-light text-center"></div>`
		str = getTranslation("WINNER IS : ");
		let play = document.getElementById("play");
		if (play)
			play.innerHTML = `${str}${data['winner']}`;
		setTimeout(() => {
			return_to_main();
		}, 3000);
		tournamentWebsocket.close();
	}
	else if (data['event'] == 'announcement'){
		scoreEl.innerHTML = "";
		pongEl.innerHTML = `<div id="play" class="text-light text-center"></div>`
		let play = document.getElementById("play");
		str = getTranslation(data['level']);
		play.innerHTML = `${str} : ${data['player1']} VS ${data['player2']}`;

		accountdropdownEl = document.getElementById("account_dropdown");
		if (accountdropdownEl && (data['player1'] === accountdropdownEl.innerText || data['player2'] === accountdropdownEl.innerText))
			notify_player();
	}
	else if (data['event'] == 'game'){
		setTimeout(() => {
			make_pong_game();
			pong(data['game_id']);
		}, 3000);
	}
}

function tournament(){
	let jwtToken = encodeURIComponent(localStorage.getItem('jwtToken'));
	let id = encodeURIComponent(localStorage.getItem('userId'));
	const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
	const wsPath = wsProtocol + window.location.host + "/ws/pongtournament/?jwtToken=" + jwtToken + "&id=" + id;
	console.log(wsPath);
	tournamentWebsocket = new WebSocket(wsPath);

	tournamentWebsocket.onopen = function(){
		console.log("tournamentWebsocket opened !");
	}

	tournamentWebsocket.onclose = function(){
		console.log("tournamentWebsocket closed");
		let tournoi = document.getElementById("tournoi");
		if (tournoi)
			tournoi.remove()
	}

	tournamentWebsocket.onmessage = function(event){
		const data = JSON.parse(event.data);
		if (data['type'] === 'info'){
			tournament_info(data);
		}
		else if (data['type'] === 'update'){
			tournament_update(data);
		}
		else if (data['type'] === 'ready'){
			tournament_launch('');
		}
		else if (data['type'] === 'not_ready'){
			tournament_launch('disabled');
		}
		else if (data['type'] === 'disconnect'){
			if (data['message'] === true){
				const msg = document.getElementById("tournament_text");
				if (msg){
					str = getTranslation(data['content']);
					msg.innerText = str;
					leaveQueueButton = document.getElementById("leaveQueueButton");
					if (leaveQueueButton)
						leaveQueueButton.classList.add('disabled');
					setTimeout(() => {
						msg.innerText = '';
						tournamentPosEl = document.getElementById('tournament_pos');
						if (tournamentPosEl)
							tournamentPosEl.innerText = '';
						return_to_main();
					}, 3000);
				}
			}
		}
		else if (data['type'] == "passthrough"){
			passthrough_client(data);
		}
		else if (data['type'] == 'emergency_break'){
			scoreEl = document.getElementById('score');
			if (scoreEl)
				scoreEl.innerHTML = "";
			pongEl = document.getElementById('pong');
			if (pongEl)
				pongEl.innerHTML = `<div id="play" class="text-light text-center"></div>`;
			play = document.getElementById("play");
			if (play){
				str = getTranslation(data['event']);
				play.innerHTML = `${str}`;
			}
			setTimeout(() => {
				return_to_main();
			}, 3000);
			tournamentWebsocket.close();
		}
	}
}

let tournamentbutton = document.getElementById("tournament_button");
if (tournamentbutton)
	tournamentbutton.addEventListener("click", tournament)