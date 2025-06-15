import { Command } from "@sapphire/framework";
import type { Message } from "discord.js";
import { prisma } from "../lib/database";
import { RoleIds } from "../types/enums";

export class CreateCommand extends Command {
  public constructor(context: Command.LoaderContext) {
    super(context, {
      name: "create",
      description: "Creates a scrim.",
    });
  }

  public override async messageRun(message: Message) {
    if (!message.guild || !message.member) {
      return message.reply("This command can only be used in a server.");
    }

    if (!message.member?.roles.cache.has(RoleIds.Manager)) {
      return message.reply("You do not have permission to create a scrim.");
    }

    const args = message.content.trim().split(/ +/);
    const link = args[1];

    const guildId = message.guild.id;

    if (await prisma.scrim.findUnique({ where: { guildId } })) {
      await message.reply("A scrim already exists.");
      return;
    }

    if (!link) {
      await message.reply("Please provide a link for the scrim.");
      return;
    }

    const isValidLink = /^https:\/\/www\.roblox\.com\/share\?code=[\w\d]+(&type=\w+)?$/.test(link);


    if (!isValidLink) {
      return message.reply("Please provide a valid Roblox share link.");
    }

    await prisma.scrim.create({
      data: {
        guildId,
        link,
        maxPlayers: 5,
      },
    });

    return message.reply("Scrim created!");
  }
}
