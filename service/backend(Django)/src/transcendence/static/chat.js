function openChat(data){
	badgeEl = document.getElementById(`badge-new-msg-${data['id']}`);
	if (badgeEl){
		badgeEl.remove();
	}

	mainEl = document.getElementsByTagName('main')[0];
	if (mainEl){
		mainEl.innerHTML = "";
		mainEl.innerHTML = `
		<div class="p-3 h-100">
			<div class="card h-100">
				<div class="card-header">
					<div class="row overflow-hidden align-items-center">
						<div class="col-md-auto">
							<img class="rounded-circle" src="${data['friend_avatar']}" style="width:80px; height: 80px;">
						</div>
						<div class="col" style="width:0;">
							<span class="align-middle fs-4 fw-bold text-nowrap">${data['friend_username']}</span>
						</div>
						<div class="col-md-auto">
							<div class="row m-0">
								<div class="col p-0" id="invite_to_game">
									<button class="btn btn-success mx-1" onclick="inviteToGame(${data['id']})">
										<i class="bi bi-play-fill"></i>
									</button>
								</div>
								<div class="col p-0" id="accept_invite">
								</div>
								<div class="col p-0" id="denie_invite">
								</div>
								<div class="col p-0">
									<button class="btn btn-primary mx-1" onclick="goToPage('accounts/friends/${data['id']}/')">
										<i class="bi bi-person-fill"></i>
									</button>
								</div>
								<div class="col p-0">
									<button id="button-block-${data['id']}" class="btn btn-danger mx-1" onclick="blockFriend(${data['id']})">
										<i class="bi bi-person-fill-lock"></i>
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div id="chat-${data['id']}" class="card-body" style="height: 70vh; overflow-y: auto;">
				</div>

				<div class="card-footer">
					<div class="input-group">
						<textarea id="input-msg-${data['id']}" type="text" class="form-control form-control-lg" placeholder="Type message" onkeydown="isEnter(event, ${data['id']})" data-placeHolder-translate="Type message"></textarea>
						<button id="btn-send-msg-${data['id']}" class="btn btn-primary" onclick="sendMessage(${data['id']})" data-innerText-translate="Send">Send </button>
					</div>
				</div>
			</div>
		</div>
		`;
		translateAll();
	}

	if (data['blocked']){
		buttonBlockEl = document.getElementById(`button-block-${data['id']}`);
		if (buttonBlockEl && !buttonBlockEl.classList.contains('disabled'))
			buttonBlockEl.classList.add('disabled');
	}

	if (data['invited']){
		let button_accept = document.getElementById("accept_invite");
		if (button_accept){
			button_accept.innerHTML = `\
			<button class="btn btn-success mx-1" onclick="reponse_invte(${data['id']}, true)">
				<i class="bi bi-check-lg"></i>
			</button>`;
		}
		let button_denied = document.getElementById("denie_invite");
		if (button_denied){
			button_denied.innerHTML = `\
			<button class="btn btn-danger mx-1" onclick="reponse_invte(${data['id']}, false)">
				<i class="bi bi-x-lg"></i>
			</button>`;
		}
		let button_invite = document.getElementById("invite_to_game");
		if (button_invite)
			button_invite.innerHTML="";
	}

	if (data['invitee']){
		let button_invite = document.getElementById("invite_to_game");
		if (button_invite)
			button_invite.innerHTML="";
	}

	sendDataToSocket('read_new_messages', {id : data['id']});
}

function isEnter(event, id){
	if (event.keyCode == 13 && !event.shiftKey){
		event.preventDefault();
		btnEl = document.getElementById(`btn-send-msg-${id}`);
		if (btnEl)
			sendMessage(id);
	}
}

function sendMessage(id){
	inputEl = document.getElementById(`input-msg-${id}`);
	if (!inputEl || inputEl.value === "" || inputEl.value === "\n"){
		inputEl.value = "";
		return;
	}
	sendDataToSocket("send_message_friend", { to: id, msg: inputEl.value });
	inputEl.value = "";
}

function notificationOnMessage(){
	notificationEl = document.getElementById('notificationArea');
	if (notificationEl){
		const chatMenu = document.getElementById('chatMenu');
		if (chatMenu && !chatMenu.classList.contains('show')) {
			const notification = document.createElement('div');
			notification.classList.add('alert', 'alert-info', 'p-2', 'fs-6', 'd-flex', 'justify-content-between', 'align-items-center');
			notification.innerHTML = '<div data-innerText-translate="New message received ">New message received </div><button type="button" class="btn-close" aria-label="Close"></button>';

			setTimeout(() => {
				notification.remove();
			}, 3000);
			const closeButton = notification.querySelector('.btn-close');
				closeButton.addEventListener('click', () => {
				notification.remove();
			});
			const notificationArea = document.getElementById('notificationArea');
			if (notificationArea){
				notificationArea.appendChild(notification);
				translateAll();
			}
		}
	}
}

function addBadgeOnFriendMessage(data){
	friendImageEl = document.getElementById(`friend-image-${data['from']}`);
	if (friendImageEl && !document.getElementById(`badge-new-msg-${data['from']}`)){
		friendImageEl.innerHTML += `
		<span id="badge-new-msg-${data['from']}" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" data-innerText-translate="New">
			New
		</span>`;
		badgeNewMsg = document.getElementById(`badge-new-msg-${data['from']}`);
		if (badgeNewMsg)
			translateEl(badgeNewMsg);
	}
}

function receive_friend_message(data){
	chatEl = document.getElementById(`chat-${data['from']}`);
	if (chatEl){
		chatEl.innerHTML += `
		<div class="d-flex">
			<p class="small text-muted text-center" style="white-space: pre-line;">${data['time']}</p>
			<div>
				<p id="message-${data['msg-id']}" class="p-2 ms-3 mb-1 rounded-3" style="background-color: #f5f6f7; white-space: pre-line; overflow-wrap: anywhere;"></p>
			</div>
		</div>
		`

		message = document.getElementById(`message-${data['msg-id']}`);
		if (message)
			message.innerText = data['content'];

		chatEl.scrollTop = chatEl.scrollHeight - chatEl.clientHeight;
		sendDataToSocket('read_new_messages', {id : data['from']});
	}
	else {
		notificationOnMessage();
		addBadgeOnFriendMessage(data);
	}
}

function confirm_message_sent(data){
	chatEl = document.getElementById(`chat-${data['to']}`);
	if (chatEl){
		chatEl.innerHTML += `
		<div class="d-flex flex-row justify-content-end">
			<div>
				<p id="message-${data['msg-id']}" class="p-2 me-3 mb-1 text-white rounded-3 bg-primary" style="white-space: pre-line; overflow-wrap: anywhere;"></p>
			</div>
			<p class="small text-muted text-center" style="white-space: pre-line;">${data['time']}</p>
		</div>
		`

		message = document.getElementById(`message-${data['msg-id']}`);
		if (message)
			message.innerText = data['content'];

		chatEl.scrollTop = chatEl.scrollHeight - chatEl.clientHeight;
	}
}

function load_message(data){
	chatEl = document.getElementById(`chat-${data['friendId']}`);
	if (chatEl)
		if (data['friendId'] == data['from']){
			receive_friend_message(data);
		}
		else if (data['friendId'] == data['to']){
			confirm_message_sent(data);
		}
}

function inviteToGame(id){
	sendDataToSocket("invite_to_game", { to: id });
	let button_invite = document.getElementById("invite_to_game");
	if (button_invite)
		button_invite.innerHTML="";
}

// id : id of the user, r bool : True accepted, False denied
function reponse_invte(id, r){
	if (!r){
		button_accept = document.getElementById("accept_invite");
		if (button_accept)
			button_accept.innerHTML = "";
		button_refuse = document.getElementById("denie_invite");
		if (button_refuse)
			button_refuse.innerHTML = "";
		button_invite = document.getElementById("invite_to_game");
		if (button_invite){
			button_invite.innerHTML=`
			<button class="btn btn-success mx-1" onclick="inviteToGame(${id})">
				<i class="bi bi-play-fill"></i>
			</button>
			`;
		}
	}
	sendDataToSocket("invite_reponse", { to: id, 'response' : r});
}

function load_pong_game(data){
	goToPage('');
	make_pong_game();
	pong(data.game_id);
}

function invite_friend_to_game(data){
	let button_accept = document.getElementById("accept_invite");
	if (button_accept){
		button_accept.innerHTML = `\
		<button class="btn btn-success mx-1" onclick="reponse_invte(${data['from']}, true)">
			<i class="bi bi-check-lg"></i>
		</button>`;
	}
	let button_denied = document.getElementById("denie_invite");
	if (button_denied){
		button_denied.innerHTML = `\
		<button class="btn btn-danger mx-1" onclick="reponse_invte(${data['from']}, false)">
			<i class="bi bi-x-lg"></i>
		</button>`;
	}
	let button_invite = document.getElementById("invite_to_game");
	if (button_invite)
		button_invite.innerHTML = "";

	notificationEl = document.getElementById('notificationArea');
	if (notificationEl){
		const notification = document.createElement('div');
		notification.classList.add('alert', 'alert-info', 'p-2', 'fs-6', 'd-flex', 'justify-content-between', 'align-items-center');
		str = getTranslation("You have been invited to a game by");
		notification.innerHTML = `${str} ${data['from_user_name']}<button type="button" class="btn-close" aria-label="Close"></button>`;

		setTimeout(() => {
			notification.remove();
		}, 3000);
		const closeButton = notification.querySelector('.btn-close');
			closeButton.addEventListener('click', () => {
			notification.remove();
		});
		const notificationArea = document.getElementById('notificationArea');
		if (notificationArea){
			notificationArea.appendChild(notification);
			translateAll();
		}
	}
}

function blockFriend(id){
	buttonBlockEl = document.getElementById(`button-block-${id}`);
	if (buttonBlockEl && !buttonBlockEl.classList.contains('disabled'))
		buttonBlockEl.classList.add('disabled');
	chatEl = document.getElementById(`chat-${id}`);
	if (chatEl)
		chatEl.innerHTML = "";
	sendDataToSocket("block_friend", { id: id });
}

function invitation_denied(data){
	if (document.getElementById(`chat-${data['id']}`)){
		button_invite = document.getElementById("invite_to_game");
		if (button_invite){
			button_invite.innerHTML=`
			<button class="btn btn-success mx-1" onclick="inviteToGame(${data['id']})">
				<i class="bi bi-play-fill"></i>
			</button>
			`;
		}
	}
}