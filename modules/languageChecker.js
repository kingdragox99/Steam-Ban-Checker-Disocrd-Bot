const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const langChecker = async (guildId) => {
  try {
    const { data, error } = await supabase
      .from("discord")
      .select("*")
      .eq("id_server", guildId)
      .single(); // Récupérer une seule ligne

    // Gestion des erreurs
    if (error && error.code !== "PGRST116") {
      throw new Error(`Error fetching server: ${error.message}`);
    }

    return data || null; // Retourne les données ou null si non trouvé
  } catch (err) {
    console.error("Error:", err.message);
    throw err; // Rejeter l'erreur pour un traitement plus haut dans la chaîne
  }
};

module.exports = langChecker;
