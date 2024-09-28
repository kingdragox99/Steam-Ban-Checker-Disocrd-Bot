const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const setupCheckerInput = async (channelId) => {
  try {
    const { data, error } = await supabase
      .from("discord")
      .select("*")
      .eq("input", channelId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Error fetching channel: ${error.message}`);
    }

    return data || null; // Retourne les données ou null si aucune correspondance
  } catch (err) {
    console.error("Error:", err.message);
    throw err; // Rejeter l'erreur pour un traitement plus haut dans la chaîne
  }
};

module.exports = setupCheckerInput;
