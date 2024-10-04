# Steam Ban Checker Discord Bot

this bot will check if a user has been monitored vac ban or ow ban

WIP project please report bug and crash

## Installation

Install Steam-Ban-Checker-Discord-Bot with yarn

[Discord API](https://discord.com/developers/applications)

[SUPA BASE](https://www.supabase.com/)

[Steam API Key](https://steamcommunity.com/dev/apikey)

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
  nano .env <---- /!\ and add .env step with your api key /!\
  yarn
  node index.js
```

Create a .env in the file "Steam-Ban-Checker-Discord-Bot" with

```bash
SUPABASE_URL = "SUPA BASE API URL"
SUPABASE_KEY = "SUPA BASE API KEY"
CLIENT_TOKEN = "=DISCORD BOT API KEY"
STEAM_API = "STEAM API KEY"
CRAWLER_SEED = "https://steamcommunity.com/id/Panicillin" <- steam profile url
```

Structure de la db supabase

```sql
CREATE TABLE profil (
    id SERIAL PRIMARY KEY,
    id_server TEXT,
    watcher_user TEXT,
    url VARCHAR,
    watch_user TEXT,
    ban BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE discord (
    id SERIAL PRIMARY KEY,
    id_server TEXT,
    inpute TEXT,
    output TEXT,
    lang TEXT
);
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
