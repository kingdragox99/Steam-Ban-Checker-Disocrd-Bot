const { SlashCommandBuilder } = require("@discordjs/builders");
const supabase = require("../modules/supabBaseConnect");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Test la latence du bot et de la base de données"),

  async execute(interaction) {
    try {
      // Mesurer la latence du bot
      const sent = await interaction.reply({
        content: "Calcul de la latence...",
        fetchReply: true,
      });
      const botLatency = sent.createdTimestamp - interaction.createdTimestamp;

      // Mesurer la latence de la base de données
      const dbStart = Date.now();
      await supabase.query(() =>
        supabase.supabase.from("server").select("id").limit(1)
      );
      const dbLatency = Date.now() - dbStart;

      await interaction.editReply(
        `🏓 Pong!\n` +
          `📡 Latence du bot: ${botLatency}ms\n` +
          `🗄️ Latence de la base de données: ${dbLatency}ms`
      );
    } catch (error) {
      console.error("\x1b[41m\x1b[1mERROR\x1b[0m: Ping command failed:", error);
      if (!interaction.replied) {
        await interaction.reply({
          content:
            "Une erreur s'est produite lors de l'exécution de la commande.",
          ephemeral: true,
        });
      }
    }
  },
};
