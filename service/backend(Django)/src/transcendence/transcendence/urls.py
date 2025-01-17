"""
URL configuration for transcendence project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve

from index import views

from django.conf.urls import handler404

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('index.urls')),
    path('accounts/', include('accounts.urls')),
    path('pong/', include('pong.urls')),
    #Pour servir les medias la fonction serve on lui envoie tout apres media/ garce a l'expr <path:path>
    path('media/<path:path>', serve, {'document_root' : settings.MEDIA_ROOT}),
]

handler404 = views.error_404

urlpatterns += staticfiles_urlpatterns()
