FROM igraphql/nginx-unit:1.30.0-node20

LABEL maintainer="Matt Kryshak"

COPY source/app /app
WORKDIR /app

RUN set -ex \
    && apt-get update \
    && apt-get install --no-install-recommends --no-install-suggests -y \
        g++ \
        make \
        python3 \
    && npm install -g --unsafe-perm unit-http \
    && npm install -g node-prune \
    && npm install --omit=dev \
    && npm link unit-http \
    && node-prune \
    && npm uninstall -g node-prune \
    && apt autoremove -y g++ make python3 \
    && chown -R unit:unit /app \
    && chmod +x app.mjs

COPY source/unit /docker-entrypoint.d
