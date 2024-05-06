function make_pong_game(){
	const score = document.getElementById("score");
	if (score){
		score.innerHTML ='\
		<div id="player1" class="col-sm-5 overflow-hidden p-0">Player 1</div>\
		<div id="left_score" class="col-sm-1 overflow-hidden p-0">0</div>\
		<div id="right_score" class="col-sm-1 overflow-hidden p-0">0</div>\
		<div id="player2" class="col-sm-5 overflow-hidden p-0">Player 2</div>'
	}
	const	pongElem = document.getElementById("pong");
	if (pongElem){
		pongElem.innerHTML = '\
		<div id="pong_borders" class="border-top border-bottom border-5 border-white row no--bs-gutter-x m-0">\
			<div class="col no--bs-gutter-x">\
				<div id="player_left" class="bg-white float-start rounded"></div>\
				<div id="ball" class="nopadding bg-white rounded float-start">\</div>\
				<div id="player_right" class="bg-white float-end rounded"></div>\
			</div>\
		</div>'
	}
	document.body.addEventListener("keydown", keydown);
	document.body.addEventListener("keyup", keyup);

	if (queuebutton)
		queuebutton.removeEventListener("click", addToQueue);
	if (tournamentbutton)
		tournamentbutton.removeEventListener("click", tournament);
	if (fourplayersbutton)
		fourplayersbutton.removeEventListener("click", fourPlayers);
}

let queueWebsocket;

function addToQueue(){
	let jwtToken = encodeURIComponent(localStorage.getItem('jwtToken'));
	let id = encodeURIComponent(localStorage.getItem('userId'));
	const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
	const wsPath = wsProtocol + window.location.host + "/ws/pongqueue/?jwtToken=" + jwtToken + "&id=" + id;
	console.log(wsPath)
	queueWebsocket = new WebSocket(wsPath);

	queueWebsocket.onopen = function(){
		console.log("queueWebsocket opened !");
	}

	queueWebsocket.onclose = function(){
		console.log("queueWebsocket closed");
	}

	queueWebsocket.onmessage = async function(event){
		const data = JSON.parse(event.data);
		if (data['in']){
			const msg = document.getElementById("play");
			str = getTranslation("You are in position");
			if (msg){
				msg.innerHTML= `
				${str} ${data['pos']} / ${data['len']}<br>
				<button class="btn btn-danger m-1" onclick="leaveQueue()">
					<i class="bi bi-box-arrow-left"></i>
				</button>
				`;
			}
		}
		else if (data['out']){
			setTimeout(function() {
				make_pong_game();
				pong(data['path']);
			}, 1000);
		}
		else if (data['close']){
			queueWebsocket.close();
		}
		else{
			console.log("else");
			console.log(data);
		}
	}
}

let queuebutton = document.getElementById("queue_button");
if (queuebutton)
	queuebutton.addEventListener("click", addToQueue);

function    leaveQueue(){
	if (queueWebsocket && queueWebsocket.readyState !== WebSocket.CLOSED)
		queueWebsocket.close();
	if (tournamentWebsocket && tournamentWebsocket.readyState !== WebSocket.CLOSED)
		tournamentWebsocket.close();
	if (fourplayersWebsocket && fourplayersWebsocket.readyState !== WebSocket.CLOSED)
		fourplayersWebsocket.close();

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
}