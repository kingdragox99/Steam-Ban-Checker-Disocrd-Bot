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

// Ta clé d'API Steam
const steamApiKey = process.env.STEAM_API;

// Crawler ID
const crawlerId = "1";

// Ensemble pour garder une trace des profils déjà visités
const visitedProfiles = new Set();

// Fonction pour convertir les URLs personnalisées Steam en URLs avec steamID64
async function convertToSteamId64(profileUrl) {
  if (profileUrl.includes("/id/")) {
    const vanityUrl = profileUrl.split("/id/")[1].replace("/", "");
    const apiUrl = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${steamApiKey}&vanityurl=${vanityUrl}`;

    try {
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (data.response.success === 1) {
        const steamId64 = data.response.steamid;
        return `https://steamcommunity.com/profiles/${steamId64}/`;
      } else {
        console.error(`\x1b[41m\x1b[1mERROR\x1b[0m: ${data.response.message}`);
        return null;
      }
    } catch (error) {
      console.error(
        "\x1b[41m\x1b[1mERROR\x1b[0m: when requesting the Steam API :",
        error
      );
      return null;
    }
  } else {
    // Si c'est déjà une URL avec /profiles/, on retourne l'URL telle quelle
    return profileUrl;
  }
}

// Fonction pour obtenir le prochain profil à crawler
async function getNextProfile() {
  // Sélectionner le prochain profil non traité
  const { data: nextProfile, error } = await supabase
    .from("profil")
    .select("url")
    .eq("status", "pending")
    .limit(1);

  if (error) {
    console.error(
      "\x1b[41m\x1b[1mERROR\x1b[0m: when retrieving the next profile : ",
      error
    );
    return null;
  }

  if (nextProfile.length === 0) {
    console.log("\x1b[43m\x1b[1mUSER\x1b[0m: No profiles awaiting crawling.");
    return null;
  }

  const profileUrl = nextProfile[0].url;

  // Mettre à jour le statut de ce profil à 'in_progress'
  const { error: updateError } = await supabase
    .from("profil")
    .update({ status: "in_progress" })
    .eq("url", profileUrl);

  if (updateError) {
    console.error(
      "\x1b[41m\x1b[1mERROR\x1b[0m: when updating profile status : ",
      updateError
    );
    return null;
  }

  return profileUrl;
}

// Fonction pour marquer un profil comme terminé
async function markProfileAsDone(profileUrl) {
  const { error } = await supabase
    .from("profil")
    .update({ status: "done" })
    .eq("url", profileUrl);

  if (error) {
    console.error(
      "\x1b[41m\x1b[1mERROR\x1b[0m: when updating the profile status to 'done': ",
      error
    );
  } else {
    console.log(
      `\x1b[43m\x1b[1mUSER\x1b[0m: \x1b[45m\x1b[1m${profileUrl}\x1b[0m marked as completed.`
    );
  }
}

// Fonction pour ajouter un contact à la base de données dans la table "profil"
async function addContact(contactUrl) {
  // Vérifier si le contact existe déjà dans la table "profil"
  const { data: existingContact } = await supabase
    .from("profil")
    .select("*")
    .eq("url", contactUrl);

  if (existingContact.length > 0) {
    console.log(
      `\x1b[43m\x1b[1mUSER\x1b[0m: \x1b[43m\x1b[1m${contactUrl}\x1b[0m is already in the database.`
    );
    return;
  }

  // Ajouter le contact dans la table "profil" s'il n'existe pas
  const { data, error } = await supabase.from("profil").insert([
    {
      id_server: "crawler " + crawlerId,
      watcher_user: "crawler " + crawlerId,
      url: contactUrl, // Utilise l'URL avec steamID64
      watch_user: await scapName(contactUrl),
      ban: await scapBan(contactUrl),
      status: "pending", // Le profil est en attente d'être crawlé
    },
  ]);

  if (error) {
    console.error(
      "\x1b[41m\x1b[1mERROR\x1b[0m: \x1b[31m\x1b[1mError during database insertion :\x1b[0m",
      error
    );
  } else {
    console.log(
      `\x1b[43m\x1b[1mUSER\x1b[0m: \x1b[42m\x1b[1m${contactUrl}\x1b[0m successfully added.`
    );
  }
}

// Fonction pour récupérer les contacts d'un profil Steam depuis la page /friends/
async function fetchSteamFriends(profileUrl) {
  try {
    // Ajout de /friends/ à l'URL du profil pour accéder à la liste des amis
    const friendsUrl = `${profileUrl}friends/`;
    const { data: html } = await axios.get(friendsUrl);
    const $ = cheerio.load(html);

    // Scraping des URLs des amis depuis les éléments avec la classe .selectable_overlay
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
      `\x1b[41m\x1b[1mERROR\x1b[0m: \x1b[31m\x1b[1mretrieving Steam friends page :\x1b[31\x1b[0m ${error.message}`
    );
    return [];
  }
}

// Fonction principale pour crawler les contacts récursivement
async function crawlSteamProfile(startUrl = null) {
  // Si un profil de démarrage est fourni, ajouter ce profil dans la base de données s'il n'existe pas
  if (startUrl) {
    const normalizedProfileUrl = await convertToSteamId64(startUrl);
    if (normalizedProfileUrl) {
      await addContact(normalizedProfileUrl); // Ajouter le profil de départ à la base de données
    }
  }

  const profileUrl = startUrl || (await getNextProfile());

  if (!profileUrl) {
    console.log("\x1b[41m\x1b[1mERROR\x1b[0m: No profile available to crawl.");
    return;
  }

  // Vérifier si le profil a déjà été visité pour éviter les boucles infinies
  if (visitedProfiles.has(profileUrl)) {
    console.log(
      `\x1b[43m\x1b[1mUSER\x1b[0m: \x1b[46m\x1b[1m${profileUrl}\x1b[0m has already been visited. `
    );
    return;
  }

  // Ajouter le profil visité à l'ensemble
  visitedProfiles.add(profileUrl);

  // Convertir l'URL en steamID64 si nécessaire
  const normalizedProfileUrl = await convertToSteamId64(profileUrl);
  if (!normalizedProfileUrl) {
    console.error(
      "\x1b[41m\x1b[1mERROR\x1b[0m: \x1b[31m\x1b[1mUnable to convert URL to steamID64.\x1b[0m"
    );
    return;
  }

  // Récupérer les contacts depuis la page /friends/
  const contacts = await fetchSteamFriends(normalizedProfileUrl);

  for (const contactUrl of contacts) {
    const normalizedContactUrl = await convertToSteamId64(contactUrl); // Convertir les URLs des contacts également
    await addContact(normalizedContactUrl);

    // Récursivement crawler les contacts des contacts sans limite de profondeur
    await crawlSteamProfile(contactUrl);
  }

  // Marquer ce profil comme terminé
  await markProfileAsDone(profileUrl);
}

// Lancer le crawler avec le profil de démarrage spécifié
crawlSteamProfile(process.env.CRAWLER_SEED);
