import { Command } from "@sapphire/framework";
import type { ChatInputCommandInteraction } from "discord.js";
import { MessageFlags, EmbedBuilder } from "discord.js";
import { prisma } from "../lib/database";
import { RoleIds } from "../types/enums";

export class KickCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName("kick")
        .setDescription("Kick a player from the current scrim.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("User to kick")
            .setRequired(true)
        )
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
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
        content: "❌ You do not have permission to kick players.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const userToKick = interaction.options.getUser("user", true);

    if (userToKick.id === interaction.user.id) {
      return interaction.reply({
        content: "❌ You cannot kick yourself.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const guildId = guild.id;

    const scrim = await prisma.scrim.findUnique({
      where: { guildId },
      include: { players: true },
    });

    if (!scrim) {
      return interaction.reply({
        content: "⚠️ No scrim exists.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const player = scrim.players.find((p) => p.userId === userToKick.id);

    if (!player) {
      return interaction.reply({
        content: "❌ User is not part of this scrim.",
        flags: MessageFlags.Ephemeral,
      });
    }

    await prisma.scrim.update({
      where: { guildId },
      data: {
        players: {
          delete: { id: player.id },
        },
      },
    });

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("Player Kicked")
      .setDescription(
        `${userToKick.displayName} has been kicked from the scrim.`
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
}
