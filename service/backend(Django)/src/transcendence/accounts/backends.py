# accounts/backends.py

from django.contrib.auth.backends import ModelBackend
from .models import Utilisateur

class CustomAuthBackend(ModelBackend):
    def authenticate(self, request=None, username=None, password=None, **kwargs):
        try:
            user = Utilisateur.objects.get(username=username)
        except Utilisateur.DoesNotExist:
            return None

        if user.check_password(password):
            return user

    def get_user(self, user_id):
        try:
            return Utilisateur.objects.get(pk=user_id)
        except Utilisateur.DoesNotExist:
            return None
