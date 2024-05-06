from django.shortcuts import redirect
from accounts.backends import CustomAuthBackend
import pyotp
import qrcode
import qrcode.image.svg

def verify_otp(request):
    import jwt
    import uuid
    import time
    import os
    from dotenv import load_dotenv
    from django.http import JsonResponse
    
    load_dotenv()

    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        otp_code = request.POST['otp_code']

        auth_backend = CustomAuthBackend()
        user = auth_backend.authenticate(request, username=username, password=password)

        if user is not None and user.secret_code != '':
            if pyotp.TOTP(user.secret_code).now() == otp_code:
                jwt_payload = {'sub': user.username, 'exp': int(time.time()) + (3600 * 12), 'nbf': int(time.time()), 'iat': int(time.time()), 'jti': str(uuid.uuid4())}
                jwt_token = jwt.encode(jwt_payload, os.getenv("JWT_SECRET"), algorithm='HS256')
                user.jti = jwt_payload['jti']
                user.save(hash_password=False)
                return JsonResponse({'token': jwt_token})
            else:
                return JsonResponse({'token': '', 'message': "Code OTP incorrect."})
        else:
            return JsonResponse({'token': '', 'message': "Erreur lors de la vérification du code OTP."})

    return redirect('index:index')
