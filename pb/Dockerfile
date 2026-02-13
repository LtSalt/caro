FROM alpine:3.20

ARG PB_VERSION=0.25.9

RUN apk add --no-cache ca-certificates unzip wget

WORKDIR /pb

RUN wget -q "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" -O pocketbase.zip \
    && unzip pocketbase.zip pocketbase \
    && rm pocketbase.zip \
    && chmod +x pocketbase

COPY pb_migrations/ ./pb_migrations/

EXPOSE ${PORT:-8090}

CMD sh -c "./pocketbase serve --http=0.0.0.0:${PORT:-8090} --dir=/pb_data --migrationsDir=./pb_migrations"
