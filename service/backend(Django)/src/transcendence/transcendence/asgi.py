"""
ASGI config for transcendence project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

# import os

# from django.core.asgi import get_asgi_application

# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')

# application = get_asgi_application()
import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application


# from index.routing import websocket_urlpatterns as ws_index
from accounts.routing import websocket_index as ws_index
from pong.routing import websocket_urlpatterns as ws_pong

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'transcendence.settings')

application = ProtocolTypeRouter(
	{
		"http": get_asgi_application(),
		"websocket":AuthMiddlewareStack(
		URLRouter(
			ws_index + ws_pong
		))
	}
)
