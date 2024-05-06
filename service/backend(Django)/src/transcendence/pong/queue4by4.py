import json
from channels.generic.websocket import WebsocketConsumer
from django.utils.crypto import get_random_string
import logging

logging.basicConfig(level=logging.INFO)

players : list = []

def auto_launch(length):
    def decorator(func):
        def wrapper(self, *args, **kwargs):
            result = func(self, *args, **kwargs)
            global players
            if len(players) >= length:
                self.launch_game()
            return result
        return wrapper
    return decorator


class Queue4by4Consummer(WebsocketConsumer):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    @auto_launch(4)
    def add_player(self, item):
        global players
        players.append(item)
        for c, p in enumerate(players):
            p.send(text_data=json.dumps({"in" : 1, "pos" : c + 1, "len" : len(players)}))

    def remove_player(self, item):
        global players
        p = None
        for i in players:
            if i.utilisateur.username == item.utilisateur.username:
                p = i
                break
        if p is None:
            logging.warn(f"player {item.utlisateur.username} not found in {[i.utilisateur.username for i in players]}")
            return
        
        players.remove(p)
        for c, p in enumerate(players):
            try:
                p.send(text_data=json.dumps({"in" : 1 , "pos" : c + 1, "len" : len(players)}))
            except:
                # flm
                pass

    def launch_game(self):
        from pong.models import Game4by4
        import random
        import copy
        p1, p2, p3, p4 = None, None, None, None
        shuffled_players = copy.copy(players)
        random.shuffle(shuffled_players)
        for c,i in enumerate(shuffled_players):
            if c == 0:
                p1 = i
            elif c == 1:
                p2 = i
            elif c == 2:
                p3 = i
            elif c == 3:
                p4 = i
            else:
                break

        if p1 is None or p2 is None or p3 is None or p4 is None:
            logging.warn("there's one None var here")
            return

        id = get_random_string(32)

        game = Game4by4(
            player1=p1.utilisateur,
            player2=p2.utilisateur,
            player3=p3.utilisateur,
            player4=p4.utilisateur,
            game_id=id,
        )
        game.save()

        p1.send(text_data=json.dumps({'out' : 1, 'path' : id}))
        p2.send(text_data=json.dumps({'out' : 1, 'path' : id}))
        p3.send(text_data=json.dumps({'out' : 1, 'path' : id}))
        p4.send(text_data=json.dumps({'out' : 1, 'path' : id}))
        p1.close()
        p2.close()
        p3.close()
        p4.close()
        self.remove_player(p1)
        self.remove_player(p2)
        self.remove_player(p3)
        self.remove_player(p4)

    def connect(self):
        import os
        from dotenv import load_dotenv
        import jwt
        from accounts.models import Utilisateur
        from asgiref.sync import async_to_sync

        load_dotenv()

        self.accept()
        try :
            params = self.scope['query_string'].decode().split('&')
            jwt_token = params[0].split('=')[1]
            id_param = params[1].split('=')[1]
            jwt_payload = jwt.decode(jwt_token, os.getenv("JWT_SECRET"), algorithms=['HS256'])
            self.utilisateur = Utilisateur.objects.get(username=jwt_payload['sub'])

        except:
            self.send(text_data=json.dumps({'close' : 'close'}))
            async_to_sync(self.channel_layer.group_send)(
                f"user_{id_param}",
                {
                    'type': 'invalidJetonOtherWS',
                }
            )
            return()

        global players
        if self.utilisateur.username not in [i.utilisateur.username for i in players]:
            self.add_player(self)
            self.utilisateur.userstatus = 'in game'
            self.utilisateur.save(hash_password=False)
        else:
            self.send(text_data=json.dumps({'error' : 'Already in queue'}))
            self.close()
            return

    def receive(self, text_data=None, bytes_data=None):
        pass

    def disconnect(self, code):
        if hasattr(self, 'utilisateur') and self.utilisateur is not None:
            global players
            if self.utilisateur.username in [i.utilisateur.username for i in players]:
                try:
                    self.remove_player(self)
                except ValueError:
                    pass
                self.utilisateur.userstatus = 'online'
                self.utilisateur.save(hash_password=False)
                self.close()
