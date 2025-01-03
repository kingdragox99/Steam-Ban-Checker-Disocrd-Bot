# STEAM BAN TRACKER

Steam Ban Tracker consists of 3 things: a crawler that seeks to find as many Steam profiles as possible, a discord bot that allows users to monitor players they find suspicious, and a verification mechanism that checks whether a profile in the database has just been banned.

WIP project please report bug and crash

You can find data visualization here: [SBT Web UI](https://steam-ban-tracker-web-ui.vercel.app/)

[SBT Web UI Github](https://github.com/kingdragox99/STEAM-BAN-TRACKER-WEB-UI)

## Installation

Please read everything carefully!

You need to create an account and get an API key from the following websites:

[Discord API](https://discord.com/developers/applications)
[SUPABASE](https://www.supabase.com/)
[Steam API](https://steamcommunity.com/dev/apikey)

Run the following commands in terminal:

```bash
# System update
sudo apt update
sudo apt upgrade

# Dependencies installation
sudo apt install curl git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs
sudo apt install npm
sudo npm install --global yarn
sudo npm install pm2 -g

# Project installation
git clone https://github.com/kingdragox99/STEAM-BAN-TRACKER.git
cd STEAM-BAN-TRACKER
cp .env.example .env
nano .env  # Configure your API keys here
yarn install

# Starting with PM2
pm2 start index.js --name "steam-ban-tracker"
pm2 save
pm2 startup  # To auto-start on reboot
```

Create a .env file in the "Steam-Ban-Checker-Discord-Bot" folder with:

```bash
SUPABASE_URL = "SUPA BASE API URL"
SUPABASE_KEY = "SUPA BASE API KEY"
CLIENT_TOKEN = "DISCORD BOT API KEY"
STEAM_API = "STEAM API KEY"
CRAWLER_SEED = "https://steamcommunity.com/id/El_Papite/" # Steam profile URL
DEBUG = false or true
```

Supabase database structure:

```sql
CREATE TABLE profil (
    id SERIAL PRIMARY KEY,
    status TEXT
    url VARCHAR,
    steam_name TEXT,
    ban BOOLEAN NOT NULL DEFAULT FALSE,
    ban_type TEXT
    ban_date TIMESTAMP
    last_checked TIMESTAMP
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

Example:

- Suspected cheater
- Confirmed cheater

```bash
  /setup input // In your input channel where you put the url of suspected cheaters
  /setup output // If a cheater was detected, he will be put here
  /setup lang (fr/en/es) // Change lang FR EN ES
```

## Supported Languages

The bot is available in the following languages:

- 🇫🇷 French (fr_FR)
- 🇬🇪 French (Belgium) (fr_BE)
- 🇬🇧 English (en_EN)
- 🇪🇸 Spanish (es_ES)
- 🇩🇪 German (de_DE)
- 🇦🇹 German (Austria) (de_AT)
- 🇵🇱 Polish (pl_PL)
- 🇩🇰 Danish (da_DK)
- 🇹🇷 Turkish (tr_TR)
- 🇳🇱 Dutch (nl_NL)
- 🇧🇪 Dutch (Belgium) (nl_BE)
- 🇷🇺 Russian (ru_RU)
- 🇨🇳 Chinese (zh_CN)
- 🇯🇵 Japanese (ja_JP)
- 🇰🇷 Korean (ko_KR)
- 🇹🇭 Thai (th_TH)
- 🇸🇪 Swedish (sv_SE)
- 🇫🇮 Finnish (fi_FI)
- 🇵🇹 Portuguese (pt_PT)
- 🇧🇷 Portuguese (Brazil) (pt_BR)
- 🇸🇦 Arabic (Saudi Arabia) (ar_SA)
- 🇲🇦 Arabic (Morocco) (ar_MA)
- 🇦🇪 Arabic (UAE) (ar_AE)
- 🇮🇱 Hebrew (he_IL)

## Features

- Automatic detection of VAC, Game, and Trade bans
- Real-time Discord notifications
- Multilingual support
- Unlimited Steam profile monitoring
- Simple and intuitive interface
- Discord slash commands
- Automatic daily updates

## Configuration

Create a `.env` file at the root of the project with the following variables:

```env
CLIENT_TOKEN=your_discord_token
CLIENT_ID=your_client_id
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

## Commands

- `/setlang` - Change bot language
- `/setup` - Configure input/output channels
- `/stats` - Display statistics

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.
