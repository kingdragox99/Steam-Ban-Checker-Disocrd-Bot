const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function setupChanger(guildId, lang) {
  // Vérifier si le serveur existe dans la base de données
  const { data: existingServer, error: fetchError } = await supabase
    .from("discord")
    .select("*")
    .eq("id_server", guildId)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    console.error("Error checking for existing server:", fetchError.message);
    return;
  }

  // Mettre à jour la langue ou créer un nouveau serveur
  if (existingServer) {
    await updateServerLanguage(guildId, lang);
  } else {
    await createNewServer(guildId, lang);
  }
}

async function updateServerLanguage(guildId, lang) {
  const { error: updateError } = await supabase
    .from("discord")
    .update({ lang }) // Mettre à jour la langue directement
    .eq("id_server", guildId);

  if (updateError) {
    console.error("Error updating server language:", updateError.message);
    return;
  }

  console.log(
    `\x1b[41m\x1b[1mBOT:\x1b[0m GuildId:\x1b[33m\x1b[1m ${guildId} \x1b[0mhas updated lang to ${lang}`
  );
}

async function createNewServer(guildId, lang) {
  const newServer = { id_server: guildId, lang }; // Objet à créer pour un nouveau serveur
  const { error: createError } = await supabase
    .from("discord")
    .insert(newServer);

  if (createError) {
    console.error("Error creating new server:", createError.message);
    return;
  }

  console.log(
    `\x1b[41m\x1b[1mBOT:\x1b[0m GuildId:\x1b[33m\x1b[1m ${guildId} \x1b[0mhas created ${lang} channel`
  );
}

module.exports = setupChanger;
