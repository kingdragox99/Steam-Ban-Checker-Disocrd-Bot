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
              { name: "Français (Belgique)", value: "fr_BE" },
              { name: "Español", value: "es_ES" },
              { name: "Deutsch", value: "de_DE" },
              { name: "Deutsch (Österreich)", value: "de_AT" },
              { name: "Polski", value: "pl_PL" },
              { name: "Dansk", value: "da_DK" },
              { name: "Türkçe", value: "tr_TR" },
              { name: "Nederlands", value: "nl_NL" },
              { name: "Nederlands (België)", value: "nl_BE" },
              { name: "Русский", value: "ru_RU" },
              { name: "中文", value: "zh_CN" },
              { name: "日本語", value: "ja_JP" },
              { name: "한국어", value: "ko_KR" },
              { name: "ไทย", value: "th_TH" },
              { name: "Svenska", value: "sv_SE" },
              { name: "Suomi", value: "fi_FI" },
              { name: "Português", value: "pt_PT" },
              { name: "Português do Brasil", value: "pt_BR" },
              { name: "العربية (السعودية)", value: "ar_SA" },
              { name: "العربية (المغرب)", value: "ar_MA" },
              { name: "العربية (الإمارات)", value: "ar_AE" },
              { name: "עברית", value: "he_IL" }
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
            fr_BE: "Français (Belgique)",
            es_ES: "Español",
            de_DE: "Deutsch",
            de_AT: "Deutsch (Österreich)",
            pl_PL: "Polski",
            da_DK: "Dansk",
            tr_TR: "Türkçe",
            nl_NL: "Nederlands",
            nl_BE: "Nederlands (België)",
            ru_RU: "Русский",
            zh_CN: "中文",
            ja_JP: "日本語",
            ko_KR: "한국어",
            th_TH: "ไทย",
            sv_SE: "Svenska",
            fi_FI: "Suomi",
            pt_PT: "Português",
            pt_BR: "Português do Brasil",
            ar_SA: "العربية (السعودية)",
            ar_MA: "العربية (المغرب)",
            ar_AE: "العربية (الإمارات)",
            he_IL: "עברית",
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
