from django import forms
from .models import Utilisateur
from django.core.exceptions import ValidationError
import re

class RegisterForm(forms.ModelForm):
    password2 = forms.CharField(widget=forms.PasswordInput(attrs={'class': "form-control form-control-lg", 'id': "password2_reg", 'placeholder': "Confirmer mot de passe"}),)
    
    class Meta:
        model = Utilisateur
        fields = ['username', 'firstname', 'lastname', 'avatar', 'password']
        widgets = {
        'username': forms.TextInput(attrs={'class': "form-control form-control-lg", 'id': "username_reg", 'placeholder': "Pseudo"}),
	    'firstname': forms.TextInput(attrs={'class': "form-control form-control-lg", 'id': "first_name_reg", 'placeholder': "Prénom"}),
	    'lastname': forms.TextInput(attrs={'class': "form-control form-control-lg", 'id': "last_name_reg", 'placeholder': "Nom"}),
        'avatar': forms.ClearableFileInput(attrs={'class': 'form-control form-control-lg', 'id': "avatar_reg", 'placeholder': "Avatar"}),
        'password': forms.PasswordInput(attrs={'class': "form-control form-control-lg", 'id': "password_reg", 'placeholder': "Mot de passe"}),
    }

    def clean_password(self):
        password = self.cleaned_data.get('password')

        if len(password) < 8:
            raise ValidationError("Le mot de passe doit contenir au moins 8 caracteres.")
        
        if not any(char.isupper() for char in password) or not any(char.islower() for char in password):
            raise ValidationError("Le mot de passe doit contenir au moins une majuscule et une minuscule.")
        
        if not any(char.isdigit() for char in password):
            raise ValidationError("Le mot de passe doit contenir au moins un chiffre.")
        
        username = self.cleaned_data.get('username')
        firstname = self.cleaned_data.get('firstname')
        lastname = self.cleaned_data.get('lastname')

        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            raise ValidationError("Le mot de passe doit contenir au moins un caractere special.")

        if username in password or firstname in password or lastname in password:
            raise ValidationError("Le mot de passe ne doit pas contenir le nom d'utilisateur ou le prenom ou le nom de famille.")
        
        return password
    
    def clean_password2(self):
        password1 = self.cleaned_data.get('password')
        password2 = self.cleaned_data.get('password2')

        if password1 and password2 and password1 != password2:
            raise ValidationError("Les mots de passe ne correspondent pas.")

        return password2
