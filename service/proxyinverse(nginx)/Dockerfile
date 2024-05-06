FROM nginx:alpine


RUN rm /etc/nginx/conf.d/default.conf

RUN mkdir -p /etc/nginx/ssl
RUN apk add openssl
RUN openssl req -x509 -nodes -days 666 -newkey rsa:4096 -out /etc/nginx/ssl/transcendence.crt -keyout /etc/nginx/ssl/transcendence.key -subj "/C=FR/ST=IDF/L=Paris/O=42/OU=42/CN=Transcendence/UID=teams"

COPY ../conf/nginx.conf /etc/nginx/conf.d/
RUN chmod 755 /etc/nginx/nginx.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]