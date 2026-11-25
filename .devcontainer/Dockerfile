FROM debian:bookworm-slim@sha256:e67eeead736ff7bbe258ef088bff683635c561b1fcfefad0806c1df4ab49ce0e

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl git python3 tar gzip zstd libgmp10 libatomic1 gcc libc6-dev

WORKDIR /opt/formal-bootstrap
COPY toolchains.json ./toolchains.json
COPY scripts/setup.py ./scripts/setup.py
ENV FORMAL_TOOLS=/opt/formal-tools
RUN python3 scripts/setup.py --tools-only

ENV ELAN_HOME=/opt/formal-tools/elan \
    JAVA_HOME=/opt/formal-tools/java \
    PATH=/opt/formal-tools/node/bin:/opt/formal-tools/pnpm-native:/opt/formal-tools/elan/bin:/opt/formal-tools/java/bin:$PATH
WORKDIR /workspaces/formal-methods-lab
