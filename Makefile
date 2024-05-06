# Demarre tout les conteneurs
start:
	docker compose up -d --build

test:
	docker compose up -d --build
	google-chrome --incognito --new-window --auto-open-devtools-for-tabs --proceed-to=127.0.0.1 "https://127.0.0.1:8080" > /dev/null 2>&1 &


# Arrete tout les conteneurs
stop:
	docker compose down

re:	stop start

# Supprime les conteneurs, images, reseaux
clean:
	docker rmi $$(docker images -a -q)
	docker system prune -f
# ⚠️Supprime tout les volumes(dont la database)⚠️
clean-volumes:
	docker volume rm $$(docker volume ls -q)

.Phony: start stop clean clean-volumes re