function injectOtpModal(username, password) {
	var otpModalHtml =
	`<div class="modal fade" id="otModal" tabindex="-1" aria-labelledby="otpModalLabel" aria-hidden="true" data-bs-backdrop="static">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-body">
					<form id="otForm" method="post">
						<input type="hidden" name="csrfmiddlewaretoken" value="${getCSRFToken()}">
						<div class="mb-3">
							<input type="text" class="form-control" id="otp_code" name="otp_code" required placeholder="Code OTP">
							<input type="hidden" name="username" value="${username}">
							<input type="hidden" name="password" value="${password}">
						</div>
						<button type="submit" class="btn btn-primary">Valider</button>
					</form>
				</div>
			</div>
		</div>
	</div>`;

	document.body.insertAdjacentHTML('beforeend', otpModalHtml);
}

function injectLoginModal() {
	var loginModalHtml =
	`<div class="modal fade" id="loginModal" tabindex="-1" aria-labelledby="loginModalLabel" aria-hidden="true">
	<div class="modal-dialog">
	<div class="modal-content">
	<div class="modal-header justify-content-center">
		<div class="nav nav-tabs card-header-tabs fs-4 fw-bold" id="nav-tab" role="tablist">
		<a class="nav-link active" id="nav-login-tab" role="tab" href="#loginTab">Connexion</a>
		<a class="nav-link" id="nav-register-tab" role="tab" href="#registerTab">Inscription</a>
		</div>
	</div>
		<div class="modal-body">
			<div class="tab-content">
				<div id="loginTab" class="tab-pane fade show active">
					<form id="myForm" class="mt-4 text-center">
						<div class="form-group mb-3">
							<input type="text" id="login_username" name="login_username" class="form-control" placeholder="Nom d'utilisateur">
							<div id="error_username" class="text-danger"></div>
						</div>
						<div class="form-group mb-3">
							<div class="input-group">
								<input type="password" id="login_password" name="login_password" class="form-control" placeholder="Mot de passe" autocomplete="on">
								<div class="input-group-append">
									<button class="btn btn-outline-secondary" type="button" id="login_togglePassword"><i class="fas fa-eye"></i></button>
								</div>
							</div>
							<div id="error_password" class="text-danger"></div>
						</div>
						<div class="text-center">
							<button class="btn btn-primary btn-block mb-3" type="button" onclick="login()">Connexion</button>
						</div>
						<div class="text-center">
							<button id="SignInButton" class="btn btn-dark btn-block" type="button">Sign in with 42</button>
						</div>
					</form>
				</div>
				<div id="registerTab" class="tab-pane fade">
					<div class="form-group mb-3">
						<input type="text" id="firstname" name="firstname" class="form-control" placeholder="Prénom*">
					</div>
					<div class="form-group mb-3">
						<input type="text" id="lastname" name="lastname" class="form-control" placeholder="Nom de famille*">
					</div>
					<div class="form-group mb-3">
						<input type="text" id="username" name="username" class="form-control" placeholder="Nom d'utilisateur*" autocomplete="on">
						<div id="same_username" class="text-danger"></div>
					</div>
					<form id="register_password_from" class="input-group form-group mb-3">
						<input type="password" id="register_password" name="register_password" class="form-control" placeholder="Mot de passe*" autocomplete="on">
						<div class="input-group-append">
							<button class="btn btn-outline-secondary" type="button" id="register_togglePassword"><i class="fas fa-eye"></i></button>
						</div>
					</form>
					<div id="passworderror" class="text-danger"></div>
					<form class="input-group form-group mb-3">
						<input type="password" id="register_password_confirm" name="register_password_confirm" class="form-control" placeholder="Confirmez le mot de passe*" autocomplete="on">
						<div class="input-group-append">
							<button class="btn btn-outline-secondary" type="button" id="register_togglePassword_confirm"><i class="fas fa-eye"></i></button>
						</div>
					</form>
					<div id="password_confirm_error" class="text-danger"></div>
					<p class="">Sélectionnez un avatar*</p>
					<div class="container mb-3">
						<div class="row justify-content-center">
							<div class="col d-flex justify-content-between" id="image-row">
							<div class="image-container">
								<img src="/media/avatar/asian.png" alt="Image 1" class="img-fluid image-thumbnail rounded">
							</div>
							<div class="image-container">
								<img src="/media/avatar/asianwoman.png" alt="Image 2" class="img-fluid image-thumbnail rounded">
							</div>
							<div class="image-container">
								<img src="/media/avatar/pongplayer.png" alt="Image 3" class="img-fluid image-thumbnail rounded">
							</div>
							<div class="image-container">
								<img src="/media/avatar/enstein.png" alt="Image 4" class="img-fluid image-thumbnail rounded">
							</div>
						</div>
					</div>
				</div>
				<input type="hidden" id="avatar_id" name="avatar" accept="image/*">
				<div id="avatar_error" class="text-danger"></div>
				<div id="void" class="text-danger"></div>
				<div class="text-center">
					<button id="register" type="button" class="btn btn-primary mb-3r" onclick="register()">S'enregistrer</button>
				</div>
				<p class="mb-0" id="obligatoire">* Obligatoires</p>
			</div>
		</div>
	</div>`;
	
	var otpModalElement = document.getElementById('otpModal');
	otpModalElement.outerHTML = loginModalHtml;

	setupTabSwitching();
}