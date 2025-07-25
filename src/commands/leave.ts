import { Command } from "@sapphire/framework";
import type { ChatInputCommandInteraction } from "discord.js";
import { MessageFlags, EmbedBuilder } from "discord.js";
import { prisma } from "../lib/database";

export class LeaveCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder.setName("leave").setDescription("Leave the current scrim."),
      { idHints: ["1394135151608332390"] }
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

    const guildId = guild.id;
    const userId = interaction.user.id;

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

    const player = scrim.players.find((p) => p.userId === userId);

    if (!player) {
      return interaction.reply({
        content: "❌ You are not part of this scrim.",
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
      .setColor("Blue")
      .setTitle(`${interaction.user.displayName} left the scrim`)
      .setDescription(
        `${interaction.user.displayName} left the scrim.\n**${
          scrim.players.length - 1
        }/${scrim.maxPlayers}** players remaining.`
      )
      .setFooter({
        text: `Scrim left`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
}
