# Steam Ban Checker Discord Bot

this bot will check if a user has been monitored vac ban or ow ban

## Installation

Install Steam-Ban-Checker-Discord-Bot with yarn

[Discord api](https://discord.com/developers/applications)

[Mongo DB](https://www.mongodb.com/)

Make .env with

```bash
CLIENT_TOKEN="YOUR_DISCORD_API_KEY"
MONGO_URL="YOUR_MONGODB_CONNECT"
```

After putting that in console

```bash
  sudo apt update
  sudo apt upgrade
  sudo apt install curl
  curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash
  nvm install 18.12.1
  nvm use 18.12.1
  npm install --global yarn
  yarn
  node index.js
```

Go on discord and type in channels

Example :

- Suspected cheater
- Confirmed cheater

```bash
  !setup input // In your input channel where you  put the url of suspected cheaters
  !setup output // If a cheater was detected, he will be put here
```

![Logo](https://i.imgur.com/ErAZmVx.png)
