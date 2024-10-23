const axios = require("axios");
const cheerio = require("cheerio");
const { createClient } = require("@supabase/supabase-js");
const scapBan = require("./modules/scapBan.js");
const scapName = require("./modules/scapName.js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Fonction pour convertir les URLs personnalisées Steam en URLs avec steamID64
async function convertToSteamId64(profileUrl) {
  if (profileUrl.includes("/id/")) {
    const vanityUrl = profileUrl.split("/id/")[1].replace("/", "");
    const apiUrl = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${process.env.STEAM_API}&vanityurl=${vanityUrl}`;

    try {
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (data.response.success === 1) {
        const steamId64 = data.response.steamid;
        return `https://steamcommunity.com/profiles/${steamId64}/`;
      } else {
        console.error("\x1b[41m\x1b[1mERROR\x1b[0m: " + data.response.message);
        return null;
      }
    } catch (error) {
      console.error(
        "\x1b[41m\x1b[1mERROR\x1b[0m: when requesting the Steam API:",
        error.message
      );
      return null;
    }
  } else {
    return profileUrl;
  }
}

// Fonction pour récupérer les contacts d'un profil Steam depuis la page /friends/
async function fetchSteamFriends(profileUrl) {
  try {
    const friendsUrl = `${profileUrl}friends/`;
    const { data: html } = await axios.get(friendsUrl);
    const $ = cheerio.load(html);

    const contacts = [];
    $(".selectable_overlay").each((index, element) => {
      const contactUrl = $(element).attr("href");
      if (contactUrl) {
        contacts.push(contactUrl);
      }
    });

    return contacts;
  } catch (error) {
    console.error(
      "\x1b[41m\x1b[1mERROR\x1b[0m: \x1b[31mError retrieving Steam friends page:\x1b[31\x1b[0m " +
        error.message
    );
    return [];
  }
}

// Fonction pour obtenir le premier profil avec le statut 'pending'
async function getFirstPendingProfile() {
  const { data: pendingProfile, error } = await supabase
    .from("profil")
    .select("url")
    .eq("status", "pending")
    .limit(1);

  if (error) {
    console.error(
      "\x1b[41m\x1b[1mERROR\x1b[0m: when retrieving the pending profile:",
      error.message
    );
    return null;
  }

  if (pendingProfile.length === 0) {
    console.log("\x1b[43m\x1b[1mUSER\x1b[0m: No pending profiles found.");
    return null;
  }

  return pendingProfile[0].url;
}

// Fonction pour marquer un profil comme "in progress"
async function markProfileAsInProgress(profileUrl) {
  const { error } = await supabase
    .from("profil")
    .update({ status: "in_progress" })
    .eq("url", profileUrl);

  if (error) {
    console.error(
      `\x1b[41m\x1b[1mERROR\x1b[0m: when marking the profile as in progress: `,
      error.message
    );
  }
}

// Fonction pour ajouter un contact à la base de données dans la table "profil"
async function addContact(contactUrl) {
  const steamId64Url = await convertToSteamId64(contactUrl);
  if (!steamId64Url) {
    console.error(
      "\x1b[41m\x1b[1mERROR\x1b[0m: \x1b[31mCould not convert " +
        contactUrl +
        " to steamID64.\x1b[0m"
    );
    return;
  }

  const banStatus = await scapBan(steamId64Url);
  let banDate = null;
  if (banStatus) {
    try {
      const { data: html } = await axios.get(steamId64Url);
      const $ = cheerio.load(html);
      const banInfoText = $(".profile_ban_status").text();
      if (banInfoText.includes("Currently trade banned")) {
        console.log(
          `\x1b[43m\x1b[1mUSER\x1b[0m: \x1b[43m\x1b[1m${steamId64Url}\x1b[0m is currently trade banned. Skipping.`
        );
        return;
      }
      const match = banInfoText.match(/(\d+) day\(s\) since last ban/);
      if (match) {
        const daysSinceBan = parseInt(match[1], 10);
        banDate = new Date(
          Date.now() - daysSinceBan * 24 * 60 * 60 * 1000
        ).toISOString();
      }
    } catch (error) {
      console.error(
        "\x1b[41m\x1b[1mERROR\x1b[0m: \x1b[31mError retrieving ban information:\x1b[31\x1b[0m",
        error.message
      );
    }
  }

  const { data: existingContact, error: selectError } = await supabase
    .from("profil")
    .select("*")
    .eq("url", steamId64Url);

  if (selectError) {
    console.error(
      "\x1b[41m\x1b[1mERROR\x1b[0m: \x1b[31mError checking existing contact:\x1b[31\x1b[0m",
      selectError.message
    );
    return;
  }

  if (existingContact.length > 0) {
    console.log(
      `\x1b[43m\x1b[1mUSER\x1b[0m: \x1b[43m\x1b[1m${steamId64Url}\x1b[0m is already in the database.`
    );
    return;
  }

  const { error: insertError } = await supabase.from("profil").insert([
    {
      id_server: "crawler",
      watcher_user: "crawler",
      url: steamId64Url,
      watch_user: await scapName(steamId64Url),
      ban: banStatus,
      ban_date: banDate,
      status: "pending",
    },
  ]);

  if (insertError) {
    console.error(
      "\x1b[41m\x1b[1mERROR\x1b[0m: \x1b[31mError during database insertion:\x1b[0m",
      insertError.message
    );
  } else {
    console.log(
      `\x1b[43m\x1b[1mUSER\x1b[0m: \x1b[42m\x1b[1m${steamId64Url}\x1b[0m successfully added.`
    );
  }
}

// Fonction principale pour crawler un profil
async function crawlProfile(profileUrl) {
  // Marquer le profil comme 'in_progress'
  await markProfileAsInProgress(profileUrl);

  const contacts = await fetchSteamFriends(profileUrl);

  // Ajouter les contacts à la base de données
  for (const contactUrl of contacts) {
    await addContact(contactUrl);
  }

  // Marquer le profil comme terminé
  await markProfileAsDone(profileUrl);

  // Recommencer avec le prochain profil en 'pending'
  await crawlFirstPendingProfile();
}

// Fonction pour crawler le premier contact en `pending` ou le `startUrl` s'il est fourni
async function crawlFirstPendingProfile(startUrl = null) {
  const profileUrl = startUrl || (await getFirstPendingProfile());

  if (!profileUrl) {
    console.log(
      "\x1b[41m\x1b[1mERROR\x1b[0m: No pending profile available to crawl."
    );
    return;
  }

  await crawlProfile(profileUrl);
}

// Fonction pour marquer un profil comme terminé
async function markProfileAsDone(profileUrl) {
  const { error } = await supabase
    .from("profil")
    .update({ status: "done" })
    .eq("url", profileUrl);

  if (error) {
    console.error(
      `\x1b[41m\x1b[1mERROR\x1b[0m: when marking the profile as done: `,
      error.message
    );
  } else {
    console.log(
      `\x1b[43m\x1b[1mUSER\x1b[0m: \x1b[45m\x1b[1m${profileUrl}\x1b[0m marked as completed.`
    );
  }
}

// Lancer le crawler avec un profil de démarrage si fourni
crawlFirstPendingProfile();
