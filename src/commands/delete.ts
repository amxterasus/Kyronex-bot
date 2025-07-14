import { Command } from "@sapphire/framework";
import type { ChatInputCommandInteraction } from "discord.js";
import { MessageFlags, EmbedBuilder } from "discord.js";
import { prisma } from "../lib/database";
import { RoleIds } from "../types/enums";

export class DeleteCommand extends Command {
  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder.setName("delete").setDescription("Deletes the current scrim."),
      { idHints: ["1394135148857131060"] }
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
        content: "❌ You do not have permission to delete a scrim.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const guildId = guild.id;

    const scrim = await prisma.scrim.findUnique({ where: { guildId } });

    if (!scrim) {
      return interaction.reply({
        content: "⚠️ No scrim exists to delete.",
        flags: MessageFlags.Ephemeral,
      });
    }

    await prisma.scrim.delete({ where: { guildId } });

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("🗑️ Scrim Deleted")
      .setDescription(`The scrim has been successfully deleted.`)
      .setFooter({
        text: `Deleted by ${interaction.user.displayName}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
}
