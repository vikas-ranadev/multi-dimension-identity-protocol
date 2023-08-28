FROM ubuntu:22.04

RUN apt-get update && apt-get install -y -q --no-install-recommends \
    apt-transport-https \
    build-essential \
    ca-certificates \
    curl \
    git \
    libssl-dev \
    wget \
    python3 \
    && rm -rf /var/lib/apt/lists/*


ENV NVM_DIR /usr/local/nvm
ENV NODE_VERSION 16.17.1
RUN mkdir $NVM_DIR
# Install nvm with node and npm
RUN curl https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash \
    && . $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default

# ENV NODE_PATH $NVM_DIR/v$NODE_VERSION/lib/node_modules
ENV PATH      $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

# Create app directory
# copy files from the project
COPY . /app
WORKDIR /app

# Install app dependencies
COPY package.json .
RUN npm install
# Bundle app source
ARG PORT

EXPOSE $PORT

CMD [ "npm", "start" ]