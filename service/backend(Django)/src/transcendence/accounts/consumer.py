import json
import jwt
import os
import logging
import uuid
import time
import re
import pyotp
import qrcode
import qrcode.image.svg
import base64
from django.core.files.base import ContentFile
from dotenv import load_dotenv
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from django.contrib.auth.hashers import check_password
from PIL import Image

load_dotenv()

class FriendStatusConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()

#<------------------Utilitaire---------------------------------->
    def check_jeton(self, data):
        from accounts.models import Utilisateur

        jwtToken = data['jwtToken']
        jwt_payload = jwt.decode(jwtToken, os.getenv("JWT_SECRET"), algorithms=['HS256'])
        utilisateur = Utilisateur.objects.get(username=jwt_payload['sub'])
        if utilisateur.jti != jwt_payload['jti']:
            utilisateur.userstatus = 'offline'
            utilisateur.save(hash_password=False)
            raise jwt.InvalidTokenError("JTI du jeton JWT différent du JTI attendu")
        return (utilisateur)

    def generate_42link(self, state):
        client_id = "u-s4t2ud-c804487cb545cef2e2360ad740edea2b82ad63fcc7b67cc57c7621c0e8d7141b"
        redirect_url = f"https://{os.getenv('IP_ADDR')}:8080/auth_callback"
        oauth_url = f"https://api.intra.42.fr/oauth/authorize?client_id={client_id}&redirect_uri={redirect_url}&response_type=code&state={state}"
        return (oauth_url)

    def InvalidJeton(self):
        self.send(text_data=json.dumps({
			'type': 'InvalidJeton',
		}))

#<------------------Fin Utilitaire---------------------------------->

    def receive(self, text_data=None, bytes_data=None):
        try:
            data = json.loads(text_data)
        except:
            logging.info(f"json.loads error : {data}")

        if data['type'] not in ['login', 'register', 'disconnect', 'ask_link_42', "ask_if_new_message_friend"]:
            try:
                self.util = self.check_jeton(data)
            except Exception as e:
                if str(e) == 'JTI du jeton JWT différent du JTI attendu':
                    self.InvalidJeton()
                else:
                    logging.info(f"Jeton error: {e}")
                    self.disconnect(1000)
                    return

        try:
            getattr(self, data['type'])(data)
        except Exception as e:
            logging.info(f"Getattr error: {e}")
            return

    def ask_link_42(self, data):
        self.send(text_data=json.dumps({
			'type': '42href',
			'oauth_url': self.generate_42link(data['state'])
		}))

    def invalidJetonOtherWS(self, data):
        self.disconnect(1000)

    def first_connection(self, data):
        from accounts.models import UtilisateurSerializer, DemandeAmiSerializer, DemandeAmi

        utilisateur = self.check_jeton(data)

        self.group_name = f"user_{utilisateur.id}"
        async_to_sync(self.channel_layer.group_add)(
			self.group_name,
			self.channel_name
		)
        friends = list(utilisateur.friends.all())
        demandes_amis = DemandeAmi.objects.filter(destinataire_id=utilisateur.id)
        serialized_friends = UtilisateurSerializer(friends, many=True).data
        serialized_demande = DemandeAmiSerializer(demandes_amis, many=True).data
        self.scope['session']['username'] = utilisateur.username
        self.send(text_data=json.dumps({
			'type': 'update_friend_list_&_demande_amis',
			'friends': serialized_friends,
			'demande_amis': serialized_demande,
			'avatar': utilisateur.avatar.url,
			'username': utilisateur.username,
			'id' : utilisateur.id,
		}))
        self.send(text_data=json.dumps({'type' : 'set_lang', 'lang' : utilisateur.language}))

    def login(self, data):
        form_data = data['form_data']
        username = form_data.get('username')
        password = form_data.get('password')

        if password == '':
            self.send(text_data=json.dumps({
                'type': 'login_response',
                'message': 'Mot de passe ou username incorrect',
            }))
            return

        user = authenticate(username=username, password=password)

        if user is not None:
            if (user.secret_code != ''):
                self.send(text_data=json.dumps({
                    'type': 'show_modal',
                    'password' : password,
                    'username': username,
                }))
            else:
                jwt_payload = {'sub': username, 'exp': int(time.time()) + (3600 * 12), 'nbf': int(time.time()), 'iat': int(time.time()), 'jti': str(uuid.uuid4())}
                jwt_token = jwt.encode(jwt_payload, os.getenv("JWT_SECRET"), algorithm='HS256')
                user.jti = jwt_payload['jti']
                user.save(hash_password=False)
                self.send(text_data=json.dumps({
                	'type': 'login_response',
                	'message': 'Connexion ok',
                	'jwt': jwt_token,
                }))
        else:
            self.send(text_data=json.dumps({
                'type': 'login_response',
                'message': 'Mot de passe ou username incorrect',
            }))

    def register(self, data):
        from accounts.models import Utilisateur

        form_data = data['form_data']
        new_user = Utilisateur(
            username=form_data['username'],
            firstname=form_data['firstname'],
            lastname=form_data['lastname'],
            )
        if not (form_data['username'] and form_data['firstname'] and form_data['lastname'] and form_data['password'] and form_data['password_confirm']):
            send_message(self, 'void', 'Veuillez remplir tous les champs obligatoires.')
            return
        if not re.match(r'^[a-zA-Z]+$', new_user.firstname):
            send_message(self, 'firstname_error', 'Le prénom ne peut contenir que des lettres et des chiffres.')
            return
        if not re.match(r'^[a-zA-Z]+$', new_user.lastname):
            send_message(self, 'lastname_error', 'Le nom ne peut contenir que des lettres et des chiffres.')
            return
        if Utilisateur.objects.filter(username=new_user.username).exists():
            send_message(self, 'same_username', 'Nom d\'utilisateur non disponible')
            return
        if not re.match(r'^[a-zA-Z0-9]{3,}$', new_user.username):
            send_message(self, 'same_username', 'Le nom d\'utilisateur ne peut contenir que des lettres et des chiffres et doit avoir au moins trois caractères.')
            return
        if (form_data['avatar'] != 'void' and 'avatar' in form_data):
            new_user.avatar = form_data['avatar']
        else:
            send_message(self, 'avatar_error', 'Veuillez selectionner un avatar.')
            return
        if len(form_data['password']) < 8:
            send_message(self, 'passworderror', 'Le mot de passe doit contenir au minimum 8 caractères.')
            return
        if not any(char.isupper() for char in form_data['password']) or not any (char.islower() for char in form_data['password']):
            send_message(self, 'passworderror', 'Le mot de passe doit contenir au 1 majusucule et 1 minuscule.')
            return
        if not any(char.isdigit() for char in form_data['password']):
            send_message(self, 'passworderror', 'Le mot de passe doit contenir au minimum 1 chiffre.')
            return
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', form_data['password']):
            send_message(self, 'passworderror', 'Le mot de passe doit contenir au minimum 1 caractère spécial.')
            return
        if new_user.username in form_data['password'] or new_user.firstname in form_data['password'] or new_user.lastname in form_data['password']:
            send_message(self, 'passworderror', 'Le mot de passe ne doit pas contenir le nom ou prénom.')
            return
        if form_data['password'] != form_data['password_confirm']:
            send_message(self, 'password_confirm_error', "Le mot de passe et sa correspondance ne correspondent pas.")
            return
        new_user.set_password(form_data['password'])
        new_user.save(hash_password=False)
        send_message(self, 'registered', 'registered')

    def search_username(self, data):
        from accounts.models import Utilisateur, DemandeAmi

        search_username = data['search_username']
        utilisateur = self.check_jeton(data)

        if search_username == utilisateur.username:  # Vérifier si c'est le même utilisateur
            send_message(self, 'update_search_friend', "Vous ne pouvez pas vous ajouter vous-même comme ami.")
        else:
            try:
                user = Utilisateur.objects.get(username=search_username)
                friends = utilisateur.friends.all()

                if user in friends:  # Vérifier si l'utilisateur est déjà un ami
                    send_message(self, 'update_search_friend', f'Cet utilisateur est déjà dans votre liste d\'amis.')
                elif DemandeAmi.objects.filter(expediteur=utilisateur, destinataire=user).exists():
                    send_message(self, 'update_search_friend', f'Demande d\'amis déjà envoyée à cet utilisateur')
                else:
                    user_data = {
                        'username': user.username,
                        'avatar_url': user.avatar.url,
                    }
                    self.send(text_data=json.dumps({
                        'type': 'update_search_friend',
                        'user_found': user_data
                    }))
            except Utilisateur.DoesNotExist:
                send_message(self, 'update_search_friend', f'No user has been found with this name')

    def invite_user(self, data):
        from accounts.models import Utilisateur, DemandeAmi

        utilisateur = self.check_jeton(data)

        friend_username = data['friend_username']
        friend = Utilisateur.objects.get(username=friend_username)
        friend = get_object_or_404(Utilisateur, username=friend_username)
        friend_list = utilisateur.friends.all()
        if friend in friend_list:  # Vérifier si l'utilisateur est déjà un ami
            send_message(self, 'update_search_friend', f'Cet utilisateur est déjà dans votre liste d\'amis.')
            return
        if DemandeAmi.objects.filter(expediteur=friend, destinataire=utilisateur).exists():
            send_message(self, 'update_search_friend', f'Vous avez déjà reçu une demande d\'ami de cet utilisateur')
            return
        demande_ami = DemandeAmi.objects.create(expediteur=utilisateur, destinataire=friend)
        demande_ami.expediteur_username = utilisateur.username  # Mettre à jour expediteur_username
        demande_ami.save()
        message = f'Invitation sent'
        self.send(text_data=json.dumps({
            'type': 'message_after_invitation',
            'message': message,
            'user' : friend_username
        }))

    def acceptDemande(self, data):
        from accounts.models import DemandeAmi

        utilisateur = self.check_jeton(data)
        demande_ami = get_object_or_404(DemandeAmi, id=data['demande_id'], destinataire=utilisateur)
        # Ajoutez les deux utilisateurs à la liste d'amis l'un de l'autre
        demande_ami.expediteur.friends.add(utilisateur)
        utilisateur.friends.add(demande_ami.expediteur)
        # Supprimez la demande d'ami
        demande_ami.delete()

    def rejectDemande(self, data):
        from accounts.models import DemandeAmi

        utilisateur = self.check_jeton(data)
        demande_ami = get_object_or_404(DemandeAmi, id=data['demande_id'], destinataire=utilisateur)
        # Supprimez la demande d'ami
        demande_ami.delete()
        self.send(text_data=json.dumps({
           'type': 'delete_demande_ami',
            'demande_id' : data['demande_id'],
        }))

    def delete_friend(self, data):
        from accounts.models import Utilisateur

        utilisateur = self.check_jeton(data)
        friend_id = data['friendId']
        friend_to_remove = get_object_or_404(Utilisateur, id=friend_id)
        utilisateur.friends.remove(friend_to_remove)
        friend_to_remove.friends.remove(utilisateur)

    def update_history(self, data):
        from accounts.models import Utilisateur
        from pong.models import gameToDict

        utilisateur = self.check_jeton(data)
        user_history = Utilisateur.objects.get(username=utilisateur.username).games.order_by('created')[:7]
        for game in user_history:
            self.send(text_data=json.dumps(gameToDict(game)))

    def update_user_status(self, data):
        new_status = data['status']
        utilisateur = self.check_jeton(data)
        if new_status in ['online', 'invisible', 'absent', 'in game']:
            utilisateur.userstatus = new_status
            utilisateur.save(hash_password=False)

    def logout(self, data):
        from accounts.models import Utilisateur

        if self.scope['session'].get('username') != None:
            user = Utilisateur.objects.get(username=self.scope['session'].get('username'))
            user.jti = ''
            user.save(hash_password=False)
        self.disconnect(1000)

    def myAccount(self, data):
        utilisateur = self.check_jeton(data)
        self.send(text_data=json.dumps({
        	'type': 'user_info',
        	'username': utilisateur.username,
        	'firstname': utilisateur.firstname,
        	'lastname': utilisateur.lastname,
       	}))

    def check_2fa_password(self, data):
        user = self.check_jeton(data)
        if not check_password(data['password'], user.password):
                send_message(self, 'wrong_2fapassword', 'Mot de passe incorrect.')
                return
        if (user.secret_code != ''):
            self.deactive_2fa(data)
            return
        else:
            self.active_2fa(data)
            return

    def verify2FA(self, data):
        utilisateur = self.check_jeton(data)
        if pyotp.TOTP(data['secret_code']).now() == data['code2FA']:
            utilisateur.secret_code = data['secret_code']
            utilisateur.save(update_fields=['secret_code'])
            self.send(text_data=json.dumps({
                'type': 'success2FA'
        	}))
        else:
            self.send(text_data=json.dumps({
                'type': 'fail2FA'
        	}))


    def active_2fa(self, data):
        utilisateur = self.check_jeton(data)

        if utilisateur.secret_code == '':
            secret_code = pyotp.random_base32()
        else:
            pass
        totp = pyotp.TOTP(secret_code)
        otpauth_url = totp.provisioning_uri(utilisateur.username, issuer_name='Pong')

        qr_code_image = qrcode.make(otpauth_url, image_factory=qrcode.image.svg.SvgPathImage)
        qr_code_svg = qr_code_image.to_string().decode('utf_8')

        self.send(text_data=json.dumps({
            'type': 'active_2fa',
            'qr_code_svg': qr_code_svg,
            'secret_code': secret_code,
        }))

    def deactive_2fa(self, data):
        utilisateur = self.check_jeton(data)
        if utilisateur.secret_code != '':
            utilisateur.secret_code = ''
            utilisateur.save(update_fields=['secret_code'])
        self.send(text_data=json.dumps({
            'type': 'deactive_2fa',
        }))

    def update_button(self, data):
        is_2fa_enabled = False
        utilisateur = self.check_jeton(data)
        if utilisateur.secret_code != '':
            is_2fa_enabled = True
        if utilisateur.id_42 == '':
            self.send(text_data=json.dumps({
                'type': '2fa_without_42id',
                'is_2fa_enabled': is_2fa_enabled,
            }))
        else:
            self.send(text_data=json.dumps({
                'type': '2fa_with_42id',
                'is_2fa_enabled': is_2fa_enabled,
            }))

    def save_modif(self, data):
        from accounts.models import Utilisateur

        utilisateur = self.check_jeton(data)
        form_data = data['form_data']
        required_fields = ['username', 'firstname', 'lastname', 'password']
        user = utilisateur.username

        for field in required_fields:
            if not form_data.get(field):
                send_message(self, 'save_modif', "Veuillez remplir tous les champs obligatoires.")
                return
            if field == 'username' and Utilisateur.objects.exclude(username=utilisateur.username).filter(username=form_data['username']).exists():
               send_message(self, 'save_modif', "Nom d\'utilisateur non disponible")
               return
            if field == 'username' and not re.match(r'^[a-zA-Z0-9]{3,}$', form_data['username']):
                send_message(self, 'save_modif', 'Le nom d\'utilisateur ne peut contenir que des lettres et des chiffres et doit avoir au moins trois caractères.')
                return
            if field != 'password':
                utilisateur.__setattr__(field, form_data.get(field))
            if field == 'firstname' and not re.match(r'^[a-zA-Z]+$', form_data['firstname']):
                send_message(self, 'save_modif', 'Le prénom ne peut contenir que des lettres et des chiffres.')
                return
            if field == 'lastname' and not re.match(r'^[a-zA-Z]+$', form_data['lastname']):
                send_message(self, 'save_modif', 'Le nom ne peut contenir que des lettres et des chiffres.')
                return

        if not check_password(form_data['password'], utilisateur.password):
            send_message(self, 'save_modif', "Mot de passe incorrect")
            return

        if 'avatar' in form_data:
            avatar_data_url = form_data['avatar']
            format, imgstr = avatar_data_url.split(';base64,')

            decoded_data = base64.b64decode(imgstr)
            try:
                content_file = ContentFile(decoded_data)
                image = Image.open(content_file)
                image_loaded = True
                image.verify()
            except Exception as e:
                logging.info(f"{e}")
                image_loaded = False

            if image_loaded:
                utilisateur.avatar.save(f"user_{utilisateur.id}_avatar.png", content_file, save=False)
            else:
                send_message(self, 'save_modif', "Image invalide")
                return

        newPassword = form_data['newPassword']
        if newPassword != '':
            confirmNewPassword = form_data['confirmNewPassword']
            if not newPassword or not confirmNewPassword:
                send_message(self, 'save_modif', "Veuillez saisir un nouveau mot de passe et le confirmer.")
                return
            if newPassword != confirmNewPassword:
                send_message(self, 'save_modif', "Le nouveau mot de passe et sa confirmation ne correspondent pas.")
                return
            if len(newPassword) < 8:
                send_message(self, 'save_modif', "Le mot de passe doit contenir au minimum 8 caractères.")
                return
            if not any(char.isupper() for char in newPassword) or not any (char.islower() for char in newPassword):
                send_message(self, 'save_modif', "Le mot de passe doit contenir au 1 majusucule et 1 minuscule.")
                return
            if not any(char.isdigit() for char in newPassword):
                send_message(self, 'save_modif', "Le nouveau mot de passe doit contenir au moins un chiffre.")
                return
            if not re.search(r'[!@#$%^&*(),.?":{}|<>]', newPassword):
                send_message(self, 'save_modif', "Le nouveau mot de passe doit contenir au moins un caractere special.")
                return
            if utilisateur.username in newPassword or utilisateur.firstname in newPassword or utilisateur.lastname in newPassword:
                send_message(self, 'save_modif', "Le mot de passe ne doit pas contenir le nom ou prénom.")
                return
            utilisateur.set_password(newPassword)
        utilisateur.save(hash_password=False)

        send_message(self, 'save_modif', "Ok")
        if 'avatar' in form_data or 'username' in form_data:
            self.send(text_data=json.dumps({
                'type' : 'update_avatar_and_username',
                'avatar' : utilisateur.avatar.url,
                'username' : utilisateur.username
            }))

        if form_data.get('username') != user:
            self.scope['session']['username'] = utilisateur.username
            jwt_payload = {'sub': form_data['username'], 'exp': int(time.time()) + (3600 * 12), 'nbf': int(time.time()), 'iat': int(time.time()), 'jti': str(uuid.uuid4())}
            jwt_token = jwt.encode(jwt_payload, os.getenv("JWT_SECRET"), algorithm='HS256')
            utilisateur.jti = jwt_payload['jti']
            utilisateur.save(hash_password=False)
            self.send(text_data=json.dumps({
                'type' : 'update_JWT',
                'jwtToken' : jwt_token,
            }))

    def disconnect(self, close_code):
        from accounts.models import Utilisateur
        if self.scope['session'].get('username') != None:
            user = Utilisateur.objects.get(username=self.scope['session'].get('username'))
            user.userstatus = 'offline'
            user.save(hash_password=False)
            async_to_sync(self.channel_layer.group_discard)(
				self.group_name,
				self.channel_name
			)
        self.InvalidJeton()

    def friend_status_change(self, event):
        if event.get('type') == 'friend_status.change':
            avatar_info = event.get('avatar', '')
            avatar_url = avatar_info.split()[0] if avatar_info.strip() else ''
            self.send(text_data=json.dumps({
                'type': 'update_friend_status',
                'avatar': avatar_url,
                'friend_id': event['friend_id'],
                'userstatus': event['userstatus'],
                'username': event['username'],
            }))
        else:
            pass

    def demandeami_status_change(self, event):
        if event.get('type') == 'demandeami_status.change':
             self.send(text_data=json.dumps({
                'type': 'new_demande_ami',
                'from_id': event['from_id'],
                'to_id': event['to_id'],
                'ask_id': event['ask_id'],
                'username': event['username'],
            }))
        else:
            pass

    def friendlist_change(self, event):
        from accounts.models import UtilisateurSerializer, DemandeAmiSerializer, DemandeAmi, Utilisateur
        if event.get('type') == 'friendlist.change':
            utilisateur = Utilisateur.objects.get(username=event.get('username'))
            friends = list(utilisateur.friends.all())
            demandes_amis = DemandeAmi.objects.filter(destinataire_id=utilisateur.id)
            serialized_friends = UtilisateurSerializer(friends, many=True).data
            serialized_demande = DemandeAmiSerializer(demandes_amis, many=True).data
            self.send(text_data=json.dumps({
                'type': 'update_friend_list_&_demande_amis',
                'friends': serialized_friends,
                'demande_amis': serialized_demande,
                'avatar': utilisateur.avatar.url,
                'username': utilisateur.username,
                'id' : utilisateur.id,
            }))
        else:
            pass

    def game_saved(self, event):
        # import logging
        # logging.info(f"game saved `{event}`")
        if event.get('type') == 'game_saved':
            event['type'] = 'addGameToHistory'
            self.send(text_data=json.dumps(event))

    def check_if_friend(self, data):
        from accounts.models import Utilisateur
        friendID = data['friendId']
        utilisateur = self.check_jeton(data)
        is_friend = Utilisateur.objects.filter(id=friendID, friends=utilisateur).exists()
        if is_friend:
            self.send(text_data=json.dumps({
                'type': 'check_if_friend',
                'friends' : 'is_friends',
                'friendId' : friendID,
            }))
        else:
            self.send(text_data=json.dumps({
                'type': 'check_if_friend',
                'friends' : 'no_friends',
            }))
    def open_myaccount(self, data):
        utilisateur = self.check_jeton(data)
        if utilisateur.id_42 == "":
            self.send(text_data=json.dumps({'type': 'open_myaccount_42', 'is_42': 'no42'}))
            return
        elif utilisateur.id_42 != "":
            self.send(text_data=json.dumps({'type': 'open_myaccount_42',
                                            'is_42': 'is42',
                                            'username': utilisateur.username,
                                            'firstname': utilisateur.firstname,
                                            'lastname': utilisateur.lastname,
                        }))
            return

    def open_username_history(self, data):
        from accounts.models import Utilisateur, UtilisateurSerializer

        utilisateur = self.check_jeton(data)
        if get_object_or_404(Utilisateur, id=utilisateur.id):
            user = get_object_or_404(Utilisateur, id=utilisateur.id)
            serialized_user = UtilisateurSerializer(user).data
        self.send(text_data=json.dumps({
                'type': 'friend_profile',
                'id' : user.id,
                'user' : serialized_user
            }))
        user_history = user.games.order_by('created')
        
        stat_points_scored = 0
        stat_games_won = 0
        stat_games_played = 0
        winstreak = 0
        losestreak = 0
        from pong.models import gameToDict
        TotalGameDict = []
        if user_history:
            for game in user_history:
                gameDict = gameToDict(game)
                gameDict.update({'type' : 'add_friend_game'})
                gameDict['id'] = user.id
                gameDict['friend_username'] = user.username
                if user.username == gameDict['player1']:
                    adversary = gameDict['player2']
                else:
                    adversary = gameDict['player1']
                adversary_obj = Utilisateur.objects.get(username=adversary)
                gameDict['friend_avatar'] = user.avatar.url
                gameDict['enemy_avatar'] = adversary_obj.avatar.url
                self.send(text_data=json.dumps(gameDict))

                stat_games_played += 1
                if user.username == gameDict['player1']:
                    stat_points_scored += gameDict['score1']
                    if gameDict['score1'] == 10:
                        stat_games_won += 1
                        winstreak += 1
                        losestreak = 0
                    else:
                        winstreak = 0
                        losestreak += 1
                elif user.username == gameDict['player2']:
                    stat_points_scored += gameDict['score2']
                    if gameDict['score2'] == 10:
                        stat_games_won += 1
                        winstreak += 1
                        losestreak = 0
                    else:
                        winstreak = 0
                        losestreak += 1
                TotalGameDict.append(gameDict)
                
            self.send(text_data=json.dumps({
                'type' : 'friend_stats',
                'id' : user.id,
                'points_scored' : stat_points_scored,
                'games_won' : stat_games_won,
                'games_played' : stat_games_played,
                'winstreak' : winstreak,
                'losestreak' : losestreak,
                'win_vs_user': 0,
                'lose_vs_user': 0,
                'nbgame_vs_utilisateur': 0,
                'utilisateur_username': utilisateur.username,
                'total_game_data': TotalGameDict,
            }))
        else:
            self.send(text_data=json.dumps({
                'type' : 'friend_stats',
                'id' : user.id,
                'games_played' : 0,
                }))
        
    def open_game_history(self, data):
        from accounts.models import Utilisateur
        from pong.models import Game, gameToDict
        
        utilisateur = self.check_jeton(data)
        game_id = data['game_id']
        game = Game.objects.get(game_id=game_id)
        game_data = gameToDict(game)
        player1_info = Utilisateur.objects.get(id=game.player1_id)
        player2_info = Utilisateur.objects.get(id=game.player2_id)
        game_data['player1_username'] = player1_info.username
        game_data['player1_avatar'] = player1_info.avatar.url
        game_data['player2_username'] = player2_info.username
        game_data['player2_avatar'] = player2_info.avatar.url
        game_data['player1_id'] = player1_info.id
        game_data['player2_id'] = player2_info.id
        friend_list = utilisateur.friends.all()
        friend_data = []
        for friend in friend_list:
            friend_info = {
                'username': friend.username,
                'avatar': friend.avatar.url,
                'id': friend.id
	    }
            friend_data.append(friend_info)
        game_data['friend_list'] = friend_data
        game_data['user_ID'] = utilisateur.id
        game_data.update({'type' : 'game-history'})

        self.send(text_data=json.dumps(game_data))
        
    def open_friend_profile(self, data):
        from accounts.models import Utilisateur, UtilisateurSerializer

        friend_id = data['friendId']
        utilisateur = self.check_jeton(data)
        if get_object_or_404(utilisateur.friends, id=friend_id):
            friend = get_object_or_404(Utilisateur, id=friend_id)
            serialized_friends = UtilisateurSerializer(friend, many=False).data
            self.send(text_data=json.dumps({
                'type': 'friend_profile',
                'id' : friend_id,
                'user' : serialized_friends
            }))

            user_history = friend.games.order_by('created')

            stat_points_scored = 0
            stat_games_won = 0
            stat_games_played = 0
            winstreak = 0
            losestreak = 0
            nbgame_vs_utilisateur = 0
            wins_against_utilisateur = 0
            losses_against_utilisateur = 0

            from pong.models import gameToDict
            TotalGameDict = []
            if user_history:
                for game in user_history:
                    gameDict = gameToDict(game)
                    gameDict.update({'type' : 'add_friend_game'})
                    gameDict['id'] = friend_id
                    friend_utilisateur = Utilisateur.objects.get(id=friend_id)
                    gameDict['friend_username'] = friend_utilisateur.username
                    if friend.username == gameDict['player1']:
                        adversary = gameDict['player2']
                    else:
                        adversary = gameDict['player1']
                    adversary_obj = Utilisateur.objects.get(username=adversary)
                    gameDict['enemy_avatar'] = adversary_obj.avatar.url
                    gameDict['friend_avatar'] = friend_utilisateur.avatar.url
                    self.send(text_data=json.dumps(gameDict))

                    stat_games_played += 1
                    if friend.username == gameDict['player1']:
                        stat_points_scored += gameDict['score1']
                        if gameDict['score1'] == 10:
                            stat_games_won += 1
                            winstreak += 1
                            losestreak = 0
                            if gameDict['player2'] == utilisateur.username:
                                wins_against_utilisateur += 1
                                nbgame_vs_utilisateur += 1
                        else:
                            winstreak = 0
                            losestreak += 1
                            if gameDict['player2'] == utilisateur.username:
                                losses_against_utilisateur += 1
                                nbgame_vs_utilisateur += 1
                    elif friend.username == gameDict['player2']:
                        stat_points_scored += gameDict['score2']
                        if gameDict['score2'] == 10:
                            stat_games_won += 1
                            winstreak += 1
                            losestreak = 0
                            if gameDict['player1'] == utilisateur.username:
                                wins_against_utilisateur += 1
                                nbgame_vs_utilisateur += 1
                        else:
                            winstreak = 0
                            losestreak += 1
                            if gameDict['player1'] == utilisateur.username:
                                losses_against_utilisateur += 1
                                nbgame_vs_utilisateur += 1
                    TotalGameDict.append(gameDict)
                
                self.send(text_data=json.dumps({
                    'type' : 'friend_stats',
                    'id' : friend_id,
                    'points_scored' : stat_points_scored,
                    'games_won' : stat_games_won,
                    'games_played' : stat_games_played,
                    'winstreak' : winstreak,
                    'losestreak' : losestreak,
                    'win_vs_user': wins_against_utilisateur,
                    'lose_vs_user': losses_against_utilisateur,
                    'nbgame_vs_utilisateur': nbgame_vs_utilisateur,
                    'utilisateur_username': utilisateur.username,
                    'friend_username': friend.username,
                    'total_game_data': TotalGameDict,
                }))
            else:
                self.send(text_data=json.dumps({
                    'type' : 'friend_stats',
                    'id' : friend_id,
                    'games_played' : 0,
                    }))

    def open_chat(self, data):
        from django.shortcuts import get_object_or_404
        from accounts.models import Message
        from accounts.models import Invite
        from django.db.models import Q

        friend_id = data['friendId']
        utilisateur = self.check_jeton(data)

        friend = get_object_or_404(utilisateur.friends, id=friend_id)
        if friend:

            blackList = utilisateur.blackList.all()
            blocked = False
            if friend in blackList:
                blocked = True

            invites = Invite.objects.filter(from_user=friend, to_user=utilisateur, status="pending")
            invited = False
            if invites:
                invited = True
            invites = Invite.objects.filter(from_user=utilisateur, to_user=friend, status="pending")
            invitee = False
            if invites:
                invitee = True

            self.send(text_data=json.dumps({
                'type' : 'open_chat',
                'friend_username' : friend.username,
                'friend_avatar' : friend.avatar.url,
                'id' : friend_id,
                'blocked' : blocked,
                'invited' : invited,
                'invitee' : invitee,
            }))

            if blocked:
                return

            messages = Message.objects.filter(Q(from_user=friend, to_user=utilisateur) | Q(from_user=utilisateur, to_user=friend))
            for message in messages:
                self.send(text_data=json.dumps({
                    'type' : 'load_message',
                    'friendId' : friend_id,
                    'from' : message.from_user.id,
                    'to' : message.to_user.id,
                    'content': message.content,
                    'time': message.timestamp.strftime("%m/%d/%Y\n %H:%M:%S"),
                    'msg-id' : message.id
                }))

    def invite_to_game(self, data):
        from django.shortcuts import get_object_or_404
        from accounts.models import Invite, Utilisateur
        from django.db.models import Q

        user = self.check_jeton(data)
        friend : Utilisateur = get_object_or_404(user.friends, id=data["to"])

        if friend.userstatus != 'online':
            # cas où ton pote n'est pas dispo pour l'invitation
            return

        possible_invite = Invite.objects.filter(Q(from_user=friend, to_user=user, status="pending") | Q(from_user=user, to_user=friend, status="pending"))
        import logging
        if possible_invite:
            logging.info("pending invite found")
            # gerer le cas où il y a déjà une invation
            return

        pending_invite = Invite(from_user = user, to_user = friend)
        pending_invite.save()
        logging.info("invite created")

    def invite_friend_to_game(self, event):
        if event.get('type') == "invite_friend_to_game":
            import logging
            logging.info("about to send event to front")
            self.send(text_data=json.dumps(event))

    def invite_reponse(self, data):
        from accounts.models import Invite
        from django.shortcuts import get_object_or_404
        from django.db.models import Q

        user = self.check_jeton(data)
        friend = get_object_or_404(user.friends, id=data['to'])

        if not friend:
            # gerer le cas à la con où le gonze il retire son pote de ses amis alors qu'il l'a invité
            return

        if user.userstatus != 'online' or friend.userstatus != 'online':
            return

        possible_invite = Invite.objects.filter(Q(from_user=friend, to_user=user, status="pending") | Q(from_user=user, to_user=friend, status="pending"))[0]
        if data['response']:
            from pong.models import Game
            from django.utils.crypto import get_random_string

            if user.userstatus != 'online' or friend.userstatus != 'online':
                return

            id = get_random_string(32)
            possible_invite.status = 'accepted'
            possible_invite.game_id = id
            possible_invite.save()

            game = Game(
                player1 = friend,
                player2 = user,
                game_id = id
            )
            game.save()
        else:
            possible_invite.status = 'denied'
            possible_invite.save()

    def chat_to_pong_game(self, event):
        if event.get('type') == 'chat_to_pong_game':
            self.send(text_data=json.dumps(event))

    def invitation_denied(self, event):
        if event.get('type') == 'invitation_denied':
            self.send(text_data=json.dumps(event))

    def send_message_friend(self, data):
        from accounts.models import Message

        user = self.check_jeton(data)
        friend = get_object_or_404(user.friends, id=data['to'])

        if friend:
            userBlackList = user.blackList.all()
            friendBlackList = friend.blackList.all()
            if user in friendBlackList or friend in userBlackList:
                #send self user blocked you
                return

            message = Message(
                from_user = user,
                to_user = friend,
                content = data['msg']
            )
            message.save()

            self.send(text_data=json.dumps({
                'type' : 'confirmMessageSent',
                'to' : message.to_user.id,
                'content' : message.content,
                'time': message.timestamp.strftime("%m/%d/%Y\n %H:%M:%S"),
                'msg-id' : message.id,
            }))

    def friend_message_receive(self, data):
        self.send(text_data=json.dumps(data))

    def read_new_messages(self, data):
        from accounts.models import Message

        user = self.check_jeton(data)
        friend = get_object_or_404(user.friends, id=data['id'])
        if friend:
            messages = Message.objects.filter(from_user=friend, to_user=user, read=False)
            for message in messages:
                message.read = True
                message.save()

    def ask_if_new_message_friend(self, data):
        from accounts.models import Message

        user = self.check_jeton(data)
        friend = get_object_or_404(user.friends, id=data['id'])
        if friend:
            messages = Message.objects.filter(from_user=friend, to_user=user, read=False)
            if messages:
                self.send(text_data=json.dumps({
                    'type' : 'is_new_message',
                    'from' : data['id']
                }))

    def block_friend(self, data):
        from django.shortcuts import get_object_or_404

        user = self.check_jeton(data)
        friend = get_object_or_404(user.friends, id=data['id'])
        if friend:
            blackList = user.blackList.all()
            if friend not in blackList:
                user.blackList.add(friend)

    def changeLanguage(self, data):
        if data['value'] not in ['en','fr','es']:
            return
        user = self.check_jeton(data)
        user.language = data['value']
        user.save(hash_password=False)



def send_message(self, type, message):
    self.send(text_data=json.dumps({
        'type': type,
        'message': message,
    }))
