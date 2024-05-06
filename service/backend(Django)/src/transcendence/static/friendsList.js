function deleteFriendRequest(data) {
	var demandeElement = document.getElementById('demande-' + data.demande_id);
	if (demandeElement) {
		demandeElement.parentNode.removeChild(demandeElement);
	}
}

function printMessageAfterInvitation(data) {
	var friendListElement = document.getElementById('search-result');
	if (friendListElement) {
		friendListElement.innerHTML = '';
		friendListElement.innerHTML = `<div id="invite_sent_${data['user']}" class="text-center text-success" data-innerText-translate="Invitation sent">${data.message}</div>`;
		translateEl(document.getElementById(`invite_sent_${data['user']}`));
		setTimeout(function() {
			const invitation_sent = document.getElementById(`invite_sent_${data['user']}`);
			if (invitation_sent)
				invitation_sent.remove();
		}, 1000)
	}
}

function updateSearchFriend(data) {
	// Si utilisateur trouvé, affiche son nom, avatar et invitation
	if (data.user_found) {
		var user = data.user_found;
		var searchResultElement = document.getElementById('search-result');
		searchResultElement.innerHTML = `
		<a id="invite_${user.username}" class="row m-0 list-group-item list-group-item-action d-flex align-items-center">
			<div class="col-md-auto p-0">
				<img class="rounded-circle" src=${user.avatar_url} style="width:40px; height: 40px;">
			</div>
			<div class="col overflow-hidden flex-nowrap">
				<strong style="white-space:nowrap;">${user.username}</strong>
			</div>
			<div class="col-md-auto p-0">
				<form id="invite_user" data-friend-username="${user.username}">
					<input type="hidden" name="csrfmiddlewaretoken" value="${getCSRFToken()}">
					<button type="button" class="btn btn-primary" onclick="invite_user('${user.username}');">
						<i class="bi bi-person-fill-add"></i>
					</button>
				</form>
			</div>
		</a>`;
	}
	// Si aucun utilisateur n'est trouvé affiche un message d'erreur
	else if (data.message) {
		var errorMessage = data.message;
		var searchResultElement = document.getElementById('search-result');
		if (searchResultElement)
			searchResultElement.innerHTML = `<div id="error_message_friend_search" class="error-message text-center text-danger"></div>`;
		errorMessageElement = document.getElementById('error_message_friend_search');
		if (errorMessageElement)
			errorMessageElement.innerText = errorMessage;
		translateInnerText(errorMessageElement);
		setTimeout(function() {
			if (errorMessageElement)
				errorMessageElement.remove();
		}, 2000)
	}
}

function updateFriendStatus(data) {
	var userstatus = data.userstatus;

	if(userstatus == 'invisible'){
		userstatus = 'offline';
	}
	var friendElement = document.getElementById('friend-' + data.friend_id);
	if (friendElement) {
		var friendStatusDotElement = friendElement.querySelector('.friend-status-dot');
		var friendUsername = friendElement.querySelector('.friend-username')
		var avatarElement = friendElement.querySelector('#avatar_profile');
		if (friendStatusDotElement) {
			friendStatusDotElement.title = userstatus;
			friendUsername.textContent = data.username;
			// Mettre à jour la couleur
			if (userstatus === 'online') {
				friendStatusDotElement.style.backgroundColor = 'rgb(3, 206, 3)';
			}
			else if (userstatus === 'in game') {
				friendStatusDotElement.style.backgroundColor = 'rgb(192, 128, 8)';
			}
			else {
				friendStatusDotElement.style.backgroundColor = 'red';
			}
		}
		avatarElement.src = data.avatar;
	}
	friendStatusEl = document.getElementById(`friend-status-${data.friend_id}`);
	if (friendStatusEl){
		friendStatusEl.setAttribute("data-title-translate", userstatus);
		translateTitle(friendStatusEl);
	}
}

function newRequestFriend(data) {
	const chatMenu = document.getElementById('chatMenu');
	if (!chatMenu.classList.contains('show')) {
		// Créer un élément de notification
		const notification = document.createElement('div');
		notification.classList.add('alert', 'alert-info', 'p-2', 'fs-6', 'd-flex', 'justify-content-between', 'align-items-center'); // Ajouter les classes de Bootstrap pour le style

		// Ajouter le contenu de la notification
		notification.innerHTML = `<div id="new_invite_alert_${data.ask_id}">Nouvelle demande d\'ami reçue </div><button type="button" class="btn-close" aria-label="Close"></button>`;

		// Fermer automatiquement la notification après 3 secondes
		setTimeout(() => {
			notification.remove();
		}, 3000);
		// Ajouter un gestionnaire d'événement de clic pour fermer la notification
		const closeButton = notification.querySelector('.btn-close');
		closeButton.addEventListener('click', () => {
			notification.remove();
		});
		// Ajouter la notification à l'élément parent dans votre DOM
		const notificationArea = document.getElementById('notificationArea');
		if (notificationArea){
			notificationArea.appendChild(notification);
		}
		const messageToTranslate = document.getElementById(`new_invite_alert_${data.ask_id}`);
		if (messageToTranslate)
			translateInnerText(messageToTranslate);
	}
	print_demande_amis(data.username, data.ask_id);
}

//Pour mettre a jour la liste d'amis
function updateFriendList(friends, demandes_amis, avatar, username, id) {
	localStorage.setItem('userId', id);
	const img = document.getElementById("avatar_menu");
	if (img){
		img.parentElement.innerHTML = `${username}<img id="avatar_menu" class="rounded-circle ml-1" src="${avatar}" style="width:40px; height:40px">`;
	}
	const friendListElement = document.querySelector('.friend-list');
	if (friendListElement) {
		friendListElement.innerHTML = ''; // Efface le contenu existant
		if (friends.length > 0) {
			friends.forEach(function(friend) {
				print_friend_list(friend, friendListElement);
			});
		}
		else {
			const dElement = document.createElement('div');
			dElement.classList.add("text-center");
			dElement.setAttribute("data-innerText-translate", "You do not have any friends yet");
			str = getTranslation("You do not have any friends yet");
			dElement.textContent = str;
			friendListElement.appendChild(dElement);
		}
	}
	var demandeAmisDiv = document.getElementById('demande-amis');
	demandeAmisDiv.innerHTML = '';
	demandes_amis.forEach(function(demande) {
		print_demande_amis(demande.expediteur_username, demande.id);
	});
}

function print_friend_list(friend, ulElement) {
	const htmlContent =`
		<div id="friend-${friend.id}" class="friend-item list-group-item list-group-item-action" data-friend-id="${friend.id}" data-friend-status="${friend.userstatus}">
			<div class="row m-0 flex-nowrap">
				<div class="col p-0 text-center">
					<a onclick="goToPage('chat/friends/${friend.id}/')" role="button">
						<div class="row m-0 align-items-center text-start">
							<div class="col-md-auto p-0">
								<div id="friend-image-${friend.id}" class="d-inline-block position-relative">
									<span id="friend-status-${friend.id}" class="friend-status-dot position-absolute translate-middle p-2 border border-light rounded-circle" title="${friend.userstatus}" style="top:90%; left:90%;"></span>
									<img id="avatar_profile" class="rounded-circle" src=${friend.avatar} alt="${friend.username}\'s Avatar" style="width:40px; height: 40px;">
								</div>
							</div>
							<div class="col p-0 overflow-hidden ml-1" style="width:0;">
								<strong class="friend-username" style="white-space: nowrap">${friend.username}</strong>
							</div>
						</div>
					</a>
				</div>
				<div class="col-md-auto p-0">
					<div class="row m-0">
						<div class="col p-0 text-center align-self-center">
							<form method="post" id="delete_friend_${friend.id}">
								<input type="hidden" name="csrfmiddlewaretoken" value="${getCSRFToken()}">
								<button type="button" class="btn btn-danger" title="Remove friend" onclick="delete_friend(${friend.id});" data-title-translate="Remove friend">
									<i class="bi bi-person-fill-dash"></i>
								</button>
							</form>
						</div>
					</div>
				</div>
			</div>
		</div>`;


	//Attention avant ca "delete_friend${friend.id}" maintenant delete_friend
	ulElement.innerHTML += htmlContent;
	const friendStatusEl = document.getElementById(`friend-status-${friend.id}`);
	if (friendStatusEl){
		friendStatusEl.setAttribute("data-title-translate", friend.userstatus);
		translateTitle(friendStatusEl);
	}
	translateAll();

	var friendElement = document.getElementById('friend-' + friend.id);
	if (friendElement) {
		var friendStatusDotElement = friendElement.querySelector('.friend-status-dot');
		if (friendStatusDotElement) {
			// Mettre à jour la couleur
			if (friend.userstatus === 'online') {
				friendStatusDotElement.style.backgroundColor = 'rgb(3, 206, 3)';
			}
			else if (friend.userstatus === 'in game') {
				friendStatusDotElement.style.backgroundColor = 'rgb(192, 128, 8)';
			}
			else {
				friendStatusDotElement.style.backgroundColor = 'red';
			}
		}
	}
	sendDataToSocket("ask_if_new_message_friend", { id: friend.id });
}


function print_demande_amis(expediteur_username, demande_id) {
	var newDemandeElement = document.createElement('div');
	var demandeAmisDiv = document.getElementById('demande-amis');

	newDemandeElement.id = 'demande-' + demande_id;

	str = getTranslation("Friend invite from");

	newDemandeElement.innerHTML = `
		<div class="card-footer m-0 row d-flex align-items-center">
			<div class="col p-0 text-center align-items-center flex-nowrap overflow-hidden">
				<div class="row m-0">
					<div style="white-space:nowrap;" data-innerText-translate="Friend invite from">${str}</div>
				</div>
				<div class="row m-0">
					<strong style="white-space:nowrap;">${expediteur_username}</strong>
				</div>
			</div>
			<div class="col-md-auto p-0 d-flex">
				<div class="row m-0 align-items-center">
					<div class="col p-0">
						<form method="post" id="accept_friend_${demande_id}" data-friend-id="${demande_id}">
							<input type="hidden" name="csrfmiddlewaretoken" value="${getCSRFToken()}">
							<button type="button" class="accept-button btn btn-success mx-1" onclick="accept_friend(${demande_id})">
								<i class="bi bi-person-fill-check"></i>
							</button>
						</form>
					</div>
					<div class="col p-0">
						<form method="post" id="reject_friend_${demande_id}" data-friend-id="${demande_id}">
							<input type="hidden" name="csrfmiddlewaretoken" value="${getCSRFToken()}">
							<button type="button" class="refuse-button btn btn-danger" onclick="reject_friend(${demande_id})">
								<i class="bi bi-person-fill-slash"></i>
							</button>
						</form>
					</div>
				</div>
			</div>
		</div>`;
	if (demandeAmisDiv)
		demandeAmisDiv.appendChild(newDemandeElement);
}