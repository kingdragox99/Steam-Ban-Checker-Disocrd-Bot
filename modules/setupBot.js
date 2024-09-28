const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const channelId = (way, channel) =>
  way === "input" ? { input: channel } : { output: channel };

async function setupBot(guild, channel, way) {
  const guildId = { id_server: guild };

  try {
    // Vérifier si l'id_server existe déjà
    const { data, error: fetchError } = await supabase
      .from("discord")
      .select("*")
      .eq("id_server", guild)
      .single(); // On suppose que l'id_server est unique

    if (fetchError && fetchError.code !== "PGRST116") {
      throw new Error(`Error fetching data: ${fetchError.message}`);
    }

    if (data) {
      await updateChannel(guild, way, channel);
    } else {
      await insertServer(guild, way, channel);
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

async function updateChannel(guild, way, channel) {
  const { error: updateError } = await supabase
    .from("discord")
    .update({ ...channelId(way, channel) })
    .eq("id_server", guild);

  if (updateError) {
    throw new Error(`Error updating channel: ${updateError.message}`);
  }

  console.log(
    `\x1b[41m\x1b[1mBOT:\x1b[0m GuildId:\x1b[33m\x1b[1m ${guild} \x1b[0mhas updated ${way} channel`
  );
}

async function insertServer(guild, way, channel) {
  const { error: insertError } = await supabase
    .from("discord")
    .insert({ id_server: guild, ...channelId(way, channel), lang: "en_EN" });

  if (insertError) {
    throw new Error(`Error inserting server: ${insertError.message}`);
  }

  console.log(
    `\x1b[41m\x1b[1mBOT:\x1b[0m GuildId:\x1b[33m\x1b[1m ${guild} \x1b[0mhas created ${way} channel`
  );
}

module.exports = setupBot;
