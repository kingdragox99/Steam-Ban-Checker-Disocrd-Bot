# Steam Ban Checker Discord Bot

this bot will check if a user has been monitored vac ban or ow ban

## Installation

Install Steam-Ban-Checker-Discord-Bot with yarn

[Discord api](https://discord.com/developers/applications)

[Mongo DB](https://www.mongodb.com/)

After putting that in console

```bash
  sudo apt update
  sudo apt upgrade
  sudo apt install curl
  sudo apt install screen
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt install nodejs
  sudo apt install npm
  sudo npm install -g npm@9.3.1
  sudo npm install --global yarn
  sudo apt install git
  screen -S ban-watch
  git clone https://github.com/kingdragox99/Steam-Ban-Checker-Discord-Bot.git
  cd Steam-Ban-Checker-Discord-Bot
  yarn
  node index.js
```

Create a .env in the file "Steam-Ban-Checker-Discord-Bot" with

```bash
CLIENT_TOKEN="YOUR_DISCORD_API_KEY"
MONGO_URL="YOUR_MONGODB_CONNECT"
```

Go on discord and type in channels

Example :

- Suspected cheater
- Confirmed cheater

```bash
  !setup input // In your input channel where you  put the url of suspected cheaters
  !setup output // If a cheater was detected, he will be put here
  !setup lang (fr/en/es) // Change lang FR EN ES
```
