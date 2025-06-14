import { Command } from "@sapphire/framework";
import type { Message } from "discord.js";
import { prisma } from "../lib/database";

export class ListCommand extends Command {
  public constructor(context: Command.LoaderContext) {
    super(context, {
      name: "list",
      description: "Lists players in the current scrim.",
    });
  }

  public override async messageRun(message: Message) {
    if (!message.guild || !message.member) {
      return message.reply("This command can only be used in a server.");
    }

    const guildId = message.guild.id;

    const scrim = await prisma.scrim.findUnique({
      where: { guildId },
      include: { players: true },
    });

    if (!scrim) {
      return message.reply("No scrim exists.");
    }

    if (scrim.players.length === 0) {
      return message.reply("No players have joined the scrim yet.");
    }

    const playerList = scrim.players.map((p: any) => p.userId).join(", ");

    return message.reply(`Players in the scrim: ${playerList}.`);
  }
}
