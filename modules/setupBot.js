const { supabase } = require("./supabBaseConnect");

async function setupCheckerInput(channelId) {
  try {
    const { data, error } = await supabase
      .from("discord")
      .select("*")
      .eq("input", channelId);

    if (error) {
      console.error(
        "\x1b[41m\x1b[1mERROR\x1b[0m: Failed to check input channel:",
        error
      );
      return null;
    }

    return data && data.length > 0 ? { input: true } : null;
  } catch (error) {
    console.error(
      "\x1b[41m\x1b[1mERROR\x1b[0m: Error in setupCheckerInput:",
      error
    );
    return null;
  }
}

async function setupInput(guildId, channelId) {
  try {
    console.log(
      `\x1b[44m\x1b[1mINFO\x1b[0m: Setting up input channel for server ${guildId}`
    );

    // Vérifier si le serveur existe déjà
    const { data: existingServer, error: checkError } = await supabase
      .from("discord")
      .select("*")
      .eq("id_server", guildId)
      .single();

    if (checkError) {
      if (checkError.code === "PGRST116") {
        console.log(
          `\x1b[44m\x1b[1mINFO\x1b[0m: Server ${guildId} not found, creating new entry`
        );
      } else {
        console.error(
          "\x1b[41m\x1b[1mERROR\x1b[0m: Failed to check server:",
          checkError
        );
        return false;
      }
    }

    if (existingServer) {
      console.log(
        `\x1b[44m\x1b[1mINFO\x1b[0m: Updating existing server ${guildId}`
      );
      // Mettre à jour le canal d'entrée
      const { error: updateError } = await supabase
        .from("discord")
        .update({ input: channelId })
        .eq("id_server", guildId);

      if (updateError) {
        console.error(
          "\x1b[41m\x1b[1mERROR\x1b[0m: Failed to update input channel:",
          updateError
        );
        return false;
      }
    } else {
      console.log(
        `\x1b[44m\x1b[1mINFO\x1b[0m: Creating new server entry for ${guildId}`
      );
      // Créer une nouvelle entrée
      const { error: insertError } = await supabase.from("discord").insert([
        {
          id_server: guildId,
          input: channelId,
          output: null,
          lang: "en_EN",
        },
      ]);

      if (insertError) {
        console.error(
          "\x1b[41m\x1b[1mERROR\x1b[0m: Failed to insert server config:",
          insertError
        );
        return false;
      }
    }

    console.log(
      `\x1b[42m\x1b[1mSUCCESS\x1b[0m: Input channel set for server ${guildId}`
    );
    return true;
  } catch (error) {
    console.error("\x1b[41m\x1b[1mERROR\x1b[0m: Error in setupInput:", error);
    return false;
  }
}

async function setupOutput(guildId, channelId) {
  try {
    console.log(
      `\x1b[44m\x1b[1mINFO\x1b[0m: Setting up output channel for server ${guildId}`
    );

    // Vérifier si le serveur existe déjà
    const { data: existingServer, error: checkError } = await supabase
      .from("discord")
      .select("*")
      .eq("id_server", guildId)
      .single();

    if (checkError) {
      if (checkError.code === "PGRST116") {
        console.log(
          `\x1b[44m\x1b[1mINFO\x1b[0m: Server ${guildId} not found, creating new entry`
        );
      } else {
        console.error(
          "\x1b[41m\x1b[1mERROR\x1b[0m: Failed to check server:",
          checkError
        );
        return false;
      }
    }

    if (existingServer) {
      console.log(
        `\x1b[44m\x1b[1mINFO\x1b[0m: Updating existing server ${guildId}`
      );
      // Mettre à jour le canal de sortie
      const { error: updateError } = await supabase
        .from("discord")
        .update({ output: channelId })
        .eq("id_server", guildId);

      if (updateError) {
        console.error(
          "\x1b[41m\x1b[1mERROR\x1b[0m: Failed to update output channel:",
          updateError
        );
        return false;
      }
    } else {
      console.log(
        `\x1b[44m\x1b[1mINFO\x1b[0m: Creating new server entry for ${guildId}`
      );
      // Créer une nouvelle entrée
      const { error: insertError } = await supabase.from("discord").insert([
        {
          id_server: guildId,
          input: null,
          output: channelId,
          lang: "en_EN",
        },
      ]);

      if (insertError) {
        console.error(
          "\x1b[41m\x1b[1mERROR\x1b[0m: Failed to insert server config:",
          insertError
        );
        return false;
      }
    }

    console.log(
      `\x1b[42m\x1b[1mSUCCESS\x1b[0m: Output channel set for server ${guildId}`
    );
    return true;
  } catch (error) {
    console.error("\x1b[41m\x1b[1mERROR\x1b[0m: Error in setupOutput:", error);
    return false;
  }
}

module.exports = {
  setupCheckerInput,
  setupInput,
  setupOutput,
};
