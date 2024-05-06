from django.urls import path
from accounts.consumer import FriendStatusConsumer

websocket_index = [
    path("ws/index/", FriendStatusConsumer.as_asgi()),
]