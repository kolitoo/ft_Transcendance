function saveMyAccountChanges(event){
	event.preventDefault(); // Empêcher le comportement par défaut du bouton (envoi du formulaire)
	// Collecter les valeurs des champs du formulaire
	var formData = new FormData();
	usernameEl = document.getElementById('username-myAcc');
	if (usernameEl)
		formData.append('username', usernameEl.value);
	firstnameEl = document.getElementById('firstname-myAcc');
	if (firstnameEl)
		formData.append('firstname', firstnameEl.value);
	lastnameEl = document.getElementById('lastname-myAcc');
	if (lastnameEl)
		formData.append('lastname', lastnameEl.value);
	passwordEl = document.getElementById('password');
	if (passwordEl)
		formData.append('password', passwordEl.value);
	newpasswordEl = document.getElementById('newPassword');
	if (newpasswordEl)
		formData.append('newPassword', newpasswordEl.value);
	confirmnewpasswordEl = document.getElementById('confirmNewPassword');
	if (confirmnewpasswordEl)
		formData.append('confirmNewPassword', confirmnewpasswordEl.value);

	var avatarFile = document.getElementById('avatar').files[0];
	if (avatarFile) {
		var reader = new FileReader();
		reader.onload = function(event) {
			formData.append('avatar', event.target.result);
			sendDataToSocket("save_modif", { form_data: Object.fromEntries(formData) })
		};
		reader.readAsDataURL(avatarFile);
	}
	else
		sendDataToSocket("save_modif", { form_data: Object.fromEntries(formData) })
}

function openMyAccount(){
	var mainContent = document.querySelector("main.col-md-7");
	mainContent.innerHTML = "";
	mainContent.innerHTML = `
	<div class="m-3 card">
		<div class="card-body">
			<form id="myForm">
				<div class="row">
					<div class="col form-group">
						<label for="username-myAcc" data-innerText-translate="Username :">Username :</label>
						<input class="form-control" type="text" id="username-myAcc" name="username" placeholder="Username" autocomplete="on" data-placeHolder-translate="Username">
					</div>
					<div class="col form-group">
						<label for="firstname-myAcc" data-innerText-translate="Firstname :">Firstname :</label>
						<input class="form-control" type="text" id="firstname-myAcc" name="firstname" placeholder="Firstname" data-placeHolder-translate="Firstname">
					</div>
					<div class="col form-group">
						<label for="lastname-myAcc" data-innerText-translate="Lastname :">Lastname :</label>
						<input class="form-control" type="text" id="lastname-myAcc" name="lastname" placeholder="Lastname" data-placeHolder-translate="Lastname">
					</div>
				</div>
				<div class="row">
					<div class="col form-group">
						<label for="avatar" data-innerText-translate="Avatar :">Avatar :</label>
						<input class="form-control" type="file" id="avatar" name="avatar" accept="image/*">
					</div>
				</div>
				<div class="row">
					<div class="col form-group">
						<label for="newPassword" data-innerText-translate="New password :">New password :</label>
						<input class="form-control" type="password" id="newPassword" name="newPassword" placeholder="New password" autocomplete="on" data-placeHolder-translate="New password">
					</div>
					<div class="col form-group">
						<label for="confirmNewPassword" data-innerText-translate="Confirm new password :">Confirm new password :</label>
						<input class="form-control" type="password" id="confirmNewPassword" name="confirmNewPassword" placeholder="Confirm new password" autocomplete="on" data-placeHolder-translate="Confirm new password">
					</div>
				</div>
				<div class="row">
					<div class="col form-group">
						<label for="password" data-innerText-translate="Current password* :">Current password* :</label>
						<input class="form-control" type="password" id="password" name="password" placeholder="Current password" autocomplete="on" data-placeHolder-translate="Current password">
					</div>
				</div>

				<div class="row">
					<div class="col d-flex justify-content-end">
						<button class="btn btn-primary" id="save_modif" onclick="saveMyAccountChanges(event)" data-innerText-translate="Sauvegarder">Sauvegarder</button>
					</div>
				</div>
			</form>

			<div id="messageErrorElementId" class="text-danger"></div>
			<div id="messageSuccessElementId" class="text-success"></div>

			<hr>
			<div id="myAccount2faButton" class="d-flex justify-content-center"></div>
			<p class="mb-0" id="obligatoire" data-innerText-translate="* Obligatoires">* Obligatoires</p>
			<div id="myModal" class="modal"></div>
		</div>
	</div>
	`;
	sendDataToSocket("myAccount", null)
	sendDataToSocket("update_button", null)
	translateAll();
}

function openMyAccount42(data){
	var mainContent = document.querySelector("main.col-md-7");
	var href42 = "https://profile.intra.42.fr/users/" + data.username;
	mainContent.innerHTML = "";
	mainContent.innerHTML = `
	<div class="m-3 card">
		<div class="card-body d-flex justify-content-between align-items-center">

			<h1 class="card-title m-0">42 Infos</h1>
			<button class="btn btn-primary" onclick="window.location.href='${href42}'">42</button>
		</div>
		<div class="card-body justify-content-between align-items-center">
			<div class="row">
				<p class="card-text m-0 col-md-auto" data-innerText-translate="Username :">Username :</p>
				<p class="card-text m-0 col-md-auto">${data.username}</p>
			</div>
			<div class="row">
				<p class="card-text m-0 col-md-auto" data-innerText-translate="Firstname :">Firstname :</p>
				<p class="card-text m-0 col-md-auto">${data.firstname}</p>
			</div>
			<div class="row">
				<p class="card-text m-0 col-md-auto" data-innerText-translate="Lastname :">Lastname :</p>
				<p class="card-text m-0 col-md-auto">${data.lastname}</p>
			</div>
		</div>
		<div id="myAccount2faButton" class="d-flex justify-content-center mb-3"></div>
		<div id="myModal" class="modal"></div>
		</div>
	</div>
`;

	sendDataToSocket("update_button", null)
	translateAll();
}

function update_avatar_and_username(data){
	dropdownEl = document.getElementById("account_dropdown");
	if (dropdownEl){
		dropdownEl.innerHTML =  `${data['username']}<img id="avatar_menu" class="rounded-circle ml-1" src="${data['avatar']}" style="width:40px; height:40px">`;
	}
}

function preFillFields(data) {
	// Pré-remplir les champs avec les informations de l'utilisateur
	document.getElementById('username-myAcc').value = data.username;
	document.getElementById('firstname-myAcc').value = data.firstname;
	document.getElementById('lastname-myAcc').value = data.lastname;
}

function deactive2FA(data){
	const modalEl = document.getElementById('myModal');
	modalEl.innerHTML = '';
	fa_activated();
	sendDataToSocket("update_button", null);
}

function fa_activated() {
	const modalEl = document.getElementById('myModal');

	// Effacer le contenu de la modal
	modalEl.innerHTML = '';

	// Afficher un message de confirmation sans le bouton de fermeture
	modalEl.innerHTML = `
		<div class="modal-dialog modal-dialog-centered">
		<div class="modal-content border border-5 border-primary rounded">
			<div id="2FA_modal_body" class="modal-body text-center">
			<p data-innerText-translate="Le 2FA est maintenant désactivé.">Le 2FA est maintenant désactivé.</p>
			</div>
		</div>
		</div>
	`;
	translateAll();

	const myModal = new bootstrap.Modal(modalEl);
	myModal.show();

	// setTimeout(function() {
	//     myModal.hide();
	//     // Supprimer le backdrop
	//     const backdrop = document.querySelector('.modal-backdrop');
	//     backdrop.parentNode.removeChild(backdrop);
	// }, 2500);
}

function active2FA(data) {
	const modalEl = document.getElementById('myModal');
	modalEl.innerHTML = `
	<div class="modal-dialog modal-dialog-centered">
		<div class="modal-content border border-5 border-primary rounded">
			<div class="modal-header">
				<h5 class="modal-title" data-innerText-translate="Scannez ce Qrcode">Scannez ce Qrcode</h5>
				<button id="closeButton" type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			</div>
			<div id="2FA_modal_body" class="modal-body text-center">
			</div>
			<p id="err" class="text-danger text-center mx-auto"></p>
			<div id="confirm_2FA" class="modal-footer">
				<div class="input-group">
					<input type="text" id="2fa_code" placeholder="Code 2FA" class="form-control" data-placeHolder-translate="Code 2FA">
					<button id="validerButton" type="button" class="btn btn-primary" data-innerText-translate="Valider">Valider</button>
				</div>
			</div>
		</div>
	</div>
	`;
	translateAll();

	let modalBodyEl = document.getElementById("2FA_modal_body");
	modalBodyEl.innerHTML = data.qr_code_svg;

	let myModal = bootstrap.Modal.getInstance(modalEl);
	if (myModal == null)
		myModal = new bootstrap.Modal(modalEl);

	if (myModal)
		myModal.show();

	document.getElementById('closeButton').addEventListener('click', function() {
		modalEl.innerHTML = '';
	});

	modalEl.addEventListener('hidden.bs.modal', event => {
		modalEl.innerHTML = '';
	})

	document.getElementById('validerButton').addEventListener('click', function() {
		var code2FA = document.getElementById('2fa_code').value;
		sendDataToSocket("verify2FA", { code2FA: code2FA, secret_code: data.secret_code });
	});
}

function saveModification(data) {
	if (data.message === "Ok") {
		var messageElement = document.getElementById('messageErrorElementId');
		if (messageElement)
			messageElement.innerHTML = '';

		let successMessageEl = document.getElementById("messageSuccessElementId");
		if (successMessageEl){
			successMessageEl.innerText = '';
			successMessageEl.innerText = "Changes saved";
			translateInnerText(successMessageEl);
		}
		return;
	}

	var messageElement = document.getElementById('messageErrorElementId');
	if (messageElement) {
		messageElement.innerHTML = '';
		str = getTranslation(data.message);
		messageElement.textContent = str;

		let successMessageEl = document.getElementById("messageSuccessElementId");
		if (successMessageEl){
			successMessageEl.innerText = '';
		}
	}
}

function updateButton(data, int) {
	var buttonContainer = document.getElementById('myAccount2faButton');
	buttonContainer.innerHTML = '';
	if (data.is_2fa_enabled == false) {
		var button = document.createElement('button');
		str = getTranslation("Activate 2FA");
		button.textContent = str;
		button.id = 'active_2fa';
		button.classList.add("button-style"); // Ajoutez des styles CSS si nécessaire
		button.classList.add("btn");
		button.classList.add("btn-primary");
		button.setAttribute("data-innerText-translate","Activate 2FA");
		button.addEventListener('click', function() {
			if (int == 1)
				show2FAPassword();
			else
				sendDataToSocket("active_2fa", null)
		});
		buttonContainer.appendChild(button);
	}
	else {
		// Si la 2FA est activée, cree le bouton "Désactiver 2FA"
		var button = document.createElement('button');
		str = getTranslation("Deactivate 2FA");
		button.textContent = str;
		button.id = 'deactivate_2fa';
		button.classList.add('button-style'); // Ajoutez des styles CSS si nécessaire
		button.classList.add('btn');
		button.classList.add('btn-primary');
		button.setAttribute("data-innerText-translate","Deactivate 2FA");
		button.addEventListener('click', function() {
			if (int == 1)
				show2FAPassword();
			else
				sendDataToSocket("deactive_2fa", null)
		});
		buttonContainer.appendChild(button);
	}
}

function show2FAPassword() {
	const modalEl = document.getElementById('myModal');
	modalEl.innerHTML = `
		<div class="modal-dialog modal-dialog-centered">
			<div class="modal-content border border-5 border-primary rounded">
				<div class="modal-header">
					<h5 class="modal-title" data-innerText-translate="Entrer votre mot de passe.">Entrer votre mot de passe.</h5>
				</div>
				<div class="modal-body">
					<div class="form-group mb-3">
						<form class="input-group">
							<input type="password" id="2faPasswordInput" name="2faPasswordInput" class="form-control" placeholder="Mot de passe" data-placeHolder-translate="Mot de passe" autocomplete="on">
							<div class="input-group-append">
								<button class="btn btn-outline-secondary" type="button" id="login_togglePassword_2fa"><i class="fas fa-eye"></i></button>
							</div>
						</form>
						<div id="wrong_2fapassword" class="text-danger" style="margin-left: 10px;"></div>
					</div>
				</div>
				<div class="modal-footer justify-content-between">
					<p class="small text-start" data-innerText-translate="Obligatoires*">Obligatoires*</p>
					<button type="button" id="2fapasswordsubmit" class="btn btn-primary" data-innerText-translate="Valider">Valider</button>
				</div>
			</div>
		</div>
	`;

	translateAll();

	const myModal = new bootstrap.Modal(document.getElementById('myModal'));
	myModal.show();

	const togglePasswordButton = document.getElementById('login_togglePassword_2fa');
	togglePasswordButton.addEventListener('click', function() {
		const passwordInput = document.getElementById('2faPasswordInput');
		const eyeIcon = togglePasswordButton.querySelector('i');

		if (passwordInput.type === 'password') {
		passwordInput.type = 'text';
		eyeIcon.classList.remove('fa-eye');
		eyeIcon.classList.add('fa-eye-slash');
		} else {
		passwordInput.type = 'password';
		eyeIcon.classList.remove('fa-eye-slash');
		eyeIcon.classList.add('fa-eye');
		}
	});

	document.getElementById('2fapasswordsubmit').addEventListener('click', function() {
		const passwordInput = document.getElementById('2faPasswordInput').value;
		sendDataToSocket('check_2fa_password', { password: passwordInput });
	});
}