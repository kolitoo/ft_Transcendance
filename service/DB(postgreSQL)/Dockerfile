FROM postgres:alpine

#Copie du script dans le docker au lancement le docker execute les scripts a cet endroit 
COPY ./tool/script.sh /docker-entrypoint-initdb.d

EXPOSE 5432

CMD [ "postgres" ]