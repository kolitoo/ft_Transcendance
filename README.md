# ft_transcendence *(125/125)*

Transcendence est un projet en groupe visant a faire un site web pour jouer a Pong.

# Nouveau Sujet

Ce projet reprends les consignes du nouveau sujet (v14.1). Nous avons choisi les modules suivants :
- Module majeur : Utiliser un framework en backend.
- Module mineur : Utiliser un framework ou toolkit en frontend.
- Module mineur : Utiliser une base de données en backend.
- Module majeur : Gestion utilisateur standard, authentification, utilisateurs en tournois.
- Module majeur : Implémenter une authentification à distance.
- Module majeur : Joueurs à distance
- Module majeur : Multijoueurs (plus de 2 dans la même partie)
- Module majeur : Clavardage en direct (live chat).
- Module mineur : Panneaux d’affichage (dashboards) d’utilisateurs et statistiques des parties.
- Module majeur : Implémenter l’authentification à 2 facteurs (2FA) et JWT (JSON Web Tokens).
- Module mineur : Étendre la compatibilité des navigateurs web.
- Module mineur : Support de multiple langues

Il faut 7 modules majeurs pour valider le projet. Deux modules mineurs sont l’équivalent d’un module majeur. Pour les bonus : un module mineur vaut 5 points et un module majeur 10 points.

# Configuration

Creez un fichier .env comme suit `service/backend(Django)/conf/.env`
```
# Client secret of 42 api
CLIENT_SECRET=
# Your Json webtoken secret
JWT_SECRET=
# the ip address of your computer or 127.0.0.1
IP_ADDR=
```
Et un deuxieme fichier .env dans `service/DB(postgreSQL)/env/.env`
```
POSTGRES_USER=user
POSTGRES_PORT=5432
POSTGRES_PASSWORD=password
POSTGRES_DB=database
POSTGRES_HOST=postgre
```
en completant les information necessaire

# Make and enjoy
Pour lancer le site :

```make```

# Precission sur le projet et les modules

Le projet doit etre sous forme de SPA (single page application). Et ne pouvant utiliser que bootstrap cote frontend, beaucoup de manipulation du DOM sont faite a la main dans le js.

### - Gestion utilisateur standard, authentification, utilisateurs en tournois.

Stockage des informations utilisateur dans une base de donnée PostgreSQL. Systeme d'authentification géré en python. Interface de recherche (ajout/suppression) d'amis.

### - Implémenter une authentification à distance.

Utilisation de l'API de 42 afin de s'authentifier grâce à un compte de l'école 42.

### - Joueurs à distance

Les websockets sont parti integrante du projet, pour faire ce module il fallait juste refaire le comportement de pong cote serveur et envoyer les informations relatives a la balles et la position des paddles des joueurs au front grace a websocket.

### - Multijoueurs (plus de 2 dans la même partie)

Nous avons decider de faire un pong a 4 joueurs. Le pong a 2 joueurs existait deja plus qu'a l'adapter pour 4 joueurs !

### Clavardage en direct (live chat).

Simple gestion de websocket et de channel layer de django.

### Panneaux d’affichage (dashboards) d’utilisateurs et statistiques des parties.

Permet d'aller voir le profil d'un amis et d'affiché les statistiques de ce dernier et d'aller voir les statistiques d'une partie. Les statistiques s'affichent sous forme de graphiques canvas.

### Implémenter l’authentification à 2 facteurs (2FA) et JWT (JSON Web Tokens).

Possibilité pour l'utilisateur d'activer la 2FA avec Google Authentificator via un QRcode. Mise en place d'une authentification sécurisé sur tout le site grâce a l'utilisation d'un JSON Web Token.

### Étendre la compatibilité des navigateurs web.

Pour valider ce module il suffit d'avoir un type de navigateur en plus que Google Chrome. Ce projet fonctionne sous tout navigateur chromium et FireFox

### Support de multiple langues

Simple gestion de json contenant toutes les strings a traduire. La traduction est dynamique et ne requiert pas de refresh.
