FROM grafana/grafana

ENV   GF_SECURITY_DISABLE_INITIAL_ADMIN_CREATION: "true" \
      GF_AUTH_ANONYMOUS_ENABLED: "true" \
      GF_AUTH_ANONYMOUS_ORG_ROLE: "Admin" \
      GF_AUTH_DISABLE_SIGNOUT_MENU: "true" \
      GF_AUTH_DISABLE_LOGIN_FORM: "true"

COPY ./grafana.ini /etc/grafana/grafana.ini
