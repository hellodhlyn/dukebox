FROM node:14-slim

# Install prerequisites
RUN apt update -y
RUN apt install -y python3 build-essential ffmpeg

# Non-root user `app`
RUN useradd --create-home -s /bin/bash app
WORKDIR /home/app

# Install dependencies and build
COPY package.json .
COPY yarn.lock .
RUN yarn

COPY . .
RUN yarn build
RUN yarn --production

# Change to user `app`
RUN chown -R app:app /home/app
USER app

CMD [ "yarn", "start" ]
