const { SlashCommandBuilder } = require("discord.js");
const { setupInput, setupOutput } = require("../modules/setupBot");
const { supabase } = require("../modules/supabBaseConnect");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Configure le bot pour ce serveur")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("input")
        .setDescription("Définit le canal d'entrée pour les profils Steam")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription(
              "Le canal où les utilisateurs peuvent poster des profils Steam"
            )
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("output")
        .setDescription(
          "Définit le canal de sortie pour les notifications de ban"
        )
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription(
              "Le canal où seront envoyées les notifications de ban"
            )
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("lang")
        .setDescription("Définit la langue du bot pour ce serveur")
        .addStringOption((option) =>
          option
            .setName("language")
            .setDescription("La langue à utiliser")
            .setRequired(true)
            .addChoices(
              { name: "English", value: "en_EN" },
              { name: "Français", value: "fr_FR" },
              { name: "Español", value: "es_ES" },
              { name: "Русский", value: "ru_RU" },
              { name: "Polski", value: "pl_PL" },
              { name: "Dansk", value: "da_DK" },
              { name: "Português", value: "pt_PT" },
              { name: "Português do Brasil", value: "pt_BR" },
              { name: "ไทย", value: "th_TH" },
              { name: "한국어", value: "ko_KR" },
              { name: "日本語", value: "ja_JP" },
              { name: "Türkçe", value: "tr_TR" }
            )
        )
    ),

  async execute(interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      const guildId = interaction.guildId;

      switch (subcommand) {
        case "input": {
          const channel = interaction.options.getChannel("channel");
          const success = await setupInput(guildId, channel.id);

          if (success) {
            await interaction.reply({
              content: `Le canal d'entrée a été défini sur ${channel}`,
              ephemeral: true,
            });
          } else {
            await interaction.reply({
              content:
                "Une erreur est survenue lors de la configuration du canal d'entrée.",
              ephemeral: true,
            });
          }
          break;
        }

        case "output": {
          const channel = interaction.options.getChannel("channel");
          const success = await setupOutput(guildId, channel.id);

          if (success) {
            await interaction.reply({
              content: `Le canal de sortie a été défini sur ${channel}`,
              ephemeral: true,
            });
          } else {
            await interaction.reply({
              content:
                "Une erreur est survenue lors de la configuration du canal de sortie.",
              ephemeral: true,
            });
          }
          break;
        }

        case "lang": {
          const lang = interaction.options.getString("language");
          const langNames = {
            en_EN: "English",
            fr_FR: "Français",
            es_ES: "Español",
            ru_RU: "Русский",
            pl_PL: "Polski",
            da_DK: "Dansk",
            pt_PT: "Português",
            pt_BR: "Português do Brasil",
            th_TH: "ไทย",
            ko_KR: "한국어",
            ja_JP: "日本語",
            tr_TR: "Türkçe",
          };

          try {
            const { error } = await supabase
              .from("discord")
              .update({ lang })
              .eq("id_server", guildId);

            if (error) throw error;

            await interaction.reply({
              content: `La langue a été définie sur ${langNames[lang]}`,
              ephemeral: true,
            });
          } catch (error) {
            console.error(
              "\x1b[41m\x1b[1mERROR\x1b[0m: Failed to update language:",
              error
            );
            await interaction.reply({
              content:
                "Une erreur est survenue lors de la configuration de la langue.",
              ephemeral: true,
            });
          }
          break;
        }
      }
    } catch (error) {
      console.error(
        "\x1b[41m\x1b[1mERROR\x1b[0m: Setup command failed:",
        error
      );
      await interaction.reply({
        content: "Une erreur est survenue lors de l'exécution de la commande.",
        ephemeral: true,
      });
    }
  },
};
