import json
from channels.generic.websocket import WebsocketConsumer
import logging
import time
import random
import threading

logging.basicConfig(level=logging.INFO)

class PongVars:
    def __init__(self) -> None:
        self.xy = [0, 0]
        self.leftTop = [50, 50]
        self.posLeft = 50
        self.posRight = 50
        self.posTop = 50
        self.posBottom = 50
        self.scoreLeft = 0
        self.scoreRight = 0
        self.scoreTop = 0
        self.scoreBottom= 0
        self.game = None
        self.thread = None
        self.connected = threading.Event()
        self.lock = threading.Lock()
        self.updownLock = threading.Lock()
        self.connections : set = set()
        self.players : list = []
        self.updown : list = [[0,0], [0,0], [0,0], [0,0]]
        self.isgamesaved = False

    def reset(self) -> None:
        self.xy = [0, 0]
        self.leftTop = [50, 50]
        self.posLeft = 50
        self.posRight = 50
        self.posTop = 50
        self.posBottom = 50
        self.scoreLeft = 0
        self.scoreRight = 0
        self.scoreTop = 0
        self.scoreBottom= 0
        self.game = None
        self.thread = None
        self.connected = threading.Event()
        self.lock = threading.Lock()
        self.connections = set()
        self.players = []
        self.updown = [[0,0], [0,0], [0,0], [0,0]]

class Player:
    def __init__(self) -> None:
        self.left_username : str
        self.right_username : str
        self.top_username : str
        self.bottom_username : str

gameDict : dict = dict()

class Pong4by4Consumer(WebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.room_name = None

    def connect(self):
        from pong.models import Game4by4
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
                vars.game = Game4by4.objects.get(game_id = self.room_name)
            except Game4by4.DoesNotExist:
                vars.game = None
                return

        with vars.lock:
            vars.connections.add(self)

        player = Player()
        active_player = False
        position = 0
        if vars.game.player1.username == self.utilisateur.username:
            active_player = True
            position = 1
        elif vars.game.player2.username == self.utilisateur.username:
            active_player = True
            position = 2
        elif vars.game.player3.username == self.utilisateur.username:
            active_player = True
            position = 3
        elif vars.game.player4.username == self.utilisateur.username:
            active_player = True
            position = 4
        else:
            self.send(text_data=json.dumps({'type' : 'error'}))
            self.close()
            return

        player.left_username = vars.game.player1.username
        player.right_username = vars.game.player2.username
        player.top_username = vars.game.player3.username
        player.bottom_username = vars.game.player4.username
        if not vars.game.is_tournament and self.utilisateur.userstatus != 'in game':
            self.utilisateur.userstatus = 'in game'
            self.utilisateur.save(hash_password=False)
        # self.utilisateur.games.add(vars.game)
        vars.players.append(self)

        self.send(text_data=json.dumps({'type' : 'first_connection',
                                        'top_username' : player.top_username,
                                        'bottom_username' : player.bottom_username,
                                        'left_username' : player.left_username,
                                        'right_username' : player.right_username,
                                        'room' : self.room_name,
                                        'active' : active_player,
                                        'player_side' : position
                                        }))

        if len(vars.players) == 4 and vars.thread is None:
            vars.thread = threading.Thread(target=self.ballLoop, args=(vars,))
            vars.thread.start()

    def playerKeypress(self, data):
        global gameDict

        vars : PongVars = gameDict.get(self.room_name)

        side = 1    # 0 = left, 1 = right, 2 = top, 3 = bottom
        key = 1     # 0 = up or left, 1 = down or right,
        event = 0   # 0 = keyup, 1 = keydown

        side = data['side'] - 1
        if data['key'] == "up":
            key = 0
        if data['key'] == "left":
            key = 0
        if data['key'] == "right":
            key = 1
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

        if vars.scoreLeft < 10 and vars.scoreRight < 10:
            for player in vars.connections:
                    player.send(text_data=json.dumps({'type' : 'end'}))

        with vars.lock:
            vars.connections.remove(self)
        if self in vars.players:
            with vars.lock:
                vars.players.remove(self)
        # self.reset()

        with vars.lock:
            for connection in vars.connections:
                connection.utilisateur.userstatus = 'online'
                connection.utilisateur.save(hash_password=False)
                connection.close()

        vars.connected.set()
        if vars.thread:
            vars.thread.join()
        with vars.updownLock:
            vars.updown = [[0,0], [0,0], [0,0], [0,0]]
        vars.thread = None

    @classmethod
    def movePlayer(cls, side, vars : PongVars):
        step = 1
        pos = vars.posLeft
        if side == 1:
            pos = vars.posRight
        elif side == 2:
            pos = vars.posTop
        elif side == 3:
            pos = vars.posBottom

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
        elif side == 1:
            vars.posRight += step
        elif side == 2:
            vars.posTop += step
        elif side == 3:
            vars.posBottom += step
        return {'type' : 'player_move', 'side' : side + 1, 'pos' : pos }

    @classmethod
    def ballLoop(cls, vars : PongVars):
        vars.scoreLeft = 0
        vars.scoreRight = 0
        vars.scoreTop = 0
        vars.scoreBottom = 0

        time.sleep(1)

        step = 1

        rd = random.randint(1, 4)
        if rd == 1:
            vars.xy[0] = -step
            vars.xy[1] = random.uniform(-0.5, 0.5)
        elif rd == 2:
            vars.xy[0] = step
            vars.xy[1] = random.uniform(-0.5, 0.5)
        elif rd == 3:
            vars.xy[1] = -step
            vars.xy[0] = random.uniform(-0.5, 0.5)
        elif rd == 4:
            vars.xy[1] = step
            vars.xy[0] = random.uniform(-0.5, 0.5)

        while not vars.connected.is_set():
            #goal
            if vars.leftTop[0] + vars.xy[0] < 0.5 or vars.leftTop[0] + vars.xy[0] > 99.5 or vars.leftTop[1] + vars.xy[1] < 0.5 or vars.leftTop[1] + vars.xy[1] > 99.5:
                side = 0
                points = 0
                if vars.leftTop[0] + vars.xy[0] < 0.5:
                    vars.scoreRight += 1
                    side = 2
                    points = vars.scoreRight
                    vars.xy[0] = -step
                    vars.xy[1] = random.uniform(-0.5, 0.5)
                elif vars.leftTop[0] + vars.xy[0] > 99.5:
                    vars.scoreLeft += 1
                    side = 1
                    points = vars.scoreLeft
                    vars.xy[0] = step
                    vars.xy[1] = random.uniform(-0.5, 0.5)
                elif vars.leftTop[1] + vars.xy[1] < 0.5:
                    vars.scoreBottom += 1
                    side = 4
                    points = vars.scoreBottom
                    vars.xy[1] = -step
                    vars.xy[0] = random.uniform(-0.5, 0.5)
                elif vars.leftTop[1] + vars.xy[1] > 99.5:
                    vars.scoreTop += 1
                    side = 3
                    points = vars.scoreTop
                    vars.xy[1] = step
                    vars.xy[0] = random.uniform(-0.5, 0.5)

                #reset
                vars.leftTop = [50, 50]
                vars.posLeft = 50
                vars.posRight = 50
                vars.posTop = 50
                vars.posBottom = 50
                with vars.lock:
                    for connection in vars.connections:
                        connection.send(text_data=json.dumps({'type' : 'point', 'side' : side, 'points' : points }))
                        connection.send(text_data=json.dumps({'type' : 'ball_move', 'left' : vars.leftTop[0], 'top' : vars.leftTop[1] }))
                        connection.send(text_data=json.dumps({'type' : 'player_move', 'side' : 1, 'pos' : vars.posLeft }))
                        connection.send(text_data=json.dumps({'type' : 'player_move', 'side' : 2, 'pos' : vars.posRight }))
                        connection.send(text_data=json.dumps({'type' : 'player_move', 'side' : 3, 'pos' : vars.posTop }))
                        connection.send(text_data=json.dumps({'type' : 'player_move', 'side' : 4, 'pos' : vars.posBottom }))
                if vars.scoreLeft >= 10 or vars.scoreRight >= 10 or vars.scoreTop >= 10 or vars.scoreBottom >= 10:
                    end_dict = {'type' : 'end'}
                    with vars.lock:
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
                movePlayer3 = cls.movePlayer(2, vars)
                movePlayer4 = cls.movePlayer(3, vars)
                for connection in vars.connections:
                    connection.send(text_data=json.dumps({'type' : 'ball_move', 'left' : vars.leftTop[0], 'top' : vars.leftTop[1], 'movePlayer1': movePlayer1, 'movePlayer2': movePlayer2, 'movePlayer3': movePlayer3, 'movePlayer4': movePlayer4 }))
            #paddle hitbox
            #left paddle
            if vars.xy[0] < 0 and vars.leftTop[0] <= 1.5 and vars.posLeft - 5 <= vars.leftTop[1] + 0.5 and vars.posLeft + 5 >= vars.leftTop[1] - 0.5:
                vars.xy[0] = step
                vars.xy[1] = (vars.leftTop[1] - vars.posLeft) / 11
            #right paddle
            if vars.xy[0] > 0 and vars.leftTop[0] >= 98.5 and vars.posRight - 5 <= vars.leftTop[1] + 0.5 and vars.posRight + 5 >= vars.leftTop[1] - 0.5:
                vars.xy[0] = -step
                vars.xy[1] = (vars.leftTop[1] - vars.posRight) / 11
            #top paddle
            if vars.xy[1] < 0 and vars.leftTop[1] <= 1.5 and vars.posTop - 5 <= vars.leftTop[0] + 0.5 and vars.posTop + 5 >= vars.leftTop[0] - 0.5:
                vars.xy[1] = step
                vars.xy[0] = (vars.leftTop[0] - vars.posTop) / 11
            #bottom paddle
            if vars.xy[1] > 0 and vars.leftTop[1] >= 98.5 and vars.posBottom - 5 <= vars.leftTop[0] + 0.5 and vars.posBottom + 5 >= vars.leftTop[0] - 0.5:
                vars.xy[1] = -step
                vars.xy[0] = (vars.leftTop[0] - vars.posBottom) / 11

            time.sleep(0.025)
