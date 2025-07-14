import { type ChatInputCommand, Command } from "@sapphire/framework";
import { MessageFlags, EmbedBuilder } from "discord.js";
import { prisma } from "../lib/database";
import { RoleIds, Position } from "../types/enums";

export class JoinCommand extends Command {
  public override registerApplicationCommands(
    registry: ChatInputCommand.Registry
  ) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName("join")
        .setDescription("Join a scrim")
        .addStringOption((option) =>
          option
            .setName("position")
            .setDescription("Your role/position")
            .setRequired(true)
            .addChoices(
              ...Object.values(Position).map((p) => ({ name: p, value: p }))
            )
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
        content: "This command can only be used in a server.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const hasAllowedRole = Array.isArray(member.roles)
      ? member.roles.includes(RoleIds.Allowed)
      : member.roles.cache.has(RoleIds.Allowed);

    if (!hasAllowedRole) {
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setDescription("❌ You do not have permission to join a scrim.");
      return interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
    }

    const position = interaction.options
      .getString("position", true)
      .toUpperCase();
    const guildId = guild.id;
    const userId = interaction.user.id;

    const scrim = await prisma.scrim.findUnique({
      where: { guildId },
      include: { players: true },
    });

    if (!scrim) {
      return interaction.reply({
        content: "No scrim exists.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (scrim.players.some((p) => p.userId === userId)) {
      return interaction.reply({
        content: "You are already in the scrim.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (scrim.players.some((p) => p.position === position)) {
      return interaction.reply({
        content: `The position **${position}** is already taken.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (scrim.players.length >= scrim.maxPlayers) {
      return interaction.reply({
        content: "The scrim is already full.",
        flags: MessageFlags.Ephemeral,
      });
    }

    await prisma.scrim.update({
      where: { guildId },
      data: {
        players: {
          create: {
            userId,
            position,
          },
        },
      },
    });

    let embed = new EmbedBuilder()
      .setTitle(`✅ You joined the scrim at position: ${position}.`)
      .setColor("Green")
      .setDescription(`Link: ${scrim.link}`);
    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });

    embed = new EmbedBuilder()
      .setTitle(`${interaction.user.displayName} joined the scrim!`)
      .setColor("Green")
      .setDescription(
        `\nPosition: ${position}\n${(scrim?.players.length ?? 0) + 1}/${
          scrim?.maxPlayers
        } players joined.`
      )
      .setFooter({
        text: `Created by ${interaction.user.displayName}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();

    return await interaction.followUp({ embeds: [embed] });
  }
}
