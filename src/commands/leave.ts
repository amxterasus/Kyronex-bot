import { Command } from "@sapphire/framework";
import type { Message } from "discord.js";
import { prisma } from "../lib/database";
import { RoleIds } from "../types/enums";

export class LeaveCommand extends Command {
  public constructor(context: Command.LoaderContext) {
    super(context, {
      name: "leave",
      description: "leaves the current scrim.",
    });
  }

  public override async messageRun(message: Message) {
    if (!message.guild || !message.member) {
      return message.reply("This command can only be used in a server.");
    }

    if (!message.member?.roles.cache.has(RoleIds.Allowed)) {
      return message.reply("You do not have permission to create a scrim.");
    }

    const guildId = message.guild.id;
    const userId = message.author.id;

    const scrim = await prisma.scrim.findUnique({
      where: { guildId },
      include: { players: true },
    });

    if (!scrim) {
      return message.reply("No scrim exists.");
    }

    const player = scrim.players.find((p: any) => p.userId === userId);

    if (!player) {
      return message.reply("You are not part of this scrim.");
    }

    await prisma.scrim.delete({
      where: { guildId },
    });

    return message.reply(
      `${message.author.displayName} left the scrim.\n${
        scrim.players.length - 1
      }/${scrim.maxPlayers} players remaining.`
    );
  }
}
