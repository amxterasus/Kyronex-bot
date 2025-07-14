import { Command } from "@sapphire/framework";
import type { ChatInputCommandInteraction } from "discord.js";
import { EmbedBuilder, MessageFlags } from "discord.js";
import { prisma } from "../lib/database";
import type { Player } from "../types/interfaces";

export class ListCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder.setName("list").setDescription("Lists players in the current scrim."),
      { idHints: ["1394135154053873705"] }
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;

    if (!guild) {
      return interaction.reply({
        content: "❌ This command can only be used in a server.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const scrim = await prisma.scrim.findUnique({
      where: { guildId: guild.id },
      include: { players: true },
    });

    if (!scrim) {
      return interaction.reply({
        content: "⚠️ No scrim exists.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (scrim.players.length === 0) {
      return interaction.reply({
        content: "ℹ️ No players have joined the scrim yet.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const playerLines = await Promise.all(
      scrim.players.map(async (p: Player, index: number) => {
        try {
          const member = await guild.members.fetch(p.userId);
          return `**${index + 1}.** ${member.displayName} — \`${p.position}\``;
        } catch {
          return `**${index + 1}.** Unknown User (\`${p.userId}\`) — \`${p.position}\``;
        }
      })
    );

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("📋 Scrim Player List")
      .setDescription(playerLines.join("\n"))
      .setFooter({
        text: `${scrim.players.length}/${scrim.maxPlayers} players joined`,
      })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
}
