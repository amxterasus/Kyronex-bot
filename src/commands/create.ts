import { Command } from "@sapphire/framework";
import { MessageFlags, EmbedBuilder } from "discord.js";
import { prisma } from "../lib/database";
import { RoleIds } from "../types/enums";

export class CreateCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName("create")
        .setDescription("Creates a scrim.")
        .addStringOption((option) =>
          option
            .setName("link")
            .setDescription("Roblox share link")
            .setRequired(true)
        )
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputCommandInteraction
  ) {
    const guild = interaction.guild;
    const member = interaction.member;

    if (!guild || !member || !("roles" in member)) {
      return interaction.reply({
        content: "❌ This command can only be used in a server.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const hasPermission = Array.isArray(member.roles)
      ? member.roles.includes(RoleIds.Manager)
      : member.roles.cache.has(RoleIds.Manager);

    if (!hasPermission) {
      return interaction.reply({
        content: "❌ You do not have permission to create a scrim.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const link = interaction.options.getString("link", true);
    const guildId = guild.id;

    const scrimExists = await prisma.scrim.findUnique({ where: { guildId } });

    if (scrimExists) {
      return interaction.reply({
        content: "⚠️ A scrim already exists.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const isValidLink =
      /^https:\/\/www\.roblox\.com\/share\?code=[\w\d]+(&type=\w+)?$/.test(
        link
      );

    if (!isValidLink) {
      return interaction.reply({
        content: "❌ Please provide a valid Roblox share link.",
        flags: MessageFlags.Ephemeral,
      });
    }

    await prisma.scrim.create({
      data: {
        guildId,
        link,
        maxPlayers: 5,
      },
    });

    let embed = new EmbedBuilder()
      .setTitle("✅ Scrim Created")
      .setColor("Green")
      .setDescription("The scrim has been successfully created.")
      .setFooter({
        text: `Created by ${interaction.user.displayName}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    embed = new EmbedBuilder()
      .setColor("Blue")
      .setDescription(
        `ℹ️ A new scrim has been created. Use \`/join [position]\` to join the scrim.`
      )
      .setFooter({
        text: `Scrim created`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();

    return interaction.followUp({ embeds: [embed] });
  }
}
