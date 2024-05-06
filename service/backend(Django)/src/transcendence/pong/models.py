from django.db import models
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import time
import logging

logging.basicConfig(level=logging.INFO)
# Create your models here.
class Game(models.Model):
    player1 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='player1')
    player2 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='player2')
    scorep1 = models.IntegerField(default=0)
    scorep2 = models.IntegerField(default=0)
    is_tournament = models.BooleanField(default=False)
    game_id = models.CharField()
    created = models.DateTimeField(auto_now_add=True)
    game_data = models.JSONField(blank=False, null=True)

    # game_created = models.DateField(auto_now_add=True, unique=True)

    def save(self, *args, **kwargs):
        super(Game, self).save(*args, **kwargs)

class Game4by4(models.Model):
    player1 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='player_1')
    player2 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='player_2')
    player3 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='player_3')
    player4 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='player_4')
    scorep1 = models.IntegerField(default=0)
    scorep2 = models.IntegerField(default=0)
    scorep3 = models.IntegerField(default=0)
    scorep4 = models.IntegerField(default=0)
    is_tournament = models.BooleanField(default=False)
    game_id = models.CharField()
    created = models.DateTimeField(auto_now_add=True)

    # game_created = models.DateField(auto_now_add=True, unique=True)

    def save(self, *args, **kwargs):
        super(Game4by4, self).save(*args, **kwargs)

def	gameToDict(game):
    return {'type':'addGameToHistory',
            'player1':game.player1.username,
            'player2':game.player2.username,
            'score1':game.scorep1,
            'score2':game.scorep2,
            'game_id':game.game_id,
            'time' : game.created.strftime("%m/%d/%Y, %H:%M:%S"),
            'game_data' : game.game_data}

@receiver(post_save, sender=Game)
def game_save(sender, instance, created, **kwargs):
    if instance.is_tournament and not created:
        logging.info("about to send something to group tournament")
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            'tournament', {
                'type' : 'post_save',
                'event' : 'game_saved',
                'game_id' : instance.game_id
            }
        )

@receiver(post_save, sender=Game)
def game_finished(sender, instance, created, **kwargs):
    if not created:
        channel_layer = get_channel_layer()
        game = gameToDict(instance)
        game['type'] = 'game_saved'
        logging.info(instance.game_data)
        async_to_sync(channel_layer.group_send)(
            f'user_{instance.player1.id}', game
        )
        async_to_sync(channel_layer.group_send)(
            f'user_{instance.player2.id}', game
        )