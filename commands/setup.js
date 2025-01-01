const { SlashCommandBuilder } = require("@discordjs/builders");
const supabase = require("../modules/supabBaseConnect");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Configure the bot for your server")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("input")
        .setDescription("Set the input channel for Steam profiles")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("The channel to use for input")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("output")
        .setDescription("Set the output channel for ban notifications")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("The channel to use for output")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("language")
        .setDescription("Set the bot language")
        .addStringOption((option) =>
          option
            .setName("lang")
            .setDescription("Choose the language")
            .setRequired(true)
            .addChoices(
              { name: "English", value: "en_EN" },
              { name: "Français", value: "fr_FR" },
              { name: "Español", value: "es_ES" }
            )
        )
    ),

  async execute(interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      const guildId = interaction.guildId;
      const guildName = interaction.guild.name;

      // Check if server already exists
      const { data: existingServer } = await supabase.select("server", "*", {
        where: { guild_id: guildId },
      });

      switch (subcommand) {
        case "input": {
          const channel = interaction.options.getChannel("channel");
          const updateData = {
            input_channel: channel.id,
          };

          if (existingServer && existingServer.length > 0) {
            await supabase.update("server", updateData, { guild_id: guildId });
          } else {
            await supabase.insert("server", {
              guild_id: guildId,
              ...updateData,
            });
          }

          console.log(
            `\x1b[42m\x1b[1mSETUP\x1b[0m: Input channel configured\n` +
              `Server: ${guildName} (${guildId})\n` +
              `Channel: #${channel.name} (${channel.id})`
          );

          await interaction.reply({
            content: `Input channel set to ${channel}`,
            ephemeral: true,
          });
          break;
        }

        case "output": {
          const channel = interaction.options.getChannel("channel");
          const updateData = {
            output_channel: channel.id,
          };

          if (existingServer && existingServer.length > 0) {
            await supabase.update("server", updateData, { guild_id: guildId });
          } else {
            await supabase.insert("server", {
              guild_id: guildId,
              ...updateData,
            });
          }

          console.log(
            `\x1b[42m\x1b[1mSETUP\x1b[0m: Output channel configured\n` +
              `Server: ${guildName} (${guildId})\n` +
              `Channel: #${channel.name} (${channel.id})`
          );

          await interaction.reply({
            content: `Output channel set to ${channel}`,
            ephemeral: true,
          });
          break;
        }

        case "language": {
          const lang = interaction.options.getString("lang");
          const updateData = {
            lang: lang,
          };

          if (existingServer && existingServer.length > 0) {
            await supabase.update("server", updateData, { guild_id: guildId });
          } else {
            await supabase.insert("server", {
              guild_id: guildId,
              ...updateData,
            });
          }

          console.log(
            `\x1b[42m\x1b[1mSETUP\x1b[0m: Language configured\n` +
              `Server: ${guildName} (${guildId})\n` +
              `Language: ${lang}`
          );

          await interaction.reply({
            content: `Bot language set to ${lang}`,
            ephemeral: true,
          });
          break;
        }
      }
    } catch (error) {
      console.error(
        "\x1b[41m\x1b[1mERROR\x1b[0m: Command execution failed:",
        error
      );
      await interaction.reply({
        content: "There was an error executing this command.",
        ephemeral: true,
      });
    }
  },
};
