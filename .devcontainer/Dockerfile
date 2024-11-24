FROM mcr.microsoft.com/vscode/devcontainers/base:ubuntu

# Install Node.js
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends wget \
    && cd /tmp \
    && wget https://nodejs.org/dist/v22.11.0/node-v22.11.0-linux-x64.tar.xz \
    && tar xf node-v22.11.0-linux-x64.tar.xz \
    && mv node-v22.11.0-linux-x64 /opt/node

ENV PATH=$PATH:/opt/node/bin

# Install Elm and friends
RUN npm install -g elm-land elm-test-rs elm
