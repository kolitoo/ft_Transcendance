FROM python:alpine

#Convention en python de mettre dans ce dossier du docker
WORKDIR /usr/src/app

# Install build dependencies
RUN apk add --no-cache build-base libffi-dev

RUN mkdir /usr/src/app/staticc

#Copie le fichier de configuration et dependance pour le projet a installer
COPY ./conf/* ./

RUN pip install --no-cache-dir -r requirement.txt

RUN python -m pip install -U channels["daphne"]

#Copie tout necessaire pour le backend dans le docker
COPY ./src/transcendence ./

COPY ./avatars/* ./media/avatar/


EXPOSE 8000

RUN chmod +x ./script.sh
ENTRYPOINT ["/usr/src/app/script.sh"]

CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "transcendence.asgi:application"]