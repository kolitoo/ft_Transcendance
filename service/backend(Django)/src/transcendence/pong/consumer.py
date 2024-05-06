import json
from channels.generic.websocket import WebsocketConsumer
import logging
import time
import random
import threading

logging.basicConfig(level=logging.INFO)

class GameData:
    def __init__(self) -> None:
        self.global_time : float = time.perf_counter()
        self.time_per_round : list = []
        self.start_time_round : float = time.perf_counter()
        self.how_wins : list = []
        self.ball_speed : list = []
        self.global_hits : list = []
        self.hits : int = 0

    def player_streak(self, player):
        count = 0
        max_count = 0
        for i in self.how_wins:
            if i == player:
                count += 1
                max_count = max(max_count, count)
            else:
                count = 0
        return max_count

    def new_round(self):
        self.time_per_round.append(round(time.perf_counter() - self.start_time_round, 3))
        self.start_time_round = time.perf_counter()
        self.global_hits.append(self.hits)
        self.hits = 0

class PongVars:
    def __init__(self) -> None:
        self.xy = [0, 0]
        self.leftTop = [50, 50]
        self.posLeft = 50
        self.posRight = 50
        self.scoreLeft = 0
        self.scoreRight = 0
        self.game = None
        self.thread = None
        self.connected = threading.Event()
        self.lock = threading.Lock()
        self.updownLock = threading.Lock()
        self.connections : set = set()
        self.players : list = []
        self.updown : list = [[0,0], [0,0]]
        self.isgamesaved = False

    def reset(self) -> None:
        self.xy = [0, 0]
        self.leftTop = [50, 50]
        self.posLeft = 50
        self.posRight = 50
        self.scoreLeft = 0
        self.scoreRight = 0
        self.game = None
        self.thread = None
        self.connected = threading.Event()
        self.lock = threading.Lock()
        self.connections = set()
        self.players = []
        self.updown = [[0,0], [0,0]]

class Player:
    def __init__(self) -> None:
        self.username : str
        self.position : int
        self.other_username : str
        self.other_position : int

    def get_dict(self) -> dict:
        return {"username" : self.username, "position" : self.position}

gameDict : dict = dict()

class PongConsumer(WebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.room_name = None

    def connect(self):
        from pong.models import Game
        from accounts.models import Utilisateur
        from dotenv import load_dotenv

        load_dotenv()

        params = self.scope['query_string'].decode().split('&')
        id_param = params[1].split('=')[1]
        self.utilisateur = Utilisateur.objects.get(id=id_param)

        global gameDict
        self.room_name = self.scope['url_route']['kwargs']['room']

        vars = gameDict.get(self.room_name)
        if vars is None:
            vars = PongVars()
            gameDict.update({self.room_name : vars})

        rpr = [i.utilisateur.username for i in vars.connections]
        if self.utilisateur.username in rpr:
            logging.info(f"ALREADY IN CONNECTIONS {self.utilisateur.username}")
            self.accept()
            self.close()
            return

        self.accept()

        if vars.game is None:
            try:
                vars.game = Game.objects.get(game_id = self.room_name)
            except Game.DoesNotExist:
                vars.game = None
                return


        with vars.lock:
            vars.connections.add(self)

        player = Player()
        active_player = True
        if vars.game.player1.username == self.utilisateur.username:
            player.position = 1
            player.username = vars.game.player1.username
            player.other_position = 2
            player.other_username = vars.game.player2.username
            user = Utilisateur.objects.get(username = vars.game.player1.username)
            if not vars.game.is_tournament and user.userstatus != 'in game':
                user.userstatus = 'in game'
                user.save(hash_password=False)
            user.games.add(vars.game)
            vars.players.append(self)
        elif vars.game.player2.username == self.utilisateur.username:
            player.other_position = 1
            player.other_username = vars.game.player1.username
            player.position = 2
            player.username = vars.game.player2.username
            user = Utilisateur.objects.get(username = vars.game.player2.username)
            if not vars.game.is_tournament and user.userstatus != 'in game':
                user.userstatus = 'in game'
                user.save(hash_password=False)
            user.games.add(vars.game)
            vars.players.append(self)
        else:
            player.position = 1
            player.username = vars.game.player1.username
            player.other_position = 2
            player.other_username = vars.game.player2.username
            active_player = False

        self.send(text_data=json.dumps({'type' : 'first_connection',
                                        'username' : player.username,
                                        'position' : player.position,
                                        'other_username' : player.other_username,
                                        'other_position' : player.other_position,
                                        'room' : self.room_name,
                                        'active' : active_player
                                        }))

        if len(vars.players) == 2 and vars.thread is None:
            vars.thread = threading.Thread(target=self.ballLoop, args=(vars,))
            vars.thread.start()

    def playerKeypress(self, data):
        global gameDict

        vars : PongVars = gameDict.get(self.room_name)

        side = 1    # 0 = left, 1 = right
        key = 1     # 0 = up, 1 = down
        event = 0   # 0 = keyup, 1 = keydown

        if data['side'] == 1:
            side = 0
        if data['key'] == "up":
            key = 0
        if data['event'] == "keydown":
            event = 1

        with vars.updownLock:
            vars.updown[side][key] = event

    def receive(self, text_data=None, bytes_data=None):
        data = json.loads(text_data)
        if data['type'] == "move":
            self.playerKeypress(data)

    def disconnect(self, code):
        global gameDict

        vars : PongVars = gameDict.get(self.room_name)

        if self not in vars.players:
            if self in vars.connections:
                with vars.lock:
                    vars.connections.remove(self)
                    self.utilisateur.userstatus = 'online'
                    self.utilisateur.save(hash_password=False)
                    self.close()
            return

        if vars.scoreLeft < 10 and vars.scoreRight < 10:

            if vars.game.player1 == self.utilisateur:
                vars.game.scorep1 = vars.scoreLeft
                vars.game.scorep2 = 10
                for connection in vars.connections:
                    connection.send(text_data=json.dumps({'type' : 'point', 'side' : 2, 'points' : 10 }))

            elif vars.game.player2 == self.utilisateur:
                vars.game.scorep1 = 10
                vars.game.scorep2 = vars.scoreRight
                for connection in vars.connections:
                    connection.send(text_data=json.dumps({'type' : 'point', 'side' : 1, 'points' : 10 }))

            if not vars.isgamesaved:
                logging.info("game hard saved")
                vars.game.game_data = {"skip" : True}
                vars.game.save()
                vars.isgamesaved = True

            for player in vars.connections:
                    player.send(text_data=json.dumps({'type' : 'end'}))

        with vars.lock:
            vars.connections.remove(self)
        if self in vars.players:
            with vars.lock:
                vars.players.remove(self)
        # self.reset()

        if not vars.game.is_tournament:
            for connection in vars.connections:
                connection.utilisateur.userstatus = 'online'
                connection.utilisateur.save(hash_password=False)
                connection.close()

        vars.connected.set()
        if vars.thread:
            vars.thread.join()
        with vars.updownLock:
            vars.updown = [[0,0], [0,0]]
        vars.thread = None

    @classmethod
    def movePlayer(cls, side, vars : PongVars):
        step = 1
        pos = vars.posLeft
        if side == 1:
            pos = vars.posRight

        with vars.updownLock:
            if (vars.updown[side][0] and vars.updown[side][1]) or (not vars.updown[side][0] and not vars.updown[side][1]):
                return
            if vars.updown[side][0]:
                step *= -1
        #Collisions
        if step < 0:
            if (pos + step < 5):
                return
        elif step > 0:
            if (pos + step > 95):
                return
        pos += step
        if side == 0:
            vars.posLeft += step
        else:
            vars.posRight += step
        return {'type' : 'player_move', 'side' : side + 1, 'pos' : pos }

    @classmethod
    def ballLoop(cls, vars : PongVars):
        vars.scoreLeft = 0
        vars.scoreRight = 0

        time.sleep(1)
        a = 2/3

        data = GameData()

        step = 1

        vars.xy[0] = step
        rd = random.randint(1, 2)
        if rd == 2:
            vars.xy[0] = -step
        vars.xy[1] = random.uniform(-0.5, 0.5)

        while not vars.connected.is_set():
            #vertical hitbox
            if vars.leftTop[1] + vars.xy[1] < a or vars.leftTop[1] + vars.xy[1] > 100 - a:
                data.hits += 1
                vars.xy[1] *= -1

            #goal
            if vars.leftTop[0] + vars.xy[0] < 0.5 or vars.leftTop[0] + vars.xy[0] > 99.5:
                side = 0
                points = 0
                if vars.leftTop[0] + vars.xy[0] < 0.5:
                    vars.scoreRight += 1
                    side = 2
                    points = vars.scoreRight
                    vars.xy[0] = -step
                    data.how_wins.append(2)
                elif vars.leftTop[0] + vars.xy[0] > 99.5:
                    vars.scoreLeft += 1
                    side = 1
                    points = vars.scoreLeft
                    vars.xy[0] = step
                    data.how_wins.append(1)

                #reset
                vars.xy[1] = random.uniform(-0.5, 0.5)
                vars.leftTop = [50, 50]
                vars.posLeft = 50
                vars.posRight = 50
                data.new_round()
                with vars.lock:
                    for connection in vars.connections:
                        connection.send(text_data=json.dumps({'type' : 'point', 'side' : side, 'points' : points }))
                        connection.send(text_data=json.dumps({'type' : 'ball_move', 'left' : vars.leftTop[0], 'top' : vars.leftTop[1] }))
                        connection.send(text_data=json.dumps({'type' : 'player_move', 'side' : 1, 'pos' : vars.posLeft }))
                        connection.send(text_data=json.dumps({'type' : 'player_move', 'side' : 2, 'pos' : vars.posRight }))
                if vars.scoreLeft >= 10 or vars.scoreRight >= 10 :
                    vars.game.scorep1 = vars.scoreLeft
                    vars.game.scorep2 = vars.scoreRight
                    vars.game.game_data = {"time" : round(time.perf_counter() - data.global_time, 3), 
                                 "total_hits" : sum(data.global_hits), "least_hits" : min(data.global_hits), "max_hits" : max(data.global_hits), 
                                 "player1_streak" : data.player_streak(1), "player2_streak" : data.player_streak(2), 
                                 "quickest_round" : min(data.time_per_round), "longest_round" : max(data.time_per_round),
                                 "skip" : False,
                                 "time_per_round" : data.time_per_round, "hits_per_round" : data.global_hits, "ordered_wins" : data.how_wins}
                    vars.game.save()
                    logging.info("soft save")
                    end_dict = {'type' : 'end'}
                    with vars.lock:
                        if not vars.game.is_tournament:
                            for connection in vars.connections:
                                connection.send(text_data=json.dumps(end_dict))
                                connection.utilisateur.userstatus = 'online'
                                connection.utilisateur.save(hash_password=False)
                                connection.close()
                    break

            vars.leftTop[0] += vars.xy[0]
            vars.leftTop[1] += vars.xy[1]
            #Broadcast
            with vars.lock:
                movePlayer1 = cls.movePlayer(0, vars)
                movePlayer2 = cls.movePlayer(1, vars)
                for connection in vars.connections:
                    connection.send(text_data=json.dumps({'type' : 'ball_move', 'left' : vars.leftTop[0], 'top' : vars.leftTop[1], 'movePlayer1': movePlayer1, 'movePlayer2': movePlayer2 }))

            #paddle hitbox
            #left paddle
            if vars.xy[0] < 0 and vars.leftTop[0] <= 1.5 and vars.posLeft - 5 <= vars.leftTop[1] + 0.5 and vars.posLeft + 5 >= vars.leftTop[1] - 0.5:
                vars.xy[0] = step
                vars.xy[1] = (vars.leftTop[1] - vars.posLeft) / 11
                data.hits += 1
            #right paddle
            if vars.xy[0] > 0 and vars.leftTop[0] >= 98.5 and vars.posRight - 5 <= vars.leftTop[1] + 0.5 and vars.posRight + 5 >= vars.leftTop[1] - 0.5:
                vars.xy[0] = -step
                vars.xy[1] = (vars.leftTop[1] - vars.posRight) / 11
                data.hits += 1

            time.sleep(0.025)
