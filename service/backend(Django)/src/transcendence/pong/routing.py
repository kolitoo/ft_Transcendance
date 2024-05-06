from django.urls import path
from .consumer import PongConsumer
from .queue import QueueConsummer
from .tournament import TournamentConsumer
from .queue4by4 import Queue4by4Consummer
from .consumer4by4 import Pong4by4Consumer

websocket_urlpatterns = [
    path("ws/pong/<str:room>/", PongConsumer.as_asgi()),
    path("ws/pong4/<str:room>/", Pong4by4Consumer.as_asgi()),
    path("ws/pongqueue/", QueueConsummer.as_asgi()),
    path("ws/pongtournament/", TournamentConsumer.as_asgi()),
    path("ws/fourplayersqueue/", Queue4by4Consummer.as_asgi()),
]