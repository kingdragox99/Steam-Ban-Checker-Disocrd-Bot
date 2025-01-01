const { SlashCommandBuilder } = require("discord.js");
const { supabase } = require("../modules/supabBaseConnect");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Vérifie la latence du bot et de la base de données"),

  async execute(interaction) {
    try {
      // Mesurer la latence du bot
      const sent = await interaction.reply({
        content: "Mesure de la latence...",
        ephemeral: true,
        fetchReply: true,
      });
      const botLatency = sent.createdTimestamp - interaction.createdTimestamp;

      // Mesurer la latence de la base de données
      const dbStart = Date.now();
      const { error } = await supabase.from("discord").select("id").limit(1);
      const dbLatency = Date.now() - dbStart;

      if (error) throw error;

      await interaction.editReply({
        content:
          `🏓 Pong!\n` +
          `Bot: ${botLatency}ms\n` +
          `Base de données: ${dbLatency}ms`,
        ephemeral: true,
      });
    } catch (error) {
      console.error("\x1b[41m\x1b[1mERROR\x1b[0m: Ping command failed:", error);
      await interaction.editReply({
        content: "Une erreur est survenue lors de la mesure de la latence.",
        ephemeral: true,
      });
    }
  },
};
