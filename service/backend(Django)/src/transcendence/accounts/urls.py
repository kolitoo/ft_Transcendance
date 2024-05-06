from django.urls import path
from . import views

app_name = "accounts"

urlpatterns = [
	path("verify_otp/", views.verify_otp, name='verify_otp'),
]