FROM alpine:3.20

ARG PB_VERSION=0.25.9

RUN apk add --no-cache ca-certificates unzip wget

WORKDIR /pb

RUN wget -q "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" -O pocketbase.zip \
    && unzip pocketbase.zip pocketbase \
    && rm pocketbase.zip \
    && chmod +x pocketbase

COPY pb_migrations/ ./pb_migrations/
COPY pb_hooks/ ./pb_hooks/

EXPOSE ${PORT:-8090}

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

CMD ["sh", "./entrypoint.sh"]
