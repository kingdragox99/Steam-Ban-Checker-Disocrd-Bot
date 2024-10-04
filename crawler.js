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

// bug ajout nom dans la db

// Ta clé d'API Steam
const steamApiKey = process.env.STEAM_API;

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
        console.error(`Erreur : ${data.response.message}`);
        return null;
      }
    } catch (error) {
      console.error("Erreur lors de la requête vers l'API Steam :", error);
      return null;
    }
  } else {
    // Si c'est déjà une URL avec /profiles/, on retourne l'URL telle quelle
    return profileUrl;
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
    console.log(`Le contact ${contactUrl} est déjà dans la base de données.`);
    return;
  }

  // Ajouter le contact dans la table "profil" s'il n'existe pas
  const { data, error } = await supabase.from("profil").insert([
    {
      id_server: "crawler",
      watcher_user: "crawler",
      url: contactUrl, // Utilise l'URL avec steamID64
      watch_user: await scapName(contactUrl),
      ban: await scapBan(contactUrl),
    },
  ]);

  if (error) {
    console.error(
      "Erreur lors de l'insertion dans la base de données :",
      error
    );
  } else {
    console.log(`Contact ${contactUrl} ajouté avec succès.`);
  }
}

// Fonction pour récupérer les contacts d'un profil Steam
async function fetchSteamContacts(profileUrl) {
  try {
    const { data: html } = await axios.get(profileUrl);
    const $ = cheerio.load(html);

    // Scraping des URL des contacts
    const contacts = [];
    $("a.friendBlockLinkOverlay").each((index, element) => {
      const contactUrl = $(element).attr("href");
      contacts.push(contactUrl);
    });

    return contacts;
  } catch (error) {
    console.error(
      `Erreur lors de la récupération du profil Steam: ${error.message}`
    );
    return [];
  }
}

// Fonction principale pour crawler les contacts récursivement
async function crawlSteamProfile(profileUrl) {
  // Vérifier si le profil a déjà été visité pour éviter les boucles infinies
  if (visitedProfiles.has(profileUrl)) {
    console.log(`Le profil ${profileUrl} a déjà été visité.`);
    return;
  }

  // Ajouter le profil visité à l'ensemble
  visitedProfiles.add(profileUrl);

  // Convertir l'URL en steamID64 si nécessaire
  const normalizedProfileUrl = await convertToSteamId64(profileUrl);
  if (!normalizedProfileUrl) {
    console.error("Impossible de convertir l'URL en steamID64.");
    return;
  }

  // Récupérer les contacts du profil
  const contacts = await fetchSteamContacts(normalizedProfileUrl);

  for (const contactUrl of contacts) {
    const normalizedContactUrl = await convertToSteamId64(contactUrl); // Convertir les URLs des contacts également
    await addContact(normalizedContactUrl);

    // Récursivement crawler les contacts des contacts sans limite de profondeur
    await crawlSteamProfile(contactUrl);
  }
}

// URL du profil Steam de départ (nom personnalisé ou ID numérique)
const startProfileUrl = process.env.CRAWLER_SEED;

// Lancer le crawler
crawlSteamProfile(startProfileUrl);
