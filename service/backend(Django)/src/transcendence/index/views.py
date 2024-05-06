from django.shortcuts import render
from django.http import HttpResponse
from django.shortcuts import render, redirect
import os
from dotenv import load_dotenv
import requests
from accounts.models import Utilisateur
from accounts.backends import CustomAuthBackend
from django.core.files.temp import NamedTemporaryFile
from django.utils.crypto import get_random_string
import jwt
import uuid
import time
import json
import logging

load_dotenv()

def index(request):
    state = get_random_string(32)
    request.session['base_state'] = state
    token = request.GET.get('token')
    return render(request, 'index/index.html', {'token': token, 'base_state': state})

def error_404(request, exception):
    return render(request, 'index/404.html', status=404)

def download_and_save_image(url):
    try:
        response = requests.get(url)
        if response.status_code == 200:
            temp_file = NamedTemporaryFile(delete=False)
            temp_file.write(response.content)
            temp_file.close()
            return temp_file.name
        else:
            return None
    except Exception as e:
        print(f"Erreur lors du téléchargement de l'image : {e}")
        return None

def log_user_with42(username, request):
    auth_backend = CustomAuthBackend()
    user = auth_backend.authenticate(request, username=username, password="")
    if user is not None:
        if user.secret_code != '':
            return user
        else:
            user.userstatus = 'online'
            user.save(hash_password=False)
            return user
    else:
        return None

def save_user(username, first_name, last_name, id_42, avatar, avatar_file, request):
    utilisateur, created = Utilisateur.objects.get_or_create(id_42=id_42)
    if created:
        count = 1
        while Utilisateur.objects.filter(username=username).exists():
            username = f"{username}{count}"
            count += 1
        utilisateur.username = username
        utilisateur.firstname = first_name
        utilisateur.lastname = last_name
        utilisateur.avatar.save(os.path.basename(avatar), open(avatar_file, 'rb'), save=True)
        utilisateur.password = ""

        utilisateur.save()
    else:
        utilisateur.firstname = first_name
        utilisateur.lastname = last_name
        utilisateur.avatar.save(os.path.basename(avatar), open(avatar_file, 'rb'), save=True)
        utilisateur.password = ""

        utilisateur.save()
    return log_user_with42(utilisateur.username, request)

def get_user_info(access_token, request):
    user_info_url = 'https://api.intra.42.fr/v2/me'

    headers = {'Authorization': f'Bearer {access_token}'}

    response = requests.get(user_info_url, headers=headers)

    if response.status_code == 200:
        user_info = response.json()
        first_name = user_info.get('first_name')
        last_name = user_info.get('last_name')
        username = user_info.get('login')
        id_42 = user_info.get('id')
        avatar = user_info.get('image', {}).get('versions', {}).get('large')
        avatar_file = download_and_save_image(avatar)

        if first_name == None or last_name == None or username == None:
                return None
        return save_user(username, first_name, last_name, id_42, avatar, avatar_file, request)
    else:
        return None

def auth_callback(request):
    stored_state = request.session.get('base_state')
    api_state = request.GET.get('state')

    if stored_state != api_state:
        return HttpResponse("Erreur: la state ne correspond pas.")
    auth_code = request.GET.get('code')
    params = {
        'code': auth_code,
        'client_id': 'u-s4t2ud-c804487cb545cef2e2360ad740edea2b82ad63fcc7b67cc57c7621c0e8d7141b',
        'client_secret': os.getenv("CLIENT_SECRET"),
        'redirect_uri': f'https://{os.getenv('IP_ADDR')}:8080/auth_callback',
        'grant_type': 'authorization_code',
    }
    state = get_random_string(32)
    request.session['base_state'] = state
    response = requests.post('https://api.intra.42.fr/oauth/token', data=params)
    if response.status_code == 200:
        access_token = response.json().get('access_token')
        user_info = get_user_info(access_token, request)
        if user_info is None:
            return HttpResponse("Erreur récupération des données utilisateur")
        elif user_info.secret_code != '':
            return render(request, "index/index.html", {'otp_modal': True, 'username': user_info.username, 'password': "", 'base_state': state})
        else:
            jwt_payload = {'sub': user_info.username, 'exp': int(time.time()) + (3600 * 12), 'nbf': int(time.time()), 'iat': int(time.time()), 'jti': str(uuid.uuid4())}
            jwt_token = jwt.encode(jwt_payload, os.getenv("JWT_SECRET"), algorithm='HS256')
            user_info.jti = jwt_payload['jti']
            user_info.save(hash_password=False)
            request.session['jwt_token'] = jwt_token
            jwt_token_json = json.dumps(jwt_token)
            return render(request, "index/index.html", {'jwt_token_json': jwt_token_json, 'base_state': state})
    else:
        return HttpResponse("Erreur lors de l'échange du code d'autorisation contre le jeton d'accès.")

def returnIndex(request, friendId=None, game_id=None):
    return redirect('index:index')