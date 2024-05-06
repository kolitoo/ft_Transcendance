const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
const wsPath = wsProtocol + window.location.host + "/ws/index/";
let friendsSocket = new WebSocket(wsPath);

var currentURL = window.location.href;
var urlWithoutPath = currentURL.split("/")[0] + "//" + window.location.host;
window.history.replaceState({}, document.title, urlWithoutPath);

if (document.getElementById('loginModal')) {
	var loginModal = new bootstrap.Modal(document.getElementById('loginModal'), {
		backdrop: 'static',
		keyboard: false
	});
}

function success_connection(jwtToken) {
	loginModal.hide();
	const back = document.querySelector('.modal-backdrop');
	if (back) {
		back.parentNode.removeChild(back);
	}
	document.getElementById("history").innerHTML = "";
	const data = {
		type: 'first_connection',
		jwtToken: jwtToken,
	};
	friendsSocket.send(JSON.stringify(data));
	friendsSocket.send(JSON.stringify({
		type: 'update_user_status',
		status: 'online',
		jwtToken: jwtToken,
	}));
	friendsSocket.send(JSON.stringify({
		type: 'update_history',
		jwtToken: jwtToken,
	}));
}

friendsSocket.onopen = function(event) {
	console.log('friendsSocket open')
	setupTabSwitching();
	var jwtToken = localStorage.getItem('jwtToken');
	if (jwtToken != null && jwtToken != '')
		success_connection(jwtToken);
	else
	if (document.getElementById('loginModal'))
		loginModal.show();
		state = localStorage.getItem('baseState')
		sendDataToSocket("ask_link_42", {state: state});
};

function sendDataToSocket(type, payload) {
	var jwtToken = localStorage.getItem('jwtToken');
	const data = {
		type: type,
		jwtToken: jwtToken,
		...payload
	};
	friendsSocket.send(JSON.stringify(data));
}

friendsSocket.onmessage = function (event) {
	var data = JSON.parse(event.data);

	switch(data.type) {
		case 'login_response':
			if (data.message == 'Connexion ok')
				localStorage.setItem('jwtToken', data.jwt)
			var jwtToken = localStorage.getItem('jwtToken');
			if (jwtToken !== null)
				success_connection(jwtToken);
			else
				print_error('error_password', data.message)
			break;
		case '42href':
			var SignInButton = document.getElementById('SignInButton');
			if (SignInButton){
				SignInButton.onclick = function() {
					window.location.href = data.oauth_url;
				};
			}
			break;
		case 'registered':
			switchToLoginTab();
			break;
		case 'check_if_friend':
			if (data.friends == 'is_friends')
				goToPage('accounts/friends/' + data.friendId + '/');
			else
				notificationArea();
		case 'open_myaccount_42':
			if (data.is_42 == 'no42')
				openMyAccount();
			else if (data.is_42 == 'is42')
				openMyAccount42(data);
		case 'passworderror':
		case 'void':
		case 'avatar_error':
		case 'password_confirm_error':
		case 'same_username':
		case 'firstname_error':
		case 'lastname_error':
			print_error(data.type, data.message)
			break;
		case 'InvalidJeton'://Si un je ton est invalide ou dans le cas d'un logout
			state = localStorage.getItem('baseState')
			if (localStorage.getItem('jwtToken') != null)
				localStorage.removeItem('jwtToken');
			goToPage('')
			if (!document.getElementById('loginModal'))
			{
				injectLoginModal()
				loginModal = new bootstrap.Modal(document.getElementById('loginModal'), {
					backdrop: 'static',
					keyboard: false
				});
				sendDataToSocket("ask_link_42", {state: state});
			}
			document.getElementById("login_password").value = "";
			document.getElementById("login_username").value = "";
			loginModal.show()
			break;
		case 'update_JWT'://MAJ JWT si changement de nom
			localStorage.removeItem('jwtToken');
			localStorage.setItem('jwtToken', data.jwtToken)
			break;
		case 'show_modal'://Switch modal si 2fa apres login
			loginModal.hide();
			injectOtpModal(data.username, data.password)
			var fa2Modal = new bootstrap.Modal(document.getElementById('otModal'));
			fa2Modal.show();
			document.getElementById('otForm').addEventListener('submit', function(event) {
				submitOtpForm.call(this, event, fa2Modal);
			});
			break;
		case 'wrong_2fapassword':
			print_error(data.type, data.message)
			break;
		case 'delete_demande_ami': //Suppr demande d'amis apres avoir accept ou reject
			deleteFriendRequest(data)
			break;
		case 'message_after_invitation': //Affichage resultat apres l'invitation
			printMessageAfterInvitation(data)
			break;
		case 'update_friend_list_&_demande_amis': //Mise a jour de la liste d'amis a la connection
			updateFriendList(data.friends, data.demande_amis, data.avatar, data.username, data.id);
			break;
		case 'update_search_friend': //Mise a jour apres rechercher d'un ami
			updateSearchFriend(data)
			break;
		case 'update_friend_status': //Met a jour le status
			updateFriendStatus(data)
			break;
		case 'new_demande_ami': //Affiche la notification de demande d'ami
			newRequestFriend(data)
			break;
		case 'user_info': //Pour myAccount preremplie les champs
			preFillFields(data)
			break;
		case 'deactive_2fa': //Pour myAccount fait changer le bouton apres avoir cliquer sur desac 2FA
			deactive2FA(data)
			break;
		case 'active_2fa': //Pour myAccount fait apparaitre modale pour 2FA
			active2FA(data)
			break;
		case 'save_modif': //Pour myAccount messaag d'erreur pour modif de compte
			saveModification(data)
			break;
		case '2fa_without_42id': //Met a jour le bouton active 2FA dans Myaccount
			updateButton(data, 1)
			break;
		case '2fa_with_42id':
			updateButton(data, 2)
			break;
		case 'success2FA':
			const modal2FAsuccess = document.getElementById('myModal');
			modal2FAsuccess.innerHTML = '';
			const backdrop = document.querySelector('.modal-backdrop');
			if (backdrop) {
				backdrop.parentNode.removeChild(backdrop);
			}
			sendDataToSocket("update_button", null);
			break;
		case 'fail2FA':
			const modal2FAfail = document.getElementById('myModal');
			const errorMessage = modal2FAfail.querySelector('#err'); // Sélectionnez l'élément existant pour afficher les erreurs
		
			// Mettez à jour le texte de l'élément existant avec le message d'erreur
			errorMessage.textContent = getTranslation("Le code est incorrect.");
			errorMessage.classList.add('text-danger');
		
			// Rendre l'erreur visible
			errorMessage.style.display = 'block';
		
			// Disparaître après 3 secondes
			setTimeout(() => {
				errorMessage.style.display = 'none';
			}, 2000);
			break;
		case 'addGameToHistory': //Pour l'historique affiche chaque partei de game
			gameLeftHistory(data);
			break;
		case 'friend_profile':
			openFriendProfile(data);
			break;
		case 'game-history':
			openGameHistory(data);
			break;
		case 'add_friend_game':
			addGameToFriendProfile(data);
			break;
		case 'friend_stats':
			addStatsToFriendProfile(data);
			break;
		case 'open_chat':
			openChat(data);
			break;
		case 'update_avatar_and_username':
			update_avatar_and_username(data);
			break;
		case 'friend_message_receive':
			receive_friend_message(data);
			break;
		case 'confirmMessageSent':
			confirm_message_sent(data);
			break;
		case 'load_message':
			load_message(data);
			break;
		case 'invite_friend_to_game':
			invite_friend_to_game(data);
			break;
		case 'chat_to_pong_game':
			load_pong_game(data);
			break;
		case 'invitation_denied':
			invitation_denied(data);
			break;
		case 'is_new_message':
			addBadgeOnFriendMessage(data);
			break;
		case 'set_lang':
			setUserLanguage(data);
			break;
	}
};

friendsSocket.onclose = function(){
	console.log('friendsSocket close');
	sendDataToSocket("disconnect", null)
}

//Recuperer le token dans les cookie
function getCSRFToken() {
	var csrfCookie = document.cookie.split('; ').find(row => row.startsWith('csrftoken='));
	if (csrfCookie) {
		return csrfCookie.split('=')[1];
	}
	return null;
}

function togglePasswordVisibility(passwordInput, toggleButton) {
	if (passwordInput.type === "password") {
	passwordInput.type = "text";
	toggleButton.innerHTML = '<i class="fas fa-eye-slash"></i>';
	} else {
	passwordInput.type = "password";
	toggleButton.innerHTML = '<i class="fas fa-eye"></i>';
	}
}

function setupTabSwitching() {
	var loginTab = document.getElementById("nav-login-tab");
	var registerTab = document.getElementById("nav-register-tab");
	var loginContent = document.getElementById("loginTab");
	var registerContent = document.getElementById("registerTab");

	if (!loginTab || !registerTab || !loginContent || !registerContent)
		return;

	loginTab.addEventListener("click", function() {
		loginContent.classList.add("active", "show");
		loginTab.classList.add("active");
		registerContent.classList.remove("active", "show");
		registerTab.classList.remove("active");
	});
	registerTab.addEventListener("click", function() {
		registerContent.classList.add("active", "show");
		registerTab.classList.add("active");
		loginContent.classList.remove("active", "show");
		loginTab.classList.remove("active");
	});

	const images = document.querySelectorAll('.image-thumbnail');
	images.forEach(image => {
	image.addEventListener('click', function() {
		images.forEach(img => img.classList.remove('custom-border'));
		this.classList.add('custom-border');
		avataridEL = document.getElementById('avatar_id');
		if (avataridEL)
			avataridEL.value = this.src;
		});
	});

	var loginPasswordInput = document.getElementById("login_password");
	var loginToggleBtn = document.getElementById("login_togglePassword");
	var registerPasswordInput = document.getElementById("register_password");
	var registerToggleBtn = document.getElementById("register_togglePassword");
	var registerPasswordConfirmInput = document.getElementById("register_password_confirm"); // Nouvelle variable pour le champ de confirmation du mot de passe
	var registerToggleBtnConfirm = document.getElementById("register_togglePassword_confirm"); // Nouvelle variable pour le bouton de bascule de visibilité du champ de confirmation du mot de passe


	if (!loginPasswordInput || !loginToggleBtn || !registerPasswordInput || !registerToggleBtn)
		return;

	loginToggleBtn.addEventListener("click", function() {
		togglePasswordVisibility(loginPasswordInput, loginToggleBtn);
	});
	registerToggleBtn.addEventListener("click", function() {
		togglePasswordVisibility(registerPasswordInput, registerToggleBtn);
	});
	registerToggleBtnConfirm.addEventListener("click", function() {
		togglePasswordVisibility(registerPasswordConfirmInput, registerToggleBtnConfirm);
	});

};

function print_error(ElementID, message) {
	var Element = document.getElementById(ElementID);
	if (Element) {
		str = getTranslation(message);
		Element.textContent = str;
		setTimeout(() => {
			Element.textContent = '';
		}, 3000)
	}
}

function switchToLoginTab() {
	var loginTab = document.getElementById("nav-login-tab");
	var registerTab = document.getElementById("nav-register-tab");
	var loginContent = document.getElementById("loginTab");
	var registerContent = document.getElementById("registerTab");

	if (!loginTab || !registerTab || !loginContent || !registerContent)
		return;

	loginContent.classList.add("active", "show");
	loginTab.classList.add("active");
	registerContent.classList.remove("active", "show");
	registerTab.classList.remove("active");
	}