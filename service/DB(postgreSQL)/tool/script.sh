#!/bin/bash
set -e

#Connexion a PostgreSQL pour donner les privileges a USER sur la DB
psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "GRANT ALL PRIVILEGES ON DATABASE \"$POSTGRES_DB\" TO \"$POSTGRES_USER\";"
#Connexion a PostgreSQL pour generer des identifiants unique
psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"