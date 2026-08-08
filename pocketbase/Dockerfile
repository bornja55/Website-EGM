FROM alpine:3.20 AS download
ARG PB_VERSION=0.39.5
RUN apk add --no-cache unzip curl ca-certificates
WORKDIR /pb
RUN curl -sL "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" -o pb.zip \
    && unzip pb.zip pocketbase \
    && rm pb.zip \
    && chmod +x pocketbase

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
WORKDIR /pb
COPY --from=download /pb/pocketbase /pb/pocketbase
COPY pb_migrations /pb/pb_migrations

EXPOSE 8090
ENTRYPOINT ["/pb/pocketbase"]
CMD ["serve", "--http=0.0.0.0:8090"]
