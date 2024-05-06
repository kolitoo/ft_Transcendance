from django.db import models
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import AbstractBaseUser
from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.db.models.signals import m2m_changed
from pong.models import Game
from django.conf import settings
import logging

class Utilisateur(AbstractBaseUser):
    username = models.CharField(max_length=100, unique=True)
    firstname = models.CharField(max_length=100)
    lastname = models.CharField(max_length=100)
    password = models.CharField(max_length=100)
    last_login = models.DateTimeField(auto_now=True)
    avatar = models.ImageField(upload_to='avatar/', null=True, blank=True, default='avatar/avatar_de_base.png')
    friends = models.ManyToManyField('self', related_name='friends', blank=True)
    games = models.ManyToManyField(Game, related_name='games', blank=True)
    userstatus = models.CharField(max_length=50, default='offline')
    id_42 = models.CharField(max_length=100)
    secret_code = models.CharField(max_length=255)
    jti = models.CharField(max_length=255)
    blackList = models.ManyToManyField('self', related_name='blocked', blank=True, symmetrical=False)
    language = models.CharField(max_length=5)

    USERNAME_FIELD = 'username'
    def save(self, *args, **kwargs):
        hash_password = kwargs.pop('hash_password', True)
        #Hachage mdp avant de save
        if hash_password:
            self.password = make_password(self.password)
        super(Utilisateur, self).save(*args, **kwargs)

    def avatar_url(self):
        if self.avatar:
            return settings.MEDIA_URL + str(self.avatar)
        else:
            return None

class DemandeAmi(models.Model):
    expediteur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='demandes_envoyees')
    destinataire = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='demandes_recues')
    expediteur_username = models.CharField(max_length=100, null=True, blank=True)
    cree_le = models.DateTimeField(auto_now_add=True)

class Invite(models.Model):
    from_user = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name="invite_from")
    to_user = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name="invite_to")
    status = models.CharField(default='pending')
    game_id = models.CharField(default='')

@receiver(post_save, sender=Invite)
def invite_to_game(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        import logging
        logging.info("invite will be send to user invited")
        async_to_sync(channel_layer.group_send)(
            f"user_{instance.to_user.id}", {
                'type' : 'invite_friend_to_game',
                'from' : instance.from_user.id,
                'from_user_name' : instance.from_user.username
            }
        )

@receiver(post_save, sender=Invite)
def send_game_id(sender, instance, created, **kwargs):
    if not created:
        channel_layer = get_channel_layer()
        if instance.status == 'accepted':
            async_to_sync(channel_layer.group_send)(
                f"user_{instance.from_user.id}", {
                    'type' : 'chat_to_pong_game',
                    'game_id' : instance.game_id
                }
            )
            async_to_sync(channel_layer.group_send)(
                f"user_{instance.to_user.id}", {
                    'type' : 'chat_to_pong_game',
                    'game_id' : instance.game_id
                }
            )
        if instance.status == 'denied':
            async_to_sync(channel_layer.group_send)(
                f"user_{instance.from_user.id}", {
                    'type' : "invitation_denied",
                    'id' : instance.to_user.id
                }
            )


@receiver(post_save, sender=Utilisateur)
def friend_status_chang(sender, instance, created, **kwargs):
    if not created and not instance.id == sender.id:
        channel_layer = get_channel_layer()
        amis = instance.friends.all()
        for ami in amis:
            async_to_sync(channel_layer.group_send)(
                    f'user_{ami.id}', {
                        'type': 'friend_status.change',
                        'avatar': instance.avatar.url,
                        'friend_id': instance.id,
                        'userstatus': instance.userstatus,
                        'username': instance.username
                    }
                )

@receiver(post_save, sender=DemandeAmi)
def demandeami_status_change(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{instance.destinataire.id}" , {
                'type': 'demandeami_status.change',
                'from_id': instance.expediteur.id,
                'to_id': instance.destinataire.id,
                'ask_id': instance.id,
                'username': instance.expediteur.username,
            }
        )

@receiver(m2m_changed, sender=Utilisateur.friends.through)
def friend_status_change(sender, instance, action, **kwargs):
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
        f"user_{instance.id}",
        {
            'type': 'friendlist.change',
			'friendlist_change': True,
			'username': instance.username
		})


#Pour serializer les donner -> les convertir en Json, on peut pas le mettre ailleur sinon inclusion circulaire

from rest_framework import serializers

class UtilisateurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Utilisateur
        fields = ['id', 'username', 'firstname', 'lastname', 'avatar', 'userstatus']

class DemandeAmiSerializer(serializers.ModelSerializer):
    class Meta:
        model = DemandeAmi
        fields = ['id', 'expediteur', 'destinataire', 'expediteur_username', 'cree_le']


class Message(models.Model):
    from_user = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name="messages_from_me")
    to_user = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name="messages_to_me")
    content = models.CharField(max_length=512)
    timestamp = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)

@receiver(post_save, sender=Message)
def friendMessageSaved(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{instance.to_user.id}" , {
                'type': 'friend_message_receive',
                'from': instance.from_user.id,
                'content': instance.content,
                'time': instance.timestamp.strftime("%m/%d/%Y\n %H:%M:%S"),
                'msg-id' : instance.id
            }
        )
