import { Command } from "@sapphire/framework";
import type { Message } from "discord.js";
import { prisma } from "../lib/database";
import { RoleIds } from "../types/enums";

export class DeleteCommand extends Command {
  public constructor(context: Command.LoaderContext) {
    super(context, {
      name: "delete",
      description: "Deletes a scrim.",
    });
  }

  public override async messageRun(message: Message) {
    if (!message.guild || !message.member) {
      return message.reply("This command can only be used in a server.");
    }

    if (!message.member?.roles.cache.has(RoleIds.Manager)) {
      return message.reply("You do not have permission to create a scrim.");
    }

    const guildId = message.guild.id;

    const scrim = await prisma.scrim.findUnique({
      where: { guildId },
    });

    if (!scrim) {
      return message.reply("No scrim exists.");
    }

    await prisma.scrim.delete({
      where: { guildId },
    });

    return message.reply(`The scrim has been deleted.`);
  }
}
