const router = async () => {
	//console.log(`router ${location.pathname}`);

	//index
	if (location.pathname === '/')
		returnToIndex();

	//my account
	if (location.pathname === '/accounts/me/'){
		// openMyAccount();
		sendDataToSocket("open_myaccount");
	}

	if (location.pathname === '/accounts/username/me/'){
		sendDataToSocket("open_username_history", { friendId: 0 });
	}

	//friends profile
	const regexProfile = /^\/accounts\/friends\/[0-9\/]+\/$/;
	if (regexProfile.test(location.pathname)) {
		const   friendId = location.pathname.slice(18, -1);
		sendDataToSocket("open_friend_profile", { friendId: friendId });
	}

    //chat
    const regexChat = /^\/chat\/friends\/[0-9\/]+\/$/;
    if (regexChat.test(location.pathname)) {
        const   friendId = location.pathname.slice(14, -1);
        sendDataToSocket("open_chat", { friendId: friendId });
    }

    //game-history
    const regexHistory = /^\/game-history\/[0-9a-zA-Z\/]+\/$/;
    if (regexHistory.test(location.pathname)) {
        const   game_id = location.pathname.slice(14, -1);
        sendDataToSocket("open_game_history", { game_id: game_id });
    }
    
    //username-profile
    const regexUsername = /^\/accounts\/username\/[0-9\/]+\/$/;
    if (regexUsername.test(location.pathname)) {
	    const   friendId = location.pathname.slice(19, -1);
	    sendDataToSocket("open_username_history", { friendId: friendId });
	}
	return;
}

//arrow listener
window.addEventListener("popstate", router);

function goToPage(url) {
	url = window.location.origin + '/' + url;
	if (url !== window.location.href){
		if (window.location.href === window.location.origin + '/') {//remove index event listeners
			if (queuebutton)
				queuebutton.removeEventListener("click", addToQueue);
			if (tournamentbutton)
				tournamentbutton.removeEventListener("click", tournament);
			if (fourplayersbutton)
				fourplayersbutton.removeEventListener("click", fourPlayers);

			if (queueWebsocket && queueWebsocket.readyState !== WebSocket.CLOSED)
				queueWebsocket.close();
			if (tournamentWebsocket && tournamentWebsocket.readyState !== WebSocket.CLOSED)
				tournamentWebsocket.close();
			if (fourplayersWebsocket && fourplayersWebsocket.readyState !== WebSocket.CLOSED)
				fourplayersWebsocket.close();

			if (local.pongRefreshIntervalId){
				clearInterval(local.pongRefreshIntervalId);
				local.pongRefreshIntervalId = null;
				sendDataToSocket('update_user_status', {status : 'online'});
			}
		}
		history.pushState(null, null, url);
		router();
	}
}

function returnToIndex(){
	mainEl = document.getElementsByTagName('main')[0];
	if (mainEl){
		mainEl.innerHTML =`
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
		</div>`;
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