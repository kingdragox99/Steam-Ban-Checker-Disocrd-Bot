# Steam Ban Checker Discord Bot

this bot will check if a user has been monitored vac ban or ow ban

WIP project please report bug and crash

## Installation

Install Steam-Ban-Checker-Discord-Bot with yarn

[Discord api](https://discord.com/developers/applications)

[SUPA BASE](https://www.supabase.com/)

After putting that in console

```bash
  sudo apt update
  sudo apt upgrade
  sudo apt install curl
  sudo apt install screen
  sudo apt install git
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install nodejs
  sudo apt install npm
  sudo npm install --global yarn
  screen -S ban-watch
  git clone https://github.com/kingdragox99/Steam-Ban-Checker-Discord-Bot.git
  cd Steam-Ban-Checker-Discord-Bot
  cat .env
  nano .env <---- /!\ and add .env step line with your api key /!\
  yarn
  node index.js
```

Create a .env in the file "Steam-Ban-Checker-Discord-Bot" with

```bash
SUPABASE_URL = "SUPA BASE API URL"
SUPABASE_KEY = "SUPA BASE API KEY"
CLIENT_TOKEN = "=DISCORD BOT API KEY"
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
