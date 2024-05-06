function delete_friend(friendId) {
	if (friendId !== '') {
		sendDataToSocket("delete_friend", { friendId: friendId });
	}
}

function reject_friend(demandeId) {
	if (demandeId !== '') {
		sendDataToSocket("rejectDemande", { demande_id: demandeId });
	}
}

function accept_friend(demandeId) {
	if (demandeId !== '') {
		sendDataToSocket("acceptDemande", { demande_id: demandeId });
	}
}

function invite_user(friendUsername) {
	if (friendUsername !== '') {
		sendDataToSocket("invite_user", { friend_username: friendUsername });
	}
}

function logout() {
	accountDropdownEl = document.getElementById('account_dropdown');
	if (accountDropdownEl)
		accountDropdownEl.innerHTML = `<img id="avatar_menu" class="rounded-circle ml-1" src="" style="width:40px; height:40px">`;
	sendDataToSocket("logout", null);
}

//Ecouteur d'evenement pour le formulaire de recherche d'amis et pour envoyer le nom de l'ami rechercher
document.getElementById('search-user-form').addEventListener('submit', function(event) {
	event.preventDefault();
	const searchInput = document.getElementById('search_username');
	if (searchInput){
		const username = searchInput.value.trim();
		if (username !== '')
			sendDataToSocket("search_username", { search_username: username })
	}
});

//Pour modal login
function login() {
	var formData = new FormData();
	loginusernameEl = document.getElementById('login_username');
	if (loginusernameEl)
		formData.append('username', loginusernameEl.value);
	loginpasswordEl = document.getElementById('login_password');
	if (loginpasswordEl)
		formData.append('password', loginpasswordEl.value);
	sendDataToSocket("login", { form_data: Object.fromEntries(formData) })
}

function register() {
	var formData = new FormData();
	usernameEl = document.getElementById('username');
	if (usernameEl)
		formData.append('username', usernameEl.value);
	firstnameEl = document.getElementById('firstname');
	if (firstnameEl)
		formData.append('firstname', firstnameEl.value);
	lastnameEL = document.getElementById('lastname');
	if (lastnameEL)
		formData.append('lastname', lastnameEL.value);
	registerpasswordEl = document.getElementById('register_password');
	if (registerpasswordEl)
		formData.append('password', registerpasswordEl.value);
	register_password_confirmEl = document.getElementById('register_password_confirm')
	if (register_password_confirmEl)
		formData.append('password_confirm', register_password_confirmEl.value);

	avatarEl = document.getElementById('avatar_id');
	if (avatarEl) {
		var avatarUrl = avatarEl.value;
		var avatarPath = '';

		// Vérifier si l'URL de l'avatar n'est pas vide
		if (avatarUrl.trim() !== '') {
			var avatarFileName = avatarUrl.substring(avatarUrl.lastIndexOf('/') + 1);
			avatarPath = 'avatar/' + avatarFileName;
			formData.append('avatar', avatarPath);
		}
		else
			formData.append('avatar', 'void')
	}
	sendDataToSocket("register", { form_data: Object.fromEntries(formData) })
}


//Gestion modal 2FA JWT
if (document.getElementById('otpModal')){
	var otpModal = new bootstrap.Modal(document.getElementById('otpModal'), {
		backdrop: 'static',
		keyboard: false
	});

document.addEventListener("DOMContentLoaded", function() {
			otpModal.show();
	});

document.getElementById('otpForm').addEventListener('submit', function(event) {
		submitOtpForm.call(this, event, otpModal);
	});
}

function submitOtpForm(event, modal) {
	event.preventDefault();

	var formData = new FormData(this);
	fetch(verifyOtpUrl, {
		method: 'POST',
		headers: {
			'X-CSRFToken': getCSRFToken()
		},
		body: formData
	})
	.then(response => response.json())
	.then(data => {
		if(data.token != '')
			localStorage.setItem('jwtToken', data.token);
			var jwtToken = localStorage.getItem('jwtToken');
			if (jwtToken !== null) {
				modal.hide();
				if (document.getElementById('otModal')){
					document.getElementById('otModal').outerHTML = "";
				}
				const back = document.querySelector('.modal-backdrop');
				if (back) {
					back.parentNode.removeChild(back);
				}
				document.getElementById("history").innerHTML = "";
				sendDataToSocket("first_connection", null);
				sendDataToSocket("update_user_status", { status: 'online' });
				sendDataToSocket("update_history", null);
			}
		else {
			var errorMessage = document.createElement('p');
			errorMessage.className = 'text-danger';
			str = getTranslation(data.message);
			errorMessage.textContent = str;
			this.appendChild(errorMessage);
			setTimeout(function() {
				errorMessage.remove();
			}, 2000);
		}
	})
	.catch(error => {
		console.error('Erreur lors de la requête :', error);
	});
}