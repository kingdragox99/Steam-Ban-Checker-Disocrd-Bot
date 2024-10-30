# STEAM BAN TRACKER

Steam Ban Tracker consists of 3 things: a crawler that seeks to find as many Steam profiles as possible, a discord bot that allows users to monitor players they find suspicious, and a verification mechanism that checks whether a profile in the database has just been banned.

WIP project please report bug and crash

You can found data visualisation here : [SBT Web UI](https://steam-ban-tracker-web-ui.vercel.app/)

[SBT Web UI Github](https://github.com/kingdragox99/STEAM-BAN-TRACKER-WEB-UI)

## Installation

Please read everything! !

You need to make an account / logging and get an API key on site bellow

[Discord API](https://discord.com/developers/applications)

[SUPABASE](https://www.supabase.com/)

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
  git clone https://github.com/kingdragox99/STEAM-BAN-TRACKER.git
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
CLIENT_TOKEN = "DISCORD BOT API KEY"
STEAM_API = "STEAM API KEY"
CRAWLER_SEED = "https://steamcommunity.com/id/El_Papite/" <- steam profile url
LOG_LEVEL = "debug"
```

Structure de la db supabase

```sql
CREATE TABLE profil (
    id SERIAL PRIMARY KEY,
    status TEXT
    url VARCHAR,
    steam_name TEXT,
    ban BOOLEAN NOT NULL DEFAULT FALSE,
    ban_type TEXT
    ban_date TIMESTAMP
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
