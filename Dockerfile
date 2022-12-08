FROM node:16.14.2

USER root
RUN useradd -ms /bin/bash mdipuser && mkdir -p /app

# Create app directory
# copy files from the project
COPY . /app
RUN chown -R mdipuser:mdipuser /app && chmod 755 /app
WORKDIR /app
USER mdipuser


# Install app dependencies
COPY package.json .
# For npm@5 or later, copy package-lock.json as well
# COPY package.json package-lock.json .

RUN npm install

# Bundle app source
ARG PORT
COPY . .
EXPOSE $PORT

CMD [ "npm", "start" ]