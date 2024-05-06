import json
from channels.generic.websocket import WebsocketConsumer
from django.utils.crypto import get_random_string
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from copy import deepcopy
import time
import logging
import random

logging.basicConfig(level=logging.INFO)

class Tournament:
    def __init__(self, owner) -> None:
        self.owner = owner
        self.players : list = []
        self.winners : list = []
        self.games : list = []
        self.nb_games : int = 1
        self.event_post_save = ""
        self.launched : bool = False
        self.emergency : bool = False

    def reset(self) -> None:
        self.owner = None
        self.players : list = []
        self.winners : list = []
        self.games : list = []
        self.nb_games : int = 1
        self.event_post_save = ""
        self.launched : bool = False
        self.emergency : bool = False

tournament = None

def auto_inform():
    def decorator(func):
        def wrapper(self, *args, **kwargs):
            result = func(self, *args, **kwargs)
            global tournament
            if len(tournament.players) in [2, 4, 8, 16]:
                self.ready_to_launch()
            else:
                self.not_ready_to_launch()
            return result
        return wrapper
    return decorator


class TournamentConsumer(WebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.event = ""
        self.post_save_event = ""
        self.user = None

    players : list = []
    winners : list = []

    last_created_game : str = "" #id
    last_game_players : list = []

    tournament_games : list = []


    level : dict = {1 : "finale", 2 : "demi finale", 4 : "quart de finale", 8 : "8e de finale"}

    def ready_to_launch(self):
        global tournament
        if tournament.launched:
            return
        tournament.owner.send(text_data=json.dumps({'type' : 'ready'}))

    def not_ready_to_launch(self):
        global tournament
        if tournament.launched:
            return
        tournament.owner.send(text_data=json.dumps({'type' : 'not_ready'}))

    def desired_len(self):
        global tournament
        l = len(tournament.players)
        if l <= 2:
            return 2
        if l <= 4:
            return 4
        if l <= 8:
            return 8
        if l <= 16:
            return 16

    @auto_inform()
    def add_player(self, item):
        global tournament
        tournament.players.append(item)
        async_to_sync(self.channel_layer.group_add)(
            'tournament',
            self.channel_name
        )
        for _, i in enumerate(tournament.players):
            logging.info("inside for loop add player")
            i.send(text_data=json.dumps({'type' : 'update', 'pos' : len(tournament.players), 'len' : self.desired_len(), 'missing' : self.desired_len() - len(tournament.players)}))

    @auto_inform()
    def remove_player(self, item):
        global tournament
        tournament.players.remove(item)
        if tournament.launched:
            return
        for _, i in enumerate(tournament.players):
            logging.info("inside for loop remove player")
            i.send(text_data=json.dumps({'type' : 'update', 'pos' : len(tournament.players), 'len' : self.desired_len(), 'missing' : self.desired_len() - len(tournament.players)}))

    def add_games(self, event):
        global tournament
        next_step : bool = False

        from pong.models import Game
        game = Game.objects.get(game_id = event['game_id'])

        if game.scorep1 != 10:
            loser = game.player1.username
            winner = game.player2.username
        else:
            loser = game.player2.username
            winner = game.player1.username

        for i in tournament.players:
            if i.user.username == loser:
                tournament.players.remove(i)
                break

        if event['game_id'] not in tournament.games:
            tournament.games.append(event['game_id'])

        if winner not in tournament.winners:
            tournament.winners.append(winner)
            next_step = True

        if len(tournament.games) != 0 and len(tournament.winners) != 0 and len(tournament.games) == tournament.nb_games:
            tournament.winners = []
            tournament.games = []
            tournament.nb_games = len(tournament.players) // 2

        if next_step:
            self.tournament_step()

    def create_tournament_game(self, p1, p2):
        from pong.models import Game
        from accounts.models import Utilisateur
        from django.utils.crypto import get_random_string

        id = get_random_string(32)

        game = Game(
            player1 = p1.user,
            player2 = p2.user,
            is_tournament = True,
            game_id=id,
        )
        game.save()
        return id

    def tournament_winner(self):
        global tournament
        winner = tournament.players[0]
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            'tournament', {
                'type' : 'passthrough',
                'event' : 'announcement',
                'winner' : winner.user.username
            }
        )
        async_to_sync(channel_layer.group_send)(
            'tournament', {
                'type' : 'end_of_tournament',
            }
        )

    def tournament_step(self):
        global tournament
        logging.warning(f"tournament step len players {len(tournament.players)} for {self.user.username}")
        if len(tournament.players) == 1:
            return self.tournament_winner()

        p1, p2 = None, None

        if len(tournament.players) == 2:
            p1 = tournament.players[0]
            p2 = tournament.players[1]

        else:
            from copy import deepcopy
            import copy
            shuffled_players = copy.copy(tournament.players)
            random.shuffle(shuffled_players)
            for i in shuffled_players:
                if i.user.username in tournament.winners:
                    continue
                if p1 == None:
                    p1 = i
                elif p2 == None:
                    p2 = i
                    break

        channel_layer = get_channel_layer()

        async_to_sync(channel_layer.group_send)(
            'tournament', {
                'type' : 'passthrough',
                'event' : 'announcement',
                'player1' : p1.user.username,
                'player2' : p2.user.username,
                'level' : self.level[tournament.nb_games]
            }
        )
        id = self.create_tournament_game(p1, p2)
        async_to_sync(channel_layer.group_send)(
            'tournament', {
                'type' : 'passthrough',
                'event' : 'game',
                'game_id' : id
            }
        )

    def connect(self):
        import jwt
        from accounts.models import Utilisateur
        from dotenv import load_dotenv
        import os
        from asgiref.sync import async_to_sync
        from jwt import ExpiredSignatureError, DecodeError

        global tournament
        is_owner : bool = False

        load_dotenv()

        try :
            params = self.scope['query_string'].decode().split('&')
            jwt_token = params[0].split('=')[1]
            id_param = params[1].split('=')[1]
            jwt_payload = jwt.decode(jwt_token, os.getenv("JWT_SECRET"), algorithms=['HS256'])
            self.user = Utilisateur.objects.get(username=jwt_payload['sub'])
        except (ExpiredSignatureError, DecodeError):
            self.accept()
            self.send(text_data=json.dumps({'type' : 'emergency_break'}))
            async_to_sync(self.channel_layer.group_send)(
                f"user_{id_param}",
                {
                    'type': 'invalidJetonOtherWS',
                }
            )
            return()

        self.user.userstatus = 'in game'
        self.user.save(hash_password=False)

        if tournament is None:
            tournament = Tournament(self)
        tournament.emergency = False

        if self.user.username in [i.user.username for i in tournament.players]:
            self.accept()
            self.send(text_data=json.dumps({'error' : 'Already in tournament'}))
            self.close()
            return

        if len(tournament.players) == 16 or tournament.launched:
            self.accept()
            if not tournament.launched:
                self.send(text_data=json.dumps({"type" : "alert", "status" : "le tournoi est plein"}))
            else:
                self.send(text_data=json.dumps({"type" : "alert", "status" : "un tournoi est déjà en cours"}))
            self.close()
            return

        self.accept()
        self.user.userstatus = 'in game'
        self.user.save(hash_password=False)
        tournament.launched = False
        if len(tournament.players) == 0:
            is_owner = True
        self.send(text_data=json.dumps({'type' : 'info', 'owner' : is_owner, 'owner_name' : tournament.owner.user.username}))
        self.add_player(self)

    def tournament_start(self):
        global tournament
        tournament.launched = True
        tournament.nb_games = len(tournament.players) // 2
        self.tournament_step()

    def passthrough(self, event):
        logging.warn(f"Passthrough for {self.user.username}")
        if event.get('type') == 'passthrough':
            if event == self.event:
                logging.warn(f'passthrough return for {self.user.username}')
                return
            self.event = deepcopy(event)
            self.send(text_data=json.dumps(event))

    def post_save(self, event):
        global tournament
        logging.warn(f"Post save tournament is None : {tournament is None} for {self.user.username}")
        if tournament.emergency:
            logging.warn(f"Post save emergency for {self.user.username}")
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                'tournament', {
                    'type' : 'emergency_break',
                    'event' : 'An opponant has left the tournament, tournament is now broken. End of tournament'
                }
            )
            return

        if event.get('type') == 'post_save':
            if event == tournament.event_post_save:
                logging.warn(f'Post save return for {self.user.username}')
                return
            logging.info(f"a game will be created with id {event['game_id']}")
            tournament.event_post_save = deepcopy(event)
            self.add_games(event)

    def emergency_break(self, event):
        global tournament
        if event.get('type') == 'emergency_break':
            self.send(text_data=json.dumps(event))
            logging.warn(f"Emergency break before disconnect for {self.user.username}")
            self.disconnect(0)

    def end_of_tournament(self, event):
        logging.warn(f"End of tournament for {self.user.username}")
        if event.get('type') == 'end_of_tournament':
            self.disconnect(0)

    def receive(self, text_data=None, bytes_data=None):
        global tournament
        data = json.loads(text_data)
        if data.get("owner") == True and data.get("start") == True:
            if len(tournament.players) in [2, 4, 8, 16]:
                self.tournament_start()
            else:
                self.send(text_data=json.dumps({'type' : 'not_ready'}))

    def disconnect(self, code):
        self.user.userstatus = 'online'
        self.user.save(hash_password=False)

        global tournament
        if tournament is None:
            async_to_sync(self.channel_layer.group_discard)(
                'tournament',
                self.channel_name
            )
            self.close()
            return

        if len(tournament.players) and self == tournament.owner and not tournament.launched:
            if self in tournament.players:
                tournament.players.remove(self)

            self.user.userstatus = 'online'
            self.user.save(hash_password=False)
            self.close()
            for i in tournament.players:
                i.send(text_data=json.dumps({'type' : 'disconnect', 'message' : True, 'content' : "Owner has left the tournament, it's now closed"}))
                async_to_sync(i.channel_layer.group_discard)(
                    'tournament',
                    i.channel_name
                )
                i.close()
                i.user.userstatus = 'online'
                i.user.save(hash_password=False)

            tournament.reset()
            tournament = None
            return

        if tournament.launched and self in tournament.players:
            tournament.emergency = True

        if self in tournament.players:
            self.remove_player(self)

        async_to_sync(self.channel_layer.group_discard)(
            'tournament',
            self.channel_name
        )

        if len(tournament.players) == 0:
            tournament.reset()
            tournament = None
        self.close()