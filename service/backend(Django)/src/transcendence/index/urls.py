from django.urls import path
from . import views

app_name = "index"

urlpatterns = [
    path("", views.index, name='index'),
    path("auth_callback/", views.auth_callback, name="auth_callback"),
    path("accounts/me/", views.returnIndex, name='my_account'),
    path("accounts/friends/<str:friendId>/", views.returnIndex, name='friend_profile'),
    path("chat/friends/<str:friendId>/", views.returnIndex, name='chat'),
    path("game-history/<str:game_id>/", views.returnIndex, name='game-history'),
    path("accounts/username/<str:friendId>/", views.returnIndex, name='username_profile'),
]